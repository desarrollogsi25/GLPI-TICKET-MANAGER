using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Mapping;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Application.Services;

/// <summary>
/// Implements the native GLPI planning of a ticket.
/// </summary>
/// <remarks>
/// <para>
/// The central invariant: this service never writes status 3. A ticket becomes
/// "En proceso (planificado)" because GLPI derives it from the tasks
/// (<c>CommonITILTask::post_addItem()</c> → <c>ParentStatus::updateParentStatus()</c>).
/// Every method therefore mutates a task and then reads the resulting status back from
/// GLPI, returning what GLPI actually stored instead of what the caller asked for.
/// </para>
/// <para>
/// Two GLPI 11 behaviours shape the design and are covered by tests:
/// </para>
/// <list type="bullet">
/// <item>Completing a task (state 2) recomputes the parent status, so completing the last
/// planned task returns the ticket to assigned (2) or new (1) by itself.</item>
/// <item>Deleting a task does <b>not</b> recompute it, so cancelling has to reconcile the
/// status explicitly.</item>
/// </list>
/// </remarks>
public sealed class TicketPlanningService : ITicketPlanningService
{
    /// <summary>Statuses in which planning is meaningful.</summary>
    private static readonly int[] PlannableStatuses =
    [
        (int)TicketStatus.New,
        (int)TicketStatus.Assigned,
        (int)TicketStatus.Planned,
        (int)TicketStatus.Waiting
    ];

    /// <summary>
    /// Clock skew tolerated before a start date counts as "in the past". A form opened a
    /// few minutes ago must not be rejected because the user took a while to submit.
    /// </summary>
    private static readonly TimeSpan PastTolerance = TimeSpan.FromMinutes(5);

    private static readonly TimeSpan MinimumDuration = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan MaximumDuration = TimeSpan.FromHours(24);

    private const int MaximumContentLength = 5000;
    // GLPI 11 stores TicketTask UUIDs in a bounded VARCHAR column.
    private const int MaximumIdempotencyKeyLength = 64;
    private const int MaximumAttempts = 3;

    private readonly ITicketRepository _tickets;
    private readonly ITicketTaskRepository _tasks;
    private readonly IPlanningIdempotencyRepository _idempotency;
    private readonly IGlpiApiClient _glpi;
    private readonly ITicketAccessPolicy _policy;
    private readonly TimeProvider _time;
    private readonly ILogger<TicketPlanningService> _logger;

    public TicketPlanningService(
        ITicketRepository tickets,
        ITicketTaskRepository tasks,
        IPlanningIdempotencyRepository idempotency,
        IGlpiApiClient glpi,
        ITicketAccessPolicy policy,
        TimeProvider time,
        ILogger<TicketPlanningService> logger)
    {
        _tickets = tickets;
        _tasks = tasks;
        _idempotency = idempotency;
        _glpi = glpi;
        _policy = policy;
        _time = time;
        _logger = logger;
    }

    public async Task<TicketPlanningDto> GetPlanningAsync(
        int ticketId,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        await EnsureCanViewAsync(ticketId, userId, role, cancellationToken);

        var state = await _glpi.GetTicketStateAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException($"El ticket {ticketId} no existe en GLPI.");

        return await ReadPlanningAsync(ticketId, state, userId, role, cancellationToken);
    }

    public async Task<TicketPlanningDto> PlanAsync(
        int ticketId,
        PlanTicketRequest request,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var content = NormalizeContent(request.Content);
        var timeZoneId = NormalizeTimeZone(request.TimeZoneId);
        var (beginUtc, endUtc) = ResolveWindow(request.Begin, request.End, request.DurationMinutes);
        var idempotencyKey = NormalizeIdempotencyKey(request.IdempotencyKey);
        var uuid = idempotencyKey ?? Guid.NewGuid().ToString("N");
        var payloadSha256 = idempotencyKey is null
            ? null
            : ComputePlanningPayloadHash(
                ticketId,
                content,
                request.TechnicianId,
                beginUtc,
                endUtc,
                timeZoneId,
                request.IsPrivate);

        if (!await _policy.CanPlanAsync(userId, role, ticketId, request.TechnicianId, cancellationToken))
        {
            throw new ForbiddenException(
                "No tienes permiso para planificar este ticket para ese técnico.");
        }

        var ticket = await RequireTicketAsync(ticketId, cancellationToken);
        EnsurePlannable(ticket);

        var createRequest = new CreateTicketTaskRequest(
            ticketId,
            content,
            request.TechnicianId,
            beginUtc,
            endUtc,
            request.IsPrivate,
            uuid);

        PlanningReservation? reservation = null;
        if (idempotencyKey is not null)
        {
            reservation = await _idempotency.AcquireAsync(
                idempotencyKey,
                ticketId,
                payloadSha256!,
                cancellationToken);

            if (reservation.Disposition == PlanningReservationDisposition.PayloadConflict)
            {
                throw new ConflictException("La clave de idempotencia ya se usó con otra solicitud.");
            }

            if (reservation.Disposition == PlanningReservationDisposition.Completed)
            {
                return await ReturnConfirmedReservationAsync(
                    ticketId, ticket, userId, role, createRequest, reservation.GlpiTaskId, cancellationToken);
            }

            if (reservation.Disposition == PlanningReservationDisposition.InProgress)
            {
                GlpiTicketTask? adopted = null;
                for (var attempt = 0; attempt < 8 && adopted is null; attempt++)
                {
                    adopted = await TryAdoptAsync(createRequest, cancellationToken);
                    if (adopted is null && attempt < 7)
                    {
                        await Task.Delay(TimeSpan.FromMilliseconds(200), cancellationToken);
                    }
                }

                if (adopted is null)
                {
                    throw new ConflictException("La operación de planificación con esta clave sigue en curso. Reintenta con la misma clave.");
                }

                await _idempotency.CompleteAsync(
                    idempotencyKey, ticketId, payloadSha256!, adopted.Id, cancellationToken);
                return await ReturnConfirmedReservationAsync(
                    ticketId, ticket, userId, role, createRequest, adopted.Id, cancellationToken);
            }

            // Adopt tasks written by an older API instance before the durable ledger existed.
            var legacyTask = await TryAdoptAsync(createRequest, cancellationToken);
            if (legacyTask is not null)
            {
                await _idempotency.CompleteAsync(
                    idempotencyKey, ticketId, payloadSha256!, legacyTask.Id, cancellationToken);
                return await ReturnConfirmedReservationAsync(
                    ticketId, ticket, userId, role, createRequest, legacyTask.Id, cancellationToken);
            }
        }

        try
        {
            await EnsureNoConflictAsync(request.TechnicianId, beginUtc, endUtc, null, cancellationToken);
        }
        catch (ConflictException) when (idempotencyKey is not null)
        {
            await _idempotency.ReleaseAsync(idempotencyKey, ticketId, payloadSha256!, cancellationToken);
            throw;
        }

        var created = await CreateWithReconciliationAsync(createRequest, cancellationToken);
        if (idempotencyKey is not null)
        {
            await _idempotency.CompleteAsync(
                idempotencyKey,
                ticketId,
                payloadSha256!,
                created.Id,
                cancellationToken);
        }

        _logger.LogInformation(
            "Scheduled task {TaskId} for ticket {TicketId} technician {TechnicianId} ({Begin:o} → {End:o})",
            created.Id,
            ticketId,
            request.TechnicianId,
            beginUtc,
            endUtc);

        // GLPI owns the status transition. Reading it back is the proof that the task
        // really produced "En proceso (planificado)".
        var state = await ReadBackStateAsync(ticketId, cancellationToken);
        if (state.Status != (int)TicketStatus.Planned)
        {
            _logger.LogWarning(
                "GLPI created planned task {TaskId} but ticket {TicketId} is status {Status}",
                created.Id, ticketId, state.Status);
            throw new ConflictException(
                $"GLPI creó la tarea {created.Id}, pero no confirmó el estado En proceso (actual: {state.Status}). Revisa GLPI antes de repetir.",
                "glpi_unconfirmed",
                new Dictionary<string, object?> { ["taskId"] = created.Id, ["ticketStatus"] = state.Status });
        }

        return await ReadPlanningAsync(ticketId, state, userId, role, cancellationToken);
    }

    public async Task<TicketPlanningDto> RescheduleAsync(
        int ticketId,
        int taskId,
        RescheduleTicketRequest request,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var task = await RequireTaskAsync(ticketId, taskId, cancellationToken);
        var ticket = await RequireTicketAsync(ticketId, cancellationToken);
        EnsurePlannable(ticket);

        if (!await _policy.CanManagePlanningAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException("No tienes permiso para reprogramar este ticket.");
        }

        if (task.State == (int)TicketTaskState.Done)
        {
            throw new UnprocessableEntityException(
                "No se puede reprogramar una tarea ya realizada. Crea una nueva planificación.");
        }

        var technicianId = request.TechnicianId ?? task.TechnicianId;
        if (technicianId != task.TechnicianId
            && !await _policy.CanPlanAsync(userId, role, ticketId, technicianId, cancellationToken))
        {
            throw new ForbiddenException(
                "No tienes permiso para asignar la tarea a ese técnico.");
        }

        var content = request.Content is null ? task.Content : NormalizeContent(request.Content);

        DateTime? beginUtc = null;
        DateTime? endUtc = null;
        if (request.Begin.HasValue || request.End.HasValue || request.DurationMinutes.HasValue)
        {
            var start = request.Begin;
            if (start is null)
            {
                if (task.Begin is null)
                {
                    throw new ValidationException(
                        "begin",
                        "La tarea no tiene fecha de inicio; indica una para reprogramarla.");
                }

                start = new DateTimeOffset(AsUtc(task.Begin), TimeSpan.Zero);
            }

            var (resolvedBegin, resolvedEnd) = ResolveWindow(start, request.End, request.DurationMinutes);
            beginUtc = resolvedBegin;
            endUtc = resolvedEnd;

            await EnsureNoConflictAsync(technicianId, resolvedBegin, resolvedEnd, taskId, cancellationToken);
        }

        var updated = await _glpi.UpdateTicketTaskAsync(
            taskId,
            new UpdateTicketTaskRequest(
                Content: content,
                TechnicianId: technicianId,
                BeginUtc: beginUtc,
                EndUtc: endUtc,
                State: null,
                IsPrivate: request.IsPrivate,
                ClearPending: true),
            cancellationToken)
            ?? throw new NotFoundException($"La tarea {taskId} no existe en GLPI.");

        _logger.LogInformation(
            "Rescheduled task {TaskId} of ticket {TicketId} ({Begin:o} → {End:o})",
            updated.Id,
            ticketId,
            updated.Begin,
            updated.End);

        var state = await ReadBackStateAsync(ticketId, cancellationToken);

        // A scheduled TODO task makes GLPI derive "En proceso (planificado)" on its
        // own, including when the ticket was Pending. Never report success on the
        // strength of the request alone: the read-back is the proof.
        if (beginUtc is not null && state.Status != (int)TicketStatus.Planned)
        {
            _logger.LogWarning(
                "GLPI rescheduled task {TaskId} but ticket {TicketId} is status {Status}",
                taskId, ticketId, state.Status);
            throw new ConflictException(
                $"GLPI guardó la tarea {taskId}, pero no confirmó el estado En proceso (actual: {state.Status}). Revisa GLPI antes de reintentar.",
                "glpi_unconfirmed",
                new Dictionary<string, object?> { ["taskId"] = taskId, ["ticketStatus"] = state.Status });
        }

        return await ReadPlanningAsync(ticketId, state, userId, role, cancellationToken);
    }

    public async Task<TicketPlanningDto> CompleteAsync(
        int ticketId,
        int taskId,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        var task = await RequireTaskAsync(ticketId, taskId, cancellationToken);

        if (!await _policy.CanManagePlanningAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException("No tienes permiso para completar tareas de este ticket.");
        }

        if (task.State == (int)TicketTaskState.Done)
        {
            throw new UnprocessableEntityException("La tarea ya está realizada.");
        }

        // Marking the task done makes GLPI recompute the parent status: if this was the
        // last planned task the ticket returns to assigned (2) or new (1) on its own.
        await _glpi.UpdateTicketTaskAsync(
            taskId,
            new UpdateTicketTaskRequest(State: (int)TicketTaskState.Done),
            cancellationToken);

        var state = await ReadBackStateAsync(ticketId, cancellationToken);
        return await ReadPlanningAsync(ticketId, state, userId, role, cancellationToken);
    }

    public async Task<TicketPlanningDto> CancelAsync(
        int ticketId,
        int taskId,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        var task = await RequireTaskAsync(ticketId, taskId, cancellationToken);

        if (!await _policy.CanManagePlanningAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException("No tienes permiso para cancelar tareas de este ticket.");
        }

        await _glpi.DeleteTicketTaskAsync(taskId, cancellationToken);

        // GLPI 11 does not recompute the parent status when a task is deleted
        // (post_deleteFromDB only updates the action time). If the ticket was planned and
        // no scheduled task is left, it has to go back to assigned. That is a native
        // 3 → 2 transition; status 3 is never written.
        var state = await ReadBackStateAsync(ticketId, cancellationToken);
        if (state.Status == (int)TicketStatus.Planned)
        {
            var remaining = await _glpi.GetGlpiTicketTasksAsync(ticketId, cancellationToken);
            var stillPlanned = remaining.Any(t =>
                t.State == (int)TicketTaskState.ToDo && t.Begin.HasValue);

            if (!stillPlanned)
            {
                await _glpi.UpdateTicketStatusAsync(ticketId, (int)TicketStatus.Assigned, cancellationToken);
                state = await ReadBackStateAsync(ticketId, cancellationToken);

                _logger.LogInformation(
                    "Ticket {TicketId} returned to assigned after cancelling its last planned task {TaskId}",
                    ticketId,
                    task.Id);
            }
        }

        return await ReadPlanningAsync(ticketId, state, userId, role, cancellationToken);
    }

    public async Task<TicketAvailabilityDto> GetAvailabilityAsync(
        int ticketId,
        int technicianId,
        DateTimeOffset begin,
        DateTimeOffset end,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        if (!await _policy.CanViewAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException("No tienes acceso a este ticket.");
        }

        await RequireTicketAsync(ticketId, cancellationToken);

        if (!await _policy.CanPlanAsync(userId, role, ticketId, technicianId, cancellationToken))
        {
            throw new ForbiddenException("No tienes permiso para consultar la disponibilidad de ese técnico.");
        }

        var (beginUtc, endUtc) = ResolveWindow(begin, end, null);
        var conflicts = await _tasks.GetConflictsAsync(technicianId, beginUtc, endUtc, null, cancellationToken);

        return new TicketAvailabilityDto(
            Available: conflicts.Count == 0,
            InsideWorkingHours: true,
            Message: conflicts.Count == 0
                ? null
                : "El técnico no está disponible en ese intervalo.",
            // Conflicts can belong to another ticket. Never expose its task ID, ticket
            // ID, schedule or technician through this endpoint.
            Conflicts: []);
    }

    // ---------------------------------------------------------------- helpers

    private async Task<TicketPlanningDto> ReturnConfirmedReservationAsync(
        int ticketId,
        Ticket ticket,
        int userId,
        AppRole role,
        CreateTicketTaskRequest request,
        int? expectedTaskId,
        CancellationToken cancellationToken)
    {
        var tasks = await _glpi.GetGlpiTicketTasksAsync(ticketId, cancellationToken);
        var task = tasks.FirstOrDefault(candidate =>
            string.Equals(candidate.Uuid, request.Uuid, StringComparison.OrdinalIgnoreCase)
            && (!expectedTaskId.HasValue || candidate.Id == expectedTaskId.Value));
        if (task is null)
        {
            throw new GlpiApiException(
                502,
                "La operación está registrada, pero GLPI todavía no confirma la TicketTask. Reintenta con la misma clave.",
                "The persisted idempotency reservation has no matching GLPI task.");
        }

        var state = await ReadBackStateAsync(ticketId, cancellationToken);
        return await ReadPlanningAsync(ticketId, state, userId, role, cancellationToken);
    }

    private static string ComputePlanningPayloadHash(
        int ticketId,
        string content,
        int technicianId,
        DateTime beginUtc,
        DateTime endUtc,
        string timeZoneId,
        bool isPrivate)
    {
        var canonical = string.Join('\n',
            ticketId.ToString(CultureInfo.InvariantCulture),
            content,
            technicianId.ToString(CultureInfo.InvariantCulture),
            beginUtc.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture),
            endUtc.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture),
            timeZoneId,
            isPrivate ? "1" : "0");
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
    }

    private async Task<GlpiTicketTask> CreateWithReconciliationAsync(
        CreateTicketTaskRequest request,
        CancellationToken cancellationToken)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await _glpi.CreateTicketTaskAsync(request, cancellationToken);
            }
            catch (GlpiApiException exception) when (exception.StatusCode == 400)
            {
                // GLPI's globally unique task UUID can reject the losing request when
                // two API instances race after a lease expires. Adopt the winner.
                var adopted = await TryAdoptAsync(request, cancellationToken);
                if (adopted is not null)
                {
                    return adopted;
                }

                throw;
            }
            catch (Exception exception) when (IsRetryable(exception, cancellationToken))
            {
                // The write may or may not have landed. Before retrying, look for the
                // idempotency key: adopting the existing task is always safer than
                // creating a duplicate.
                var adopted = await TryAdoptAsync(request, cancellationToken);
                if (adopted is not null)
                {
                    _logger.LogWarning(
                        "Create task for ticket {TicketId} returned an ambiguous result; adopted task {TaskId}",
                        request.TicketId,
                        adopted.Id);
                    return adopted;
                }

                if (attempt >= MaximumAttempts)
                {
                    _logger.LogError(
                        exception,
                        "Could not schedule task for ticket {TicketId} after {Attempts} attempts",
                        request.TicketId,
                        attempt);

                    throw new GlpiApiException(
                        502,
                        "No se pudo confirmar la planificación en GLPI. Reintenta con la misma clave de idempotencia.",
                        exception.Message);
                }

                await Task.Delay(TimeSpan.FromMilliseconds(250 * attempt), cancellationToken);
            }
        }
    }

    private async Task<GlpiTicketTask?> TryAdoptAsync(
        CreateTicketTaskRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var existing = await _glpi.GetGlpiTicketTasksAsync(request.TicketId, cancellationToken);
            return existing.FirstOrDefault(t =>
                string.Equals(t.Uuid, request.Uuid, StringComparison.OrdinalIgnoreCase));
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogWarning(
                exception,
                "Could not reconcile task creation for ticket {TicketId}",
                request.TicketId);
            return null;
        }
    }

    /// <summary>
    /// 429 and 5xx are safe to retry. Timeouts and transport failures are ambiguous: the
    /// write may have reached GLPI, so they are retried only after checking the
    /// idempotency key.
    /// </summary>
    private static bool IsRetryable(Exception exception, CancellationToken cancellationToken)
    {
        if (cancellationToken.IsCancellationRequested)
        {
            return false;
        }

        return exception switch
        {
            GlpiApiException api => api.StatusCode is 429 or >= 500,
            HttpRequestException => true,
            TaskCanceledException => true,
            _ => false
        };
    }

    private async Task EnsureNoConflictAsync(
        int technicianId,
        DateTime beginUtc,
        DateTime endUtc,
        int? excludeTaskId,
        CancellationToken cancellationToken)
    {
        var conflicts = await _tasks.GetConflictsAsync(
            technicianId,
            beginUtc,
            endUtc,
            excludeTaskId,
            cancellationToken);

        if (conflicts.Count > 0)
        {
            throw new ConflictException(
                "El técnico no está disponible en ese intervalo.");
        }
    }

    private async Task<TicketPlanningDto> ReadPlanningAsync(
        int ticketId,
        GlpiTicketState state,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        var tasks = await _glpi.GetGlpiTicketTasksAsync(ticketId, cancellationToken);
        var canSeePrivateTasks = await _policy.CanSeePrivateFollowupsAsync(
            userId,
            role,
            ticketId,
            cancellationToken);
        var visibleTasks = canSeePrivateTasks
            ? tasks
            : tasks.Where(task => !task.IsPrivate).ToArray();
        var next = visibleTasks
            .Where(t => t.State == (int)TicketTaskState.ToDo && t.Begin.HasValue)
            .OrderBy(t => t.Begin)
            .FirstOrDefault();

        return new TicketPlanningDto(
            ticketId,
            state.Status,
            TicketLabels.Status(state.Status),
            next?.Begin,
            next?.TechnicianId,
            visibleTasks.Select(ToDto).ToArray());
    }

    private async Task<GlpiTicketState> ReadBackStateAsync(int ticketId, CancellationToken cancellationToken)
    {
        var state = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
        if (state is null)
        {
            throw new NotFoundException($"El ticket {ticketId} no existe en GLPI.");
        }

        return state;
    }

    private async Task EnsureCanViewAsync(
        int ticketId,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        if (!await _policy.CanViewAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException("No tienes acceso a este ticket.");
        }
    }

    private async Task<Ticket> RequireTicketAsync(int ticketId, CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw new ValidationException("id", "El identificador del ticket debe ser positivo.");
        }

        return await _tickets.GetByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException($"El ticket {ticketId} no existe.");
    }

    private async Task<TicketTask> RequireTaskAsync(
        int ticketId,
        int taskId,
        CancellationToken cancellationToken)
    {
        if (taskId <= 0)
        {
            throw new ValidationException("taskId", "El identificador de la tarea debe ser positivo.");
        }

        var task = await _tasks.GetByIdAsync(taskId, cancellationToken)
            ?? throw new NotFoundException($"La tarea {taskId} no existe.");

        if (task.TicketId != ticketId)
        {
            // Do not leak the existence of a task that belongs to another ticket.
            throw new NotFoundException($"La tarea {taskId} no pertenece al ticket {ticketId}.");
        }

        return task;
    }

    private static void EnsurePlannable(Ticket ticket)
    {
        if (!PlannableStatuses.Contains(ticket.Status))
        {
            throw new UnprocessableEntityException(
                "No se puede planificar un ticket resuelto o cerrado. Reábrelo primero.");
        }
    }

    private static string NormalizeContent(string? content)
    {
        var value = content?.Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return "Intervención planificada";
        }

        if (value.Length > MaximumContentLength)
        {
            throw new ValidationException(
                "content",
                $"La descripción no puede superar los {MaximumContentLength} caracteres.");
        }

        return value;
    }

    private static string NormalizeTimeZone(string? timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            return "UTC";
        }

        try
        {
            _ = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            return timeZoneId;
        }
        catch (Exception exception) when (exception is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            throw new ValidationException("timeZoneId", $"La zona horaria '{timeZoneId}' no es válida.");
        }
    }

    private static string? NormalizeIdempotencyKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ValidationException("idempotencyKey", "La clave de idempotencia es obligatoria para planificar un ticket.");
        }

        var value = key.Trim();
        if (value.Length > MaximumIdempotencyKeyLength)
        {
            throw new ValidationException(
                "idempotencyKey",
                $"La clave de idempotencia no puede superar los {MaximumIdempotencyKeyLength} caracteres.");
        }

        return value;
    }

    /// <summary>
    /// Normalizes the requested window to absolute UTC instants and applies the
    /// documented scheduling rules: end after start, between 1 minute and 24 hours, and
    /// not in the past (5 minutes of clock tolerance).
    /// </summary>
    private (DateTime BeginUtc, DateTime EndUtc) ResolveWindow(
        DateTimeOffset? begin,
        DateTimeOffset? end,
        int? durationMinutes)
    {
        if (begin is null)
        {
            throw new ValidationException("begin", "La fecha de inicio es obligatoria.");
        }

        if (durationMinutes is < 1)
        {
            throw new ValidationException("durationMinutes", "La duración debe ser al menos 1 minuto.");
        }

        var beginUtc = begin.Value.UtcDateTime;

        DateTime endUtc;
        if (end is not null)
        {
            endUtc = end.Value.UtcDateTime;

            if (durationMinutes is not null)
            {
                var declared = TimeSpan.FromMinutes(durationMinutes.Value);
                var actual = endUtc - beginUtc;
                if ((declared - actual).Duration() > TimeSpan.FromMinutes(1))
                {
                    throw new ValidationException(
                        "durationMinutes",
                        "La duración no coincide con el intervalo entre el inicio y el fin.");
                }
            }
        }
        else if (durationMinutes is not null)
        {
            endUtc = beginUtc.AddMinutes(durationMinutes.Value);
        }
        else
        {
            throw new ValidationException("end", "Indica la fecha de fin o una duración.");
        }

        if (endUtc <= beginUtc)
        {
            throw new UnprocessableEntityException(
                "La fecha de fin debe ser posterior a la fecha de inicio.");
        }

        var duration = endUtc - beginUtc;
        if (duration < MinimumDuration)
        {
            throw new UnprocessableEntityException("La duración mínima de una tarea es de 1 minuto.");
        }

        if (duration > MaximumDuration)
        {
            throw new UnprocessableEntityException("La duración máxima de una tarea es de 24 horas.");
        }

        if (beginUtc < _time.GetUtcNow().UtcDateTime - PastTolerance)
        {
            throw new UnprocessableEntityException(
                "No se puede planificar en el pasado. Elige una fecha de inicio futura.");
        }

        return (beginUtc, endUtc);
    }

    private static DateTime AsUtc(DateTime? value) =>
        value is null
            ? default
            : value.Value.Kind == DateTimeKind.Utc
                ? value.Value
                : DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);

    private static TicketPlanningTaskDto ToDto(GlpiTicketTask task) => new(
        task.Id,
        task.Uuid,
        task.TicketId,
        task.Content,
        task.State,
        TicketLabels.TaskState(task.State),
        task.Begin,
        task.End,
        task.ActionTime,
        task.TechnicianId,
        task.GroupId,
        task.IsPrivate,
        task.State == (int)TicketTaskState.ToDo && task.Begin.HasValue);

}
