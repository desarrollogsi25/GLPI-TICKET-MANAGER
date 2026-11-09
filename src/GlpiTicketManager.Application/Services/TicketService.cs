using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Mapping;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Application.Services;

/// <summary>
/// Ticket use cases. Reads hit MariaDB through <see cref="ITicketRepository"/>,
/// writes go to GLPI through <see cref="IGlpiApiClient"/>.
/// </summary>
public sealed class TicketService : ITicketService
{
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    /// <summary>
    /// H-39: strict workflow invariant. A Waiting (4) ticket cannot jump straight to
    /// Solved (5) or Closed (6); it must be resumed to In-Progress (3) first.
    /// </summary>
    internal const string PendingResolveBlockedMessage =
        "No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.";

    private readonly ITicketRepository _tickets;
    private readonly IGlpiApiClient _glpi;
    private readonly IAuditRepository _audit;
    private readonly ITicketAccessPolicy _accessPolicy;
    private readonly ITicketNotificationService _notifications;
    private readonly INotificationService? _persistentNotifications;
    private readonly IDashboardRepository? _dashboard;
    private readonly ILogger<TicketService> _logger;

    private static readonly TimeZoneInfo LocalTimeZone = ResolveLocalTimeZone();

    private static TimeZoneInfo ResolveLocalTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid");
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Romance Standard Time");
            }
            catch
            {
                return TimeZoneInfo.Local;
            }
        }
    }
    private readonly ITicketPlanningRequestStore _planningRequests;

    public TicketService(
        ITicketRepository tickets,
        IGlpiApiClient glpi,
        IAuditRepository audit,
        ITicketAccessPolicy accessPolicy,
        ITicketNotificationService notifications,
        ILogger<TicketService> logger,
        ITicketPlanningRequestStore planningRequests,
        INotificationService? persistentNotifications = null,
        IDashboardRepository? dashboard = null)
    {
        _tickets = tickets;
        _glpi = glpi;
        _audit = audit;
        _accessPolicy = accessPolicy;
        _notifications = notifications;
        _logger = logger;
        _planningRequests = planningRequests;
        _persistentNotifications = persistentNotifications;
        _dashboard = dashboard;
    }

    public Task<PagedResult<TicketSummaryDto>> GetByAssigneeAsync(
        int assigneeId,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        return GetFilteredAsync(assigneeId, null, limit, offset, cancellationToken);
    }

    public Task<PagedResult<TicketSummaryDto>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int limit,
        int offset,
        CancellationToken cancellationToken) =>
        GetFilteredAsync(assigneeId, serviceId, null, limit, offset, cancellationToken);

    public Task<PagedResult<TicketSummaryDto>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int? requesterId,
        int limit,
        int offset,
        CancellationToken cancellationToken) =>
        GetFilteredAsync(assigneeId, serviceId, requesterId, null, null, limit, offset, cancellationToken);

    public Task<PagedResult<TicketSummaryDto>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int? requesterId,
        DateTime? startDate,
        DateTime? endDate,
        int limit,
        int offset,
        CancellationToken cancellationToken) =>
        GetFilteredCoreAsync(assigneeId, serviceId, requesterId, startDate, endDate,
            limit, offset, supervisorId: null, allowedGroupIds: null, cancellationToken);

    public async Task<PagedResult<TicketSummaryDto>> GetSupervisorFilteredAsync(
        int supervisorId, int? assigneeId, int? serviceId,
        DateTime? startDate, DateTime? endDate, int limit, int offset,
        CancellationToken cancellationToken)
    {
        if (supervisorId <= 0) throw new ForbiddenException("Supervisor no válido.");
        // Groups come from GLPI for every request, not a JWT/client-provided list.
        var groups = await _tickets.GetGroupIdsForUserAsync(supervisorId, cancellationToken);
        return await GetFilteredCoreAsync(assigneeId, serviceId, null, startDate, endDate,
            limit, offset, supervisorId, groups, cancellationToken);
    }

    private async Task<PagedResult<TicketSummaryDto>> GetFilteredCoreAsync(
        int? assigneeId, int? serviceId, int? requesterId,
        DateTime? startDate, DateTime? endDate, int limit, int offset,
        int? supervisorId, IReadOnlyList<int>? allowedGroupIds,
        CancellationToken cancellationToken)
    {
        if (assigneeId.HasValue && assigneeId.Value <= 0)
        {
            throw Invalid("assigneeId", "assigneeId must be a positive integer.");
        }

        if (serviceId.HasValue && serviceId.Value <= 0)
        {
            throw Invalid("serviceId", "serviceId must be a positive integer.");
        }

        if (requesterId.HasValue && requesterId.Value <= 0)
        {
            throw Invalid("requesterId", "requesterId must be a positive integer.");
        }

        // GLPI stores `glpi_tickets.date` in UTC. Callers may send `DateTime` values with
        // any Kind (usually Unspecified when bound from a date-only query string), so we
        // normalize every bound to UTC before it reaches Dapper.
        var startUtc = ToUtcBound(startDate, endOfDay: false);
        var endUtc = ToUtcBound(endDate, endOfDay: true);

        if (startUtc.HasValue && endUtc.HasValue && startUtc.Value > endUtc.Value)
        {
            throw Invalid("startDate", "startDate cannot be later than endDate.");
        }

        var effectiveLimit = limit <= 0 ? DefaultLimit : Math.Min(limit, MaxLimit);
        var effectiveOffset = Math.Max(offset, 0);

        var rows = supervisorId.HasValue
            ? await _tickets.GetSupervisorFilteredAsync(supervisorId.Value,
                allowedGroupIds ?? Array.Empty<int>(), assigneeId, serviceId,
                startUtc, endUtc, effectiveLimit, effectiveOffset, cancellationToken)
            : await _tickets.GetFilteredAsync(assigneeId, serviceId, requesterId,
                startUtc, endUtc, effectiveLimit, effectiveOffset, cancellationToken);
        var total = supervisorId.HasValue
            ? await _tickets.CountSupervisorFilteredAsync(supervisorId.Value,
                allowedGroupIds ?? Array.Empty<int>(), assigneeId, serviceId,
                startUtc, endUtc, cancellationToken)
            : await _tickets.CountFilteredAsync(assigneeId, serviceId, requesterId,
                startUtc, endUtc, cancellationToken);

        // Only the date-aware overload is called here, so the repository is free to return
        // `null` for a result set that has no rows (e.g. mocked/empty implementations).
        if (rows is { Count: > 0 })
        {
            var links = await _tickets.GetUsersForTicketsAsync(
                rows.Select(row => row.Id).ToArray(),
                cancellationToken);

            AttachUsers(rows, links);
        }

        var items = rows.Select(TicketMapper.ToSummary).ToArray();

        return new PagedResult<TicketSummaryDto>(items, total, effectiveLimit, effectiveOffset);
    }

    public Task<TicketDetailDto?> GetByIdAsync(int ticketId, int userId, CancellationToken cancellationToken) =>
        GetByIdAsync(ticketId, userId, AppRole.Technician, cancellationToken);

    public async Task<TicketDetailDto?> GetByIdAsync(int ticketId, int userId, AppRole role, CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            return null;
        }

        if (!await _accessPolicy.CanViewAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot view ticket {ticketId}");
        }

        var canSeePrivate = await _accessPolicy.CanSeePrivateFollowupsAsync(userId, role, ticketId, cancellationToken);
        if (!canSeePrivate)
        {
            ticket = await _tickets.GetByIdAsync(ticketId, canSeePrivate: false, cancellationToken);
            if (ticket is null) return null;
        }

        return ticket.ToDetail();
    }

    public async Task<TicketDetailDto?> GetByIdAsync(int ticketId, CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        return ticket?.ToDetail();
    }

    /// <summary>Reads native GLPI tasks only after authorization against the local ticket read model.</summary>
    public async Task<IReadOnlyList<TicketTaskDto>> GetTasksAsync(
        int ticketId, int userId, AppRole role, CancellationToken cancellationToken)
    {
        if (ticketId <= 0) throw Invalid("id", "id must be a positive integer.");
        if (await _tickets.GetByIdAsync(ticketId, cancellationToken) is null)
            throw new NotFoundException($"Ticket {ticketId} not found.");
        if (!await _accessPolicy.CanViewAsync(userId, role, ticketId, cancellationToken))
            throw new ForbiddenException($"User {userId} cannot view ticket {ticketId}");

        var canSeePrivate = await _accessPolicy.CanSeePrivateFollowupsAsync(
            userId, role, ticketId, cancellationToken);
        var tasks = await _glpi.GetTicketTasksAsync(ticketId, cancellationToken);
        return canSeePrivate ? tasks : tasks.Where(task => !task.IsPrivate).ToArray();
    }

    /// <summary>
    /// Single decision point for "Resolver", consumed by the detail view and the Kanban.
    /// Combines the caller's authority with <see cref="ResolveRule"/> (status + real GLPI tasks).
    /// </summary>
    public async Task<ResolveEligibilityDto> GetResolveEligibilityAsync(
        int ticketId, int userId, AppRole role, CancellationToken cancellationToken)
    {
        if (ticketId <= 0) throw Invalid("id", "id must be a positive integer.");
        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException($"Ticket {ticketId} not found.");
        if (!await _accessPolicy.CanViewAsync(userId, role, ticketId, cancellationToken))
            throw new ForbiddenException($"User {userId} cannot view ticket {ticketId}");

        if (!await _accessPolicy.CanAttemptStatusChangeAsync(userId, role, ticketId, cancellationToken))
            return new ResolveEligibilityDto(false, "forbidden", "Solo el técnico asignado, un supervisor del grupo o un administrador pueden resolver este ticket.");

        var transition = await _accessPolicy.EvaluateStatusTransitionAsync(
            userId, role, ticketId, (int)TicketStatus.Solved, cancellationToken);
        if (!transition.Allowed)
            return new ResolveEligibilityDto(false, "forbidden", transition.Reason);

        IReadOnlyList<TicketTaskDto>? tasks = null;
        if (ticket.Status is (int)TicketStatus.Assigned or (int)TicketStatus.Planned)
        {
            try
            {
                tasks = await _glpi.GetTicketTasksAsync(ticketId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve GLPI tasks for ticket {TicketId} in eligibility check", ticketId);
                tasks = null; // Forces fail-closed
            }
        }
        else
        {
            tasks = Array.Empty<TicketTaskDto>();
        }

        return ResolveRule.Evaluate(ticket.Status, tasks);
    }

    /// <summary>Server-side enforcement of <see cref="ResolveRule"/> before any solution is written.</summary>
    private async Task EnsureResolvableByTasksAsync(int ticketId, int currentStatus, CancellationToken cancellationToken)
    {
        IReadOnlyList<TicketTaskDto>? tasks = null;
        try
        {
            tasks = await _glpi.GetTicketTasksAsync(ticketId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve GLPI tasks for ticket {TicketId} during resolve validation", ticketId);
            tasks = null; // Forces fail-closed
        }

        var decision = ResolveRule.Evaluate(currentStatus, tasks);
        if (!decision.CanResolve)
        {
            throw new UnprocessableEntityException(decision.Reason ?? "El ticket no cumple las condiciones para resolverse.");
        }
    }

    private async Task<(Ticket Ticket, TicketTaskDto Task, GlpiTicketState State)>
        GetEditableTaskAsync(int ticketId, int taskId, int userId, AppRole role, CancellationToken ct)
    {
        if (ticketId <= 0 || taskId <= 0) throw Invalid("id", "Ticket and task IDs must be positive.");
        var ticket = await _tickets.GetByIdAsync(ticketId, ct)
            ?? throw new NotFoundException($"Ticket {ticketId} not found.");
        if (!await _accessPolicy.CanViewAsync(userId, role, ticketId, ct))
            throw new ForbiddenException("No tienes acceso a este ticket.");

        var state = await _glpi.GetTicketStateAsync(ticketId, ct)
            ?? throw new NotFoundException($"Ticket {ticketId} not found in GLPI.");
        if (state.Status is not (int)TicketStatus.Assigned and not (int)TicketStatus.Planned and not (int)TicketStatus.Waiting)
            throw new ConflictException("Las tareas solo pueden modificarse en tickets activos.", "state_conflict");

        // A Waiting ticket is resumed through the native Waiting -> Assigned
        // transition and GLPI derives Planned from the updated task. Authorize
        // against that real transition; Waiting -> Planned is forbidden by policy.
        var target = state.Status == (int)TicketStatus.Waiting
            ? (int)TicketStatus.Assigned
            : (int)TicketStatus.Planned;
        var decision = await _accessPolicy.EvaluateStatusTransitionAsync(userId, role, ticketId, target, ct);
        if (!decision.Allowed)
            throw new ForbiddenException(decision.Reason ?? "No tienes permiso para modificar tareas.");

        // Never accept the task ID merely because it is numeric: it must be a
        // current native child of the authorized ticket, not another ticket's task.
        var task = (await _glpi.GetTicketTasksAsync(ticketId, ct) ?? [])
            .FirstOrDefault(task => task.Id == taskId && task.TicketId == ticketId)
            ?? throw new NotFoundException($"Tarea {taskId} no encontrada en el ticket {ticketId}.");
        if (role == AppRole.Technician && task.TechnicianId != userId)
            throw new ForbiddenException("Solo el técnico responsable puede modificar esta tarea.");
        return (ticket, task, state);
    }

    /// <summary>
    /// True when the requested content and window are byte-for-byte the values
    /// GLPI already stores. GLPI skips its update hooks on a no-op, so such a
    /// request could never reopen a Waiting ticket nor derive Planned.
    /// </summary>
    private static bool HasSameSchedule(TicketTaskDto task, string content,
        DateTimeOffset startAt, DateTimeOffset endAt) =>
        string.Equals(task.Content.Trim(), content.Trim(), StringComparison.Ordinal) &&
        task.StartAt?.ToUnixTimeSeconds() == startAt.ToUnixTimeSeconds() &&
        task.EndAt?.ToUnixTimeSeconds() == endAt.ToUnixTimeSeconds();

    private const string NoChangesMessage =
        "El horario y el comentario no cambiaron. GLPI solo reanuda un ticket Pendiente cuando la tarea se modifica: ajusta la fecha, la duración o el comentario.";

    public async Task<TicketTaskMutationResponse> ReplanTaskAsync(int ticketId, int taskId,
        ReplanTicketTaskRequest request, int userId, AppRole role, CancellationToken cancellationToken)
    {
        if (request is null || request.RequestId == Guid.Empty)
            throw Invalid("requestId", "Se requiere un identificador único de solicitud.");
        var content = request.Content?.Trim() ?? string.Empty;
        if (content.Length is < 1 or > 4000) throw Invalid("content", "La descripción debe contener entre 1 y 4000 caracteres.");
        if (request.StartAt == default || request.EndAt <= request.StartAt ||
            request.EndAt - request.StartAt < TimeSpan.FromMinutes(1) ||
            request.EndAt - request.StartAt > TimeSpan.FromDays(30))
            throw Invalid("startAt", "Se requiere un horario válido de entre 1 minuto y 30 días.");

        // Waiting (4) is a valid source state: GLPI reopens it natively when the
        // existing TODO task is updated (see ReplanTicketTaskAsync pending=0).
        var (ticket, task, state) = await GetEditableTaskAsync(ticketId, taskId, userId, role, cancellationToken);
        if (task.State != 1)
            throw new ConflictException("Solo se pueden reprogramar tareas Por hacer.", "task_not_editable");

        var canonical = string.Join("|", "replan", ticketId, taskId, userId, content,
            request.StartAt.UtcTicks, request.EndAt.UtcTicks);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
        var claim = await _planningRequests.ClaimAsync(request.RequestId, ticketId, userId, hash, cancellationToken);
        if (claim.State == PlanningRequestState.Mismatched)
            throw new ConflictException("El identificador de solicitud ya se usó para otra operación.", "idempotency_conflict");
        if (claim.State == PlanningRequestState.InProgress)
            throw new ConflictException("Reprogramación incierta o en curso; revisa GLPI antes de reintentar.", "idempotency_conflict");
        if (claim.State == PlanningRequestState.Completed)
        {
            var alreadyDone = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
            return new TicketTaskMutationResponse(ticketId, taskId, alreadyDone?.Status ?? state.Status);
        }

        // The PostgreSQL advisory lock closes the check-then-write race between
        // API replicas for this technician (external GLPI writers bypass it).
        await using var scheduleLock = await _planningRequests.AcquireTechnicianScheduleLockAsync(
            task.TechnicianId, cancellationToken);
        task = (await _glpi.GetTicketTasksAsync(ticketId, cancellationToken) ?? [])
            .FirstOrDefault(item => item.Id == taskId && item.TicketId == ticketId)
            ?? throw new ConflictException("La tarea cambió mientras se adquiría el bloqueo; actualiza la vista.", "task_modified");
        if (role == AppRole.Technician && task.TechnicianId != userId)
            throw new ForbiddenException("La tarea ya no está asignada al técnico autenticado.");
        var current = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
        if (current?.Status is not (int)TicketStatus.Assigned and not (int)TicketStatus.Planned and not (int)TicketStatus.Waiting)
        {
            await _planningRequests.CancelAsync(request.RequestId, cancellationToken);
            throw new ConflictException("El ticket cambió de estado; actualiza la vista antes de reprogramar.", "state_conflict");
        }
        if (task.State != 1)
        {
            await _planningRequests.CancelAsync(request.RequestId, cancellationToken);
            throw new ConflictException("La tarea dejó de estar Por hacer; actualiza la vista.", "task_not_editable");
        }
        if (HasSameSchedule(task, content, request.StartAt, request.EndAt))
        {
            await _planningRequests.CancelAsync(request.RequestId, cancellationToken);
            throw new ConflictException(NoChangesMessage, "no_changes");
        }

        var conflicts = await _tickets.GetScheduledTaskConflictsAsync(task.TechnicianId,
            request.StartAt.UtcDateTime, request.EndAt.UtcDateTime, taskId, cancellationToken) ?? [];
        if (conflicts.Count > 0)
        {
            var lookahead = await _tickets.GetScheduledTaskConflictsAsync(task.TechnicianId,
                request.StartAt.UtcDateTime, request.StartAt.UtcDateTime.AddDays(7), taskId,
                cancellationToken) ?? conflicts;
            await _planningRequests.CancelAsync(request.RequestId, cancellationToken);
            throw BuildScheduleConflict(conflicts, lookahead, request.StartAt, request.EndAt, ownTaskId: null, ticketId);
        }

        await _glpi.ReplanTicketTaskAsync(taskId, content, request.StartAt, request.EndAt, cancellationToken);
        var readback = (await _glpi.GetTicketTasksAsync(ticketId, cancellationToken) ?? [])
            .FirstOrDefault(item => item.Id == taskId);
        if (readback is null || readback.State != 1 ||
            readback.StartAt?.ToUnixTimeSeconds() != request.StartAt.ToUnixTimeSeconds() ||
            readback.EndAt?.ToUnixTimeSeconds() != request.EndAt.ToUnixTimeSeconds())
            throw new ConflictException("GLPI no confirmó las fechas de la tarea; concilia en GLPI antes de reintentar.",
                "glpi_unconfirmed", new Dictionary<string, object?> { ["taskId"] = taskId });

        await _planningRequests.CompleteAsync(request.RequestId, taskId, cancellationToken);
        var refreshed = await _glpi.GetTicketStateAsync(ticketId, cancellationToken)
            ?? throw new ConflictException("GLPI no confirmó el ticket tras reprogramar.", "glpi_unconfirmed");
        if (refreshed.Status != (int)TicketStatus.Planned)
            throw new ConflictException(
                $"GLPI guardó la tarea #{taskId} pero el ticket quedó en estado {refreshed.Status}; revisa GLPI antes de reintentar.",
                "glpi_unconfirmed", new Dictionary<string, object?> { ["taskId"] = taskId, ["ticketStatus"] = refreshed.Status });
        await NotifyTaskMutationAsync(ticket, taskId, userId, "replan_task", refreshed.Status, cancellationToken);
        return new TicketTaskMutationResponse(ticketId, taskId, refreshed.Status);
    }

    public async Task<TicketTaskMutationResponse> CompleteTaskAsync(int ticketId, int taskId,
        int userId, AppRole role, CancellationToken cancellationToken)
    {
        var (ticket, task, state) = await GetEditableTaskAsync(ticketId, taskId, userId, role, cancellationToken);
        await using var scheduleLock = await _planningRequests.AcquireTechnicianScheduleLockAsync(
            task.TechnicianId, cancellationToken);
        task = (await _glpi.GetTicketTasksAsync(ticketId, cancellationToken))
            .FirstOrDefault(item => item.Id == taskId)
            ?? throw new NotFoundException("La tarea ya no existe en GLPI.");
        if (role == AppRole.Technician && task.TechnicianId != userId)
            throw new ForbiddenException("La tarea ya no está asignada al técnico autenticado.");
        var current = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
        if (current?.Status is not (int)TicketStatus.Assigned and not (int)TicketStatus.Planned and not (int)TicketStatus.Waiting)
            throw new ConflictException("El ticket dejó de estar activo; actualiza la vista.");
        if (task.State == 2)
            return new TicketTaskMutationResponse(ticketId, taskId, state.Status);
        if (task.State != 1) throw new ConflictException("Solo se puede completar una tarea Por hacer.");

        await _glpi.UpdateTicketTaskAsync(taskId, 2, cancellationToken);
        var readback = (await _glpi.GetTicketTasksAsync(ticketId, cancellationToken))
            .FirstOrDefault(item => item.Id == taskId);
        if (readback?.State != 2)
            throw new ConflictException("GLPI no confirmó la finalización de la tarea.");
        var refreshed = await _glpi.GetTicketStateAsync(ticketId, cancellationToken)
            ?? throw new ConflictException("GLPI no confirmó el estado del ticket.");
        await NotifyTaskMutationAsync(ticket, taskId, userId, "complete_task", refreshed.Status, cancellationToken);
        return new TicketTaskMutationResponse(ticketId, taskId, refreshed.Status);
    }

    public async Task<TicketTaskMutationResponse> CancelTaskAsync(int ticketId, int taskId,
        int userId, AppRole role, CancellationToken cancellationToken)
    {
        var (ticket, task, _) = await GetEditableTaskAsync(ticketId, taskId, userId, role, cancellationToken);
        await using var scheduleLock = await _planningRequests.AcquireTechnicianScheduleLockAsync(
            task.TechnicianId, cancellationToken);
        task = (await _glpi.GetTicketTasksAsync(ticketId, cancellationToken))
            .FirstOrDefault(item => item.Id == taskId)
            ?? throw new NotFoundException("La tarea ya no existe en GLPI.");
        if (role == AppRole.Technician && task.TechnicianId != userId)
            throw new ForbiddenException("La tarea ya no está asignada al técnico autenticado.");
        var current = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
        if (current?.Status is not (int)TicketStatus.Assigned and not (int)TicketStatus.Planned and not (int)TicketStatus.Waiting)
            throw new ConflictException("El ticket dejó de estar activo; actualiza la vista.");
        if (task.State != 1) throw new ConflictException("Solo se puede cancelar una tarea Por hacer.");

        // GLPI's native TicketTask table has no is_deleted marker. This is a
        // potentially irreversible action, so an unavailable audit log blocks it.
        await _audit.LogAsync(userId, "cancel_task_requested", ticketId,
            JsonSerializer.Serialize(new { taskId, previousState = task.State }), cancellationToken);
        await _glpi.DeleteTicketTaskAsync(taskId, cancellationToken);
        if ((await _glpi.GetTicketTasksAsync(ticketId, cancellationToken)).Any(item => item.Id == taskId))
            throw new ConflictException("GLPI no confirmó la cancelación de la tarea.");
        var refreshed = await _glpi.GetTicketStateAsync(ticketId, cancellationToken)
            ?? throw new ConflictException("GLPI no confirmó el estado del ticket.");
        await NotifyTaskMutationAsync(ticket, taskId, userId, "cancel_task", refreshed.Status, cancellationToken);
        return new TicketTaskMutationResponse(ticketId, taskId, refreshed.Status);
    }

    private static ConflictException BuildScheduleConflict(
        IReadOnlyList<ScheduledTaskConflict> conflicts,
        IReadOnlyList<ScheduledTaskConflict> lookahead,
        DateTimeOffset startAt,
        DateTimeOffset endAt,
        int? ownTaskId,
        int ticketId)
    {
        var ordered = conflicts.OrderBy(conflict => conflict.StartUtc).ToArray();
        var intervals = ordered.Select(conflict =>
            $"ticket #{conflict.TicketId} (tarea #{conflict.TaskId}): {FormatUtc(conflict.StartUtc)} – {FormatUtc(conflict.EndUtc)} UTC");
        var sameTicket = ordered.All(conflict => conflict.TicketId == ticketId);
        var message = sameTicket
            ? $"La tarea #{ordered[0].TaskId} de este ticket ya ocupa ese horario. Reprograma esa tarea en lugar de crear otra."
            : $"El técnico ya tiene otra tarea programada durante ese horario: {string.Join("; ", intervals)}. Elige otro intervalo.";
        var suggestion = SuggestFreeStart(startAt, endAt - startAt, lookahead);
        return new ConflictException(message, "schedule_conflict", new Dictionary<string, object?>
        {
            ["requestedStart"] = startAt,
            ["requestedEnd"] = endAt,
            ["ownTaskId"] = ownTaskId,
            ["conflicts"] = ordered.Select(conflict => new
            {
                ticketId = conflict.TicketId,
                taskId = conflict.TaskId,
                startAt = DateTime.SpecifyKind(conflict.StartUtc, DateTimeKind.Utc),
                endAt = DateTime.SpecifyKind(conflict.EndUtc, DateTimeKind.Utc)
            }).ToArray(),
            ["suggestedStart"] = suggestion
        });
    }

    private static string FormatUtc(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc)
            .ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

    /// <summary>First quarter-hour aligned slot of the same duration that does not overlap.</summary>
    private static DateTimeOffset? SuggestFreeStart(DateTimeOffset start, TimeSpan duration,
        IReadOnlyList<ScheduledTaskConflict> lookahead)
    {
        var candidate = RoundUpToQuarter(start);
        for (var attempt = 0; attempt < 12; attempt++)
        {
            var candidateEnd = candidate + duration;
            DateTimeOffset? blockingEnd = null;
            foreach (var conflict in lookahead)
            {
                var conflictStart = new DateTimeOffset(
                    DateTime.SpecifyKind(conflict.StartUtc, DateTimeKind.Utc));
                var conflictEnd = new DateTimeOffset(
                    DateTime.SpecifyKind(conflict.EndUtc, DateTimeKind.Utc));
                if (conflictStart < candidateEnd && conflictEnd > candidate &&
                    (blockingEnd is null || conflictEnd > blockingEnd))
                {
                    blockingEnd = conflictEnd;
                }
            }

            if (blockingEnd is null) return candidate;
            candidate = RoundUpToQuarter(blockingEnd.Value);
        }

        return null;
    }

    private static DateTimeOffset RoundUpToQuarter(DateTimeOffset value)
    {
        var quarterTicks = TimeSpan.FromMinutes(15).Ticks;
        var floored = new DateTimeOffset(value.UtcTicks - value.UtcTicks % quarterTicks, TimeSpan.Zero);
        return floored == value ? floored : floored.AddMinutes(15);
    }

    private async Task NotifyTaskMutationAsync(Ticket ticket, int taskId, int userId,
        string action, int status, CancellationToken ct)
    {
        try
        {
            await _audit.LogAsync(userId, action, ticket.Id,
                JsonSerializer.Serialize(new { taskId, ticketStatus = status }), ct);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Could not audit {Action} of task {TaskId}", action, taskId); }
        try
        {
            await _notifications.NotifyTicketStatusChangedAsync(ticket.Id, status,
                ticket.AssigneeIds?.FirstOrDefault(), ct);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Could not broadcast {Action} of task {TaskId}", action, taskId); }
    }

    public Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken) =>
        GetDashboardStatsAsync(null, cancellationToken);

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(DashboardScope? scope, CancellationToken cancellationToken)
    {
        var stats = await _tickets.GetDashboardStatsAsync(scope, cancellationToken);

        return new DashboardStatsDto(
            stats.TotalTickets,
            stats.OpenTickets,
            stats.NewTickets,
            stats.AssignedTickets,
            stats.ExecutionTickets,
            stats.PlannedTickets,
            stats.PausedTickets,
            stats.PendingTickets,
            stats.SolvedTickets,
            stats.ClosedTickets,
            stats.OverdueTickets,
            stats.DueSoonTickets,
            stats.ScheduledTasksCount,
            stats.AverageResolutionHours,
            stats.ByStatus
                .Select(item => new StatusCountDto(item.Status, TicketLabels.Status(item.Status), item.Count))
                .ToArray(),
            stats.ByTechnician
                .Select(item => new TechnicianWorkloadDto(item.UserId, item.OpenTickets))
                .ToArray());
    }

    public Task<bool> UpdateStatusAsync(int ticketId, int status, int userId, CancellationToken cancellationToken) =>
        UpdateStatusAsync(ticketId, status, userId, AppRole.Technician, null, cancellationToken);

    public Task<bool> UpdateStatusAsync(int ticketId, int status, int userId, AppRole role, CancellationToken cancellationToken) =>
        UpdateStatusAsync(ticketId, status, userId, role, null, cancellationToken);

    public async Task<bool> UpdateStatusAsync(
        int ticketId,
        int status,
        int userId,
        AppRole role,
        string? solution,
        CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        if (!Enum.IsDefined((TicketStatus)status))
        {
            throw Invalid("status", "status must be between 1 (New) and 6 (Closed).");
        }

        if (status == (int)TicketStatus.Planned)
        {
            throw new UnprocessableEntityException(
                "El estado Planificado requiere programar una tarea con fechas. Usa POST /api/tickets/{id}/plan.");
        }

        // Authorize before any workflow-state validation. The checks below return 422
        // for state-dependent rejections; running them first let an unauthorized
        // caller infer the ticket's status from the response code.
        if (!await _accessPolicy.CanAttemptStatusChangeAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException(
                $"User {userId} cannot modify status of ticket {ticketId} to {status}");
        }

        // H-39: a Waiting (4) ticket cannot be resolved (5) or closed (6) directly. The
        // check must run BEFORE the solution insert below: otherwise a rejected request
        // would still write a solution (and GLPI would auto-solve the ticket as a side
        // effect). Return 422, not 403, because the payload is valid but the transition
        // violates the workflow contract.
        var currentTicket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (currentTicket is not null
            && currentTicket.Status == (int)TicketStatus.Waiting
            && (status == (int)TicketStatus.Solved || status == (int)TicketStatus.Closed))
        {
            throw new UnprocessableEntityException(PendingResolveBlockedMessage);
        }

        // Business-rule transition authorization evaluation returns a clear, operator-facing reason on rejection
        var decision = await _accessPolicy.EvaluateStatusTransitionAsync(userId, role, ticketId, status, cancellationToken);
        if (!decision.Allowed)
        {
            throw new ForbiddenException(
                decision.Reason ?? $"User {userId} cannot modify status of ticket {ticketId} to {status}");
        }

        // QA-01 / QA-08: A ticket cannot jump directly to Closed (6) without first being Solved (5)
        // with documented solution and completed tasks.
        if (currentTicket is not null && status == (int)TicketStatus.Closed && currentTicket.Status != (int)TicketStatus.Solved)
        {
            throw new UnprocessableEntityException("No se puede cerrar directamente un ticket que no ha sido resuelto previamente.");
        }

        if (currentTicket is not null && status == (int)TicketStatus.Solved && currentTicket.Status != (int)TicketStatus.Solved)
        {
            await EnsureResolvableByTasksAsync(ticketId, currentTicket.Status, cancellationToken);
        }

        // Payload/state validation and solution insertion run before or during resolve:
        // Strictly: 1) Create solution via SolutionInsertAsync if provided, 2) Update status to 5 (Resolved).
        // If solution creation fails, status update is not executed.
        if (status == (int)TicketStatus.Solved)
        {
            if (!string.IsNullOrWhiteSpace(solution))
            {
                try
                {
                    await SolutionInsertAsync(ticketId, solution, userId, role, cancellationToken);
                }
                catch (ForbiddenException)
                {
                    throw;
                }
                catch (ValidationException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to insert solution before resolving ticket {TicketId}", ticketId);
                    throw new UnprocessableEntityException($"Error al registrar la solución requerida: {ex.Message}");
                }
            }
            else
            {
                var solutionExists = await _tickets.SolutionExistsAsync(ticketId, cancellationToken);
                if (!solutionExists)
                {
                    throw new UnprocessableEntityException("Ticket no puede marcarse como resuelto sin solución escrita.");
                }
            }
        }

        try
        {
            await _glpi.UpdateTicketStatusAsync(ticketId, status, cancellationToken);
        }
        catch (GlpiApiException exception) when (exception.StatusCode == 404)
        {
            return false;
        }

        // Resolution and closure are separate GLPI lifecycle steps. Never close a
        // ticket implicitly: approval/closure must follow GLPI's configured policy.
        var effectiveStatus = status;

        // BUG-032 / H-31: confirm the transition with GLPI.
        //
        // The writes above are only "attempted" until GLPI reports the resulting
        // status back. Publishing an event with the requested status would tell the
        // other sessions about a transition the server never applied (GLPI workflow
        // rules can refuse it). The read-back failure is logged and never undoes a
        // write that already succeeded.
        GlpiTicketState? persistedState = null;
        try
        {
            persistedState = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not confirm the status of ticket {TicketId} with GLPI", ticketId);
        }

        if (persistedState is not null && persistedState.Status != effectiveStatus)
        {
            _logger.LogWarning(
                "GLPI reports ticket {TicketId} as status {PersistedStatus} but {RequestedStatus} was requested",
                ticketId,
                persistedState.Status,
                effectiveStatus);
        }

        if (persistedState is not null)
        {
            effectiveStatus = persistedState.Status;
        }

        if (status == (int)TicketStatus.Solved)
        {
            try
            {
                await _audit.LogAsync(userId, "resolve", ticketId, null, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to record audit log for resolve on ticket {TicketId}", ticketId);
            }
        }

        try
        {
            var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
            var assigneeId = ticket?.AssigneeIds?.FirstOrDefault();
            await _notifications.NotifyTicketStatusChangedAsync(ticketId, effectiveStatus, assigneeId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit TicketStatusChanged notification for ticket {TicketId}", ticketId);
        }

        return true;
    }

    /// <summary>
    /// Native GLPI workflow: creating a scheduled TODO TicketTask moves the ticket
    /// from Assigned to Processing (planned). PATCH status=3 is never used.
    /// </summary>
    public async Task<PlanTicketResponse> PlanAsync(
        int ticketId, PlanTicketRequest request, int userId, AppRole role, CancellationToken cancellationToken)
    {
        if (ticketId <= 0) throw Invalid("id", "id must be a positive integer.");
        if (userId <= 0) throw new ForbiddenException("Usuario no válido.");
        if (request is null || request.RequestId == Guid.Empty)
            throw Invalid("requestId", "Se requiere un identificador único de solicitud.");

        var content = string.IsNullOrWhiteSpace(request.Content) ? "Intervención planificada" : request.Content.Trim();
        if (content.Length > 4000)
            throw Invalid("content", "La descripción no puede superar los 4000 caracteres.");
        if (request.StartAt == default || request.EndAt == default || request.EndAt <= request.StartAt)
            throw Invalid("startAt", "El inicio debe ser anterior al fin y ambos deben incluir zona horaria.");
        if (request.EndAt - request.StartAt > TimeSpan.FromDays(30) ||
            request.EndAt - request.StartAt < TimeSpan.FromMinutes(1))
            throw Invalid("endAt", "La tarea debe durar entre 1 minuto y 30 días.");
        // The GLPI API v1 date format has one-second precision.
        if (request.StartAt.Offset.TotalMinutes % 1 != 0 || request.EndAt.Offset.TotalMinutes % 1 != 0)
            throw Invalid("startAt", "La zona horaria debe tener un desfase de minutos completos.");

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException($"Ticket {ticketId} not found.");
        var decision = await _accessPolicy.EvaluateStatusTransitionAsync(
            userId, role, ticketId, (int)TicketStatus.Planned, cancellationToken);
        if (!decision.Allowed && ticket.Status == (int)TicketStatus.Waiting)
        {
            decision = await _accessPolicy.EvaluateStatusTransitionAsync(
                userId, role, ticketId, (int)TicketStatus.Assigned, cancellationToken);
        }
        if (!decision.Allowed) throw new ForbiddenException(decision.Reason ?? "No tienes permisos para planificar el ticket.");

        // Read from GLPI, not the eventually-consistent MariaDB projection.
        var current = await _glpi.GetTicketStateAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException($"Ticket {ticketId} not found in GLPI.");

        var canonical = string.Join("|", ticketId.ToString(CultureInfo.InvariantCulture),
            userId.ToString(CultureInfo.InvariantCulture), content,
            request.StartAt.UtcTicks.ToString(CultureInfo.InvariantCulture),
            request.EndAt.UtcTicks.ToString(CultureInfo.InvariantCulture));
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
        var claim = await _planningRequests.ClaimAsync(
            request.RequestId, ticketId, userId, hash, cancellationToken);

        if (claim.State == PlanningRequestState.Mismatched)
            throw new ConflictException("El identificador de solicitud ya se usó para otra planificación.", "idempotency_conflict");
        if (claim.State == PlanningRequestState.InProgress)
            throw new ConflictException(
                "La planificación ya está en curso o tuvo una respuesta incierta. Verifica la tarea en GLPI antes de reintentar.",
                "idempotency_conflict");
        if (claim.State == PlanningRequestState.Completed)
            return new PlanTicketResponse(ticketId, claim.TaskId!.Value, current.Status);

        await using var scheduleLock = await _planningRequests.AcquireTechnicianScheduleLockAsync(
            userId, cancellationToken);
        // The ticket may have changed while we waited for another API replica.
        current = await _glpi.GetTicketStateAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException($"Ticket {ticketId} not found in GLPI.");

        if (current.Status is not (int)TicketStatus.Assigned and not (int)TicketStatus.Planned and not (int)TicketStatus.Waiting)
        {
            // No write was sent to GLPI, so releasing this key is safe.
            await _planningRequests.CancelAsync(request.RequestId, cancellationToken);
            throw new ConflictException(
                "Solo un ticket activo (Asignado, En proceso o Pendiente) puede programarse; consulta su estado actual en GLPI.",
                "state_conflict");
        }

        // Replanning from the mobile board used to answer 409 because the ticket's
        // own TODO task overlapped the requested window. That is not a double
        // booking: the same technician is moving their own task, so it is updated
        // in place, preserving the GLPI task id and its history.
        var ticketTasks = await _glpi.GetTicketTasksAsync(ticketId, cancellationToken) ?? [];
        var ownOverlap = ticketTasks
            .Where(item => item.TechnicianId == userId
                && item.State == 1
                && item.StartAt is not null && item.EndAt is not null
                && item.StartAt.Value < request.EndAt && item.EndAt.Value > request.StartAt)
            .OrderBy(item => item.StartAt)
            .FirstOrDefault();
        var rescheduleTarget = request.CreateNewTask ? null : ownOverlap;

        if (rescheduleTarget is null && current.Status == (int)TicketStatus.Planned)
        {
            await _planningRequests.CancelAsync(request.RequestId, cancellationToken);
            throw new ConflictException(
                "El ticket ya está En proceso. Para cambiar la programación, reprograma la tarea existente en lugar de crear otra.",
                "state_conflict");
        }

        var conflicts = await _tickets.GetScheduledTaskConflictsAsync(userId,
            request.StartAt.UtcDateTime, request.EndAt.UtcDateTime,
            rescheduleTarget?.Id, cancellationToken) ?? [];
        if (conflicts.Count > 0)
        {
            var lookahead = await _tickets.GetScheduledTaskConflictsAsync(userId,
                request.StartAt.UtcDateTime, request.StartAt.UtcDateTime.AddDays(7),
                rescheduleTarget?.Id, cancellationToken) ?? conflicts;
            await _planningRequests.CancelAsync(request.RequestId, cancellationToken);
            throw BuildScheduleConflict(conflicts, lookahead, request.StartAt, request.EndAt,
                rescheduleTarget?.Id ?? ownOverlap?.Id, ticketId);
        }

        if (rescheduleTarget is not null)
        {
            if (HasSameSchedule(rescheduleTarget, content, request.StartAt, request.EndAt))
            {
                await _planningRequests.CancelAsync(request.RequestId, cancellationToken);
                throw new ConflictException(NoChangesMessage, "no_changes");
            }

            // pending=0 is GLPI's own "no longer pending" input: the TicketTask
            // post-update hook reopens Waiting and derives Planned from the real
            // task. Status 3 is never written directly by this API.
            await _glpi.ReplanTicketTaskAsync(rescheduleTarget.Id, content,
                request.StartAt, request.EndAt, cancellationToken);
            await _planningRequests.CompleteAsync(request.RequestId, rescheduleTarget.Id, cancellationToken);

            var readback = (await _glpi.GetTicketTasksAsync(ticketId, cancellationToken) ?? [])
                .FirstOrDefault(item => item.Id == rescheduleTarget.Id);
            if (readback is null || readback.State != 1 ||
                readback.StartAt?.ToUnixTimeSeconds() != request.StartAt.ToUnixTimeSeconds() ||
                readback.EndAt?.ToUnixTimeSeconds() != request.EndAt.ToUnixTimeSeconds())
            {
                throw new ConflictException(
                    $"GLPI no confirmó la reprogramación de la tarea #{rescheduleTarget.Id}; concilia en GLPI antes de reintentar.",
                    "glpi_unconfirmed", new Dictionary<string, object?> { ["taskId"] = rescheduleTarget.Id });
            }

            var planned = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
            if (planned is null || planned.Status != (int)TicketStatus.Planned)
            {
                _logger.LogWarning(
                    "GLPI rescheduled task {TaskId} but ticket {TicketId} is status {Status}",
                    rescheduleTarget.Id, ticketId, planned?.Status);
                throw new ConflictException(
                    $"GLPI guardó la tarea #{rescheduleTarget.Id}, pero no confirmó el estado En proceso (actual: {planned?.Status}). Revisa GLPI antes de repetir.",
                    "glpi_unconfirmed",
                    new Dictionary<string, object?> { ["taskId"] = rescheduleTarget.Id, ["ticketStatus"] = planned?.Status });
            }

            try
            {
                await _audit.LogAsync(userId, "replan_task", ticketId, JsonSerializer.Serialize(new
                {
                    taskId = rescheduleTarget.Id, startAt = request.StartAt, endAt = request.EndAt,
                    previousStatus = current.Status, via = "plan"
                }), cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not audit rescheduled task {TaskId}", rescheduleTarget.Id);
            }

            try
            {
                await _notifications.NotifyTicketStatusChangedAsync(ticketId,
                    planned.Status, ticket.AssigneeIds?.FirstOrDefault(), cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not broadcast rescheduled ticket {TicketId}", ticketId);
            }

            return new PlanTicketResponse(ticketId, rescheduleTarget.Id, planned.Status, Rescheduled: true);
        }

        // GLPI 11 does not automatically take a Waiting (4) ticket to Planned (3)
        // merely because a new task is scheduled. Resume to Assigned (2) first;
        // only the subsequent native TicketTask may change the ticket to Planned.
        // This is NOT a direct PATCH/PUT to state 3. The request is already reserved
        // so two API replicas cannot execute the same resume+schedule twice.
        if (current.Status == (int)TicketStatus.Waiting)
        {
            await _glpi.UpdateTicketStatusAsync(ticketId, (int)TicketStatus.Assigned, cancellationToken);
            var resumed = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
            if (resumed?.Status != (int)TicketStatus.Assigned)
            {
                throw new ConflictException(
                    "GLPI no confirmó la reanudación a Asignado. Revisa el estado antes de intentar otra planificación.",
                    "glpi_unconfirmed");
            }
        }

        // Reservation happens before GLPI's non-idempotent POST. Do not automatically
        // release it on timeout / 5xx: GLPI may have persisted the task already.
        var taskId = await _glpi.CreatePlannedTaskAsync(
            ticketId, userId, content, request.StartAt, request.EndAt, cancellationToken);
        await _planningRequests.CompleteAsync(request.RequestId, taskId, cancellationToken);

        var updated = await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
        if (updated is null || updated.Status != (int)TicketStatus.Planned)
        {
            _logger.LogWarning("GLPI created planned task {TaskId} but ticket {TicketId} is status {Status}",
                taskId, ticketId, updated?.Status);
            throw new ConflictException(
                $"GLPI creó la tarea #{taskId}, pero no confirmó el estado Planificado. Revisa GLPI antes de repetir.",
                "glpi_unconfirmed", new Dictionary<string, object?> { ["taskId"] = taskId, ["ticketStatus"] = updated?.Status });
        }

        try
        {
            await _audit.LogAsync(userId, "plan", ticketId, JsonSerializer.Serialize(new
            {
                taskId, startAt = request.StartAt, endAt = request.EndAt,
                previousStatus = current.Status
            }), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not audit planned task {TaskId}", taskId);
        }

        try
        {
            await _notifications.NotifyTicketStatusChangedAsync(ticketId,
                updated.Status, ticket.AssigneeIds?.FirstOrDefault(), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not broadcast planned ticket {TicketId}", ticketId);
        }

        return new PlanTicketResponse(ticketId, taskId, updated.Status);
    }

    public Task<PagedResult<TicketSummaryDto>> GetUnassignedByGroupAsync(
        int groupId,
        int userId,
        int limit,
        int offset,
        CancellationToken cancellationToken) =>
        GetUnassignedByGroupAsync(groupId, userId, AppRole.Technician, limit, offset, cancellationToken);

    public async Task<PagedResult<TicketSummaryDto>> GetUnassignedByGroupAsync(
        int groupId,
        int userId,
        AppRole role,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        // QA: sin grupo solicitado (nulo/0) no hay cola que consultar. Se responde 200 con
        // la lista vacia para que el cliente pueda pintar "Sin grupo de soporte asignado".
        if (groupId <= 0)
        {
            return EmptyQueue(limit, offset);
        }

        if (!await _accessPolicy.CanViewGroupQueueAsync(userId, role, groupId, cancellationToken))
        {
            // QA: un usuario sin ningun grupo en glpi_groups_users no viola ninguna politica,
            // simplemente no tiene cola asignada: se responde vacia en lugar de 403.
            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, cancellationToken);
            if (userGroups is { Count: 0 })
            {
                return EmptyQueue(limit, offset);
            }

            throw new ForbiddenException($"User {userId} cannot view queue for group {groupId}");
        }

        return await GetUnassignedByGroupAsync(groupId, limit, offset, cancellationToken);
    }

    /// <summary>
    /// Cola de grupo vacia, normalizando limit/offset igual que la pagina real para que
    /// la respuesta tenga siempre la misma forma que una consulta valida sin resultados.
    /// </summary>
    private static PagedResult<TicketSummaryDto> EmptyQueue(int limit, int offset)
    {
        var effectiveLimit = limit <= 0 ? DefaultLimit : Math.Min(limit, MaxLimit);
        var effectiveOffset = Math.Max(offset, 0);

        return new PagedResult<TicketSummaryDto>(
            Array.Empty<TicketSummaryDto>(),
            0,
            effectiveLimit,
            effectiveOffset);
    }

    public async Task<PagedResult<TicketSummaryDto>> GetUnassignedByGroupAsync(
        int groupId,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        var effectiveLimit = limit <= 0 ? DefaultLimit : Math.Min(limit, MaxLimit);
        var effectiveOffset = Math.Max(offset, 0);

        var paged = await _tickets.GetUnassignedByGroupAsync(groupId, effectiveLimit, effectiveOffset, cancellationToken);

        if (paged.Items.Count > 0)
        {
            var links = await _tickets.GetUsersForTicketsAsync(
                paged.Items.Select(row => row.Id).ToArray(),
                cancellationToken);

            foreach (var ticket in paged.Items)
            {
                var ticketLinks = links.Where(link => link.TicketId == ticket.Id).ToArray();

                ticket.AssigneeIds = ticketLinks
                    .Where(link => link.Type == (int)Domain.Enums.TicketUserType.Assigned)
                    .Select(link => link.UserId)
                    .ToArray();

                ticket.RequesterIds = ticketLinks
                    .Where(link => link.Type == (int)Domain.Enums.TicketUserType.Requester)
                    .Select(link => link.UserId)
                    .ToArray();
            }
        }

        var items = paged.Items.Select(TicketMapper.ToSummary).ToArray();

        return new PagedResult<TicketSummaryDto>(items, paged.Total, effectiveLimit, effectiveOffset);
    }

    public Task<TicketDetailDto> ClaimAsync(int ticketId, int userId, CancellationToken cancellationToken) =>
        ClaimAsync(ticketId, userId, AppRole.Technician, cancellationToken);

    public async Task<TicketDetailDto> ClaimAsync(int ticketId, int userId, AppRole role, CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        if (userId <= 0)
        {
            throw Invalid("userId", "userId must be a positive integer.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            throw new NotFoundException($"Ticket {ticketId} not found.");
        }

        // Authorize before the state checks: otherwise an out-of-scope caller got a
        // 409 that disclosed the ticket's status and assignee link.
        if (!await _accessPolicy.CanClaimAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot claim ticket {ticketId}");
        }

        // A ticket routed to a group by a GLPI business rule is stored as
        // "Assigned" (2) even though no technician owns it yet, so both 1 and 2
        // are claimable as long as there is no technician link (checked below).
        if (ticket.Status is not (int)TicketStatus.New and not (int)TicketStatus.Assigned)
        {
            throw new ConflictException("El ticket debe estar en estado 'Nuevo' o 'Asignado' y sin técnico.");
        }

        var links = await _tickets.GetUsersForTicketsAsync(
            new[] { ticketId },
            cancellationToken);

        if (links != null && links.Any(l => l.Type == (int)TicketUserType.Assigned))
        {
            throw new ConflictException("El ticket ya está asignado a un técnico.");
        }

        var claimed = await _tickets.ClaimAsync(ticketId, userId, userId, cancellationToken);

        if (!claimed)
        {
            throw new ConflictException("Ticket ya no está disponible.");
        }

        try
        {
            await _audit.LogAsync(userId, "claim", ticketId, null, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record audit log for claim on ticket {TicketId}", ticketId);
        }

        try
        {
            var groupIds = await _tickets.GetGroupIdsForTicketAsync(ticketId, cancellationToken);
            var groupId = groupIds.FirstOrDefault();
            await _notifications.NotifyTicketClaimedAsync(ticketId, userId, groupId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit TicketClaimed notification for ticket {TicketId}", ticketId);
        }

        var updated = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (updated is null)
        {
            throw new NotFoundException($"Ticket {ticketId} not found.");
        }

        return updated.ToDetail();
    }

    public async Task<bool> SolutionExistsAsync(int ticketId, CancellationToken cancellationToken)
    {
        return await _tickets.SolutionExistsAsync(ticketId, cancellationToken);
    }

    public async Task<IReadOnlyList<UserSummaryDto>> GetTechniciansAsync(
        int? groupId, int userId, AppRole role, CancellationToken cancellationToken)
    {
        if (role == AppRole.Solicitante)
        {
            throw new ForbiddenException("Los solicitantes no tienen autorización para consultar la lista de técnicos.");
        }

        if (role == AppRole.Admin)
        {
            return await _tickets.GetTechniciansAsync(groupId, null, cancellationToken);
        }

        var userGroupIds = await _tickets.GetGroupIdsForUserAsync(userId, cancellationToken);
        if (userGroupIds.Count == 0)
        {
            return Array.Empty<UserSummaryDto>();
        }

        if (groupId.HasValue)
        {
            if (!userGroupIds.Contains(groupId.Value))
            {
                throw new ForbiddenException($"No tienes autorización para consultar técnicos del grupo {groupId.Value}.");
            }
            return await _tickets.GetTechniciansAsync(groupId.Value, null, cancellationToken);
        }

        return await _tickets.GetTechniciansAsync(null, userGroupIds, cancellationToken);
    }

    /// <summary>
    /// Resolves a ticket in a single atomic operation (BUG-031 / H-31).
    /// <para>
    /// GLPI 11 moves a ticket to <c>Solved</c> (5) on its own as a side effect of creating
    /// an <c>ITILSolution</c> (verified against GLPI 11.0), so the legacy two-call sequence
    /// "POST /solutions + PATCH /status" was redundant and produced contradictory answers:
    /// the solution write succeeded, the status write was then rejected with 422 because the
    /// solution-presence query applied a minimum length that the API never enforced, and a
    /// retry hit GLPI's "el elemento ya está resuelto" 400.
    /// </para>
    /// <para>
    /// This method writes the solution once, verifies the resulting state and emits a
    /// single realtime event. Closure is a separate authorized action in GLPI.
    /// </para>
    /// </summary>
    public Task<TicketDetailDto> ResolveAsync(
        int ticketId,
        string content,
        int userId,
        CancellationToken cancellationToken) =>
        ResolveAsync(ticketId, content, userId, AppRole.Technician, false, cancellationToken);

    public Task<TicketDetailDto> ResolveAsync(
        int ticketId,
        string content,
        int userId,
        AppRole role,
        CancellationToken cancellationToken) =>
        ResolveAsync(ticketId, content, userId, role, false, cancellationToken);

    public async Task<TicketDetailDto> ResolveAsync(
        int ticketId,
        string content,
        int userId,
        AppRole role,
        bool completePendingTasks,
        CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        if (userId <= 0)
        {
            throw Invalid("userId", "userId must be a positive integer.");
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ValidationException("content", "Solution content cannot be empty.");
        }

        if (content.Length > 2000)
        {
            throw new ValidationException("content", "Solution content exceeds maximum length.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            throw new NotFoundException($"Ticket {ticketId} not found.");
        }

        // H-39: resolving a Waiting (4) ticket directly is forbidden; it must be resumed
        // to In-Progress (3) first. 422 so the UI can show the exact reason.
        if (ticket.Status == (int)TicketStatus.Waiting)
        {
            throw new UnprocessableEntityException(PendingResolveBlockedMessage);
        }

        // 409: state conflict. Detecting it here avoids letting GLPI answer with an
        // opaque 400 ("El elemento ya está resuelto") that the technician cannot act on.
        if (ticket.Status == (int)TicketStatus.Closed)
        {
            throw new ConflictException($"El ticket {ticketId} ya está cerrado y no admite una nueva solución.");
        }

        if (ticket.Status == (int)TicketStatus.Solved)
        {
            throw new ConflictException($"El ticket {ticketId} ya fue resuelto y no se puede volver a resolver.");
        }

        // 403: the caller must be allowed to both write the solution and drive the
        // ticket to Solved. Both checks are evaluated BEFORE any write happens.
        if (!await _accessPolicy.CanAddSolutionAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot add solution to ticket {ticketId}");
        }

        var transition = await _accessPolicy.EvaluateStatusTransitionAsync(
            userId, role, ticketId, (int)TicketStatus.Solved, cancellationToken);
        if (!transition.Allowed)
        {
            throw new ForbiddenException(
                transition.Reason ?? $"User {userId} cannot resolve ticket {ticketId}");
        }

        // QA-01 / QA-02: Tasks must be explicitly completed by the technician beforehand.
        // Auto-completing tasks server-side violates task integrity and can leave false progress.
        await EnsureResolvableByTasksAsync(ticketId, ticket.Status, cancellationToken);

        try
        {
            // Writing the solution through GLPI's REST API is what moves the ticket to
            // Solved (5); GLPI rejects a second solution for an already solved ticket.
            await _glpi.CreateSolutionAsync(ticketId, content, userId, cancellationToken);
        }
        catch (GlpiApiException ex) when (ex.StatusCode == 400 && IsAlreadySolvedError(ex))
        {
            throw new ConflictException(
                $"El ticket {ticketId} ya fue resuelto por otra operación.");
        }

        // BUG-032 / H-31: read the state back FROM GLPI.
        //
        // Creating a solution normally solves the ticket on its own (GLPI 11), but that
        // has to be confirmed against GLPI, not inferred from the MariaDB read model:
        // the read model can still be showing the previous status, and GLPI workflow
        // rules can refuse the transition.
        var afterSolution = await ReadStateFromGlpiAsync(ticketId, cancellationToken);
        var effectiveStatus = afterSolution?.Status ?? ticket.Status;

        if (effectiveStatus != (int)TicketStatus.Solved && effectiveStatus != (int)TicketStatus.Closed)
        {
            // Defensive against GLPI versions that do not auto-solve on solution.
            await _glpi.UpdateTicketStatusAsync(ticketId, (int)TicketStatus.Solved, cancellationToken);
            effectiveStatus = (int)TicketStatus.Solved;
        }

        // Confirm the final state with GLPI: until GLPI reports it back, the writes
        // above are only "attempted". The response must describe what GLPI really
        // holds, not what the code intended to write.
        var finalState = await ReadStateFromGlpiAsync(ticketId, cancellationToken);
        if (finalState is not null)
        {
            if (finalState.Status != effectiveStatus)
            {
                _logger.LogWarning(
                    "GLPI reports ticket {TicketId} as status {PersistedStatus} but {RequestedStatus} was requested",
                    ticketId,
                    finalState.Status,
                    effectiveStatus);
            }

            effectiveStatus = finalState.Status;
        }

        try
        {
            await _audit.LogAsync(userId, "resolve", ticketId, null, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record audit log for resolve on ticket {TicketId}", ticketId);
        }

        var latest = await _tickets.GetByIdAsync(ticketId, cancellationToken);

        try
        {
            var assigneeId = (latest ?? ticket).AssigneeIds?.FirstOrDefault();
            await _notifications.NotifyTicketStatusChangedAsync(ticketId, effectiveStatus, assigneeId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit TicketStatusChanged notification for ticket {TicketId}", ticketId);
        }

        var detail = (latest ?? ticket).ToDetail();

        return detail with
        {
            Status = effectiveStatus,
            StatusLabel = TicketLabels.Status(effectiveStatus),
            SolvedAt = finalState?.SolvedAt ?? detail.SolvedAt,
            ClosedAt = finalState?.ClosedAt ?? detail.ClosedAt
        };
    }

    /// <summary>
    /// Reads the ticket state back from GLPI, tolerating a verification failure.
    /// </summary>
    /// <remarks>
    /// BUG-032 / H-31: GLPI owns the status and the solutions of a ticket, so the only
    /// reliable confirmation that a write landed is to ask GLPI. If GLPI cannot be
    /// reached the caller keeps its previous assumption and the failure is logged: a
    /// write that already succeeded must not be turned into an error because the
    /// verification could not run.
    /// </remarks>
    private async Task<GlpiTicketState?> ReadStateFromGlpiAsync(int ticketId, CancellationToken cancellationToken)
    {
        try
        {
            return await _glpi.GetTicketStateAsync(ticketId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not confirm the state of ticket {TicketId} with GLPI", ticketId);
            return null;
        }
    }

    /// <summary>
    /// Detects GLPI's "the item is already solved" rejection. GLPI answers with HTTP 400
    /// and the code <c>ERROR_GLPI_ADD</c> plus the message
    /// "El elemento ya está resuelto, ¿alguien impulsó una solución antes que usted?".
    /// </summary>
    private static bool IsAlreadySolvedError(GlpiApiException exception)
    {
        var payload = $"{exception.Message} {exception.ResponseBody}";
        return payload.Contains("ERROR_GLPI_ADD", StringComparison.OrdinalIgnoreCase)
            && payload.Contains("ya está resuelto", StringComparison.OrdinalIgnoreCase);
    }

    public Task<int> SolutionInsertAsync(int ticketId, string content, int userId, CancellationToken cancellationToken) =>
        SolutionInsertAsync(ticketId, content, userId, AppRole.Technician, cancellationToken);

    public async Task<int> SolutionInsertAsync(int ticketId, string content, int userId, AppRole role, CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        if (userId <= 0)
        {
            throw Invalid("userId", "userId must be a positive integer.");
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ValidationException("content", "Solution content cannot be empty.");
        }

        if (content.Length > 2000)
        {
            throw new ValidationException("content", "Solution content exceeds maximum length.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            throw new NotFoundException($"Ticket {ticketId} not found.");
        }

        // 409: state conflicts are detected here so the caller never receives GLPI's
        // opaque 400 ("El elemento ya está resuelto") for an already solved ticket.
        if (ticket.Status == (int)TicketStatus.Closed)
        {
            throw new ConflictException($"No se puede agregar una solución al ticket {ticketId} porque ya está cerrado.");
        }

        if (ticket.Status == (int)TicketStatus.Solved)
        {
            throw new ConflictException($"No se puede agregar una solución al ticket {ticketId} porque ya fue resuelto.");
        }

        // H-39: adding a solution in GLPI moves the ticket to Solved (5) on its own.
        // A Waiting (4) ticket must be resumed before it can be solved.
        if (ticket.Status == (int)TicketStatus.Waiting)
        {
            throw new UnprocessableEntityException(PendingResolveBlockedMessage);
        }

        if (!await _accessPolicy.CanAddSolutionAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot add solution to ticket {ticketId}");
        }

        // QA-01 / QA-02: Tasks must be explicitly completed by the technician beforehand.
        await EnsureResolvableByTasksAsync(ticketId, ticket.Status, cancellationToken);

        int solutionId;
        try
        {
            solutionId = await _glpi.CreateSolutionAsync(ticketId, content, userId, cancellationToken);
        }
        catch (GlpiApiException ex) when (ex.StatusCode == 400 && IsAlreadySolvedError(ex))
        {
            // Concurrent double submit: the first request solved the ticket in GLPI.
            throw new ConflictException($"El ticket {ticketId} ya fue resuelto por otra operación.");
        }

        try
        {
            await _notifications.NotifySolutionAddedAsync(ticketId, userId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit SolutionAdded notification for ticket {TicketId}", ticketId);
        }

        return solutionId;
    }

    public async Task<bool> IsUserInTicketGroupAsync(int ticketId, int userId, CancellationToken cancellationToken)
    {
        return await _tickets.IsUserInTicketGroupAsync(ticketId, userId, cancellationToken);
    }

    public Task<IReadOnlyList<int>> GetGroupIdsForUserAsync(int userId, CancellationToken cancellationToken)
    {
        return _tickets.GetGroupIdsForUserAsync(userId, cancellationToken);
    }

    public Task<TicketDetailDto> ReopenAsync(int ticketId, int userId, string? reason, CancellationToken cancellationToken) =>
        ReopenAsync(ticketId, userId, AppRole.Technician, reason, cancellationToken);

    public async Task<TicketDetailDto> ReopenAsync(
        int ticketId,
        int userId,
        AppRole role,
        string? reason,
        CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        if (userId <= 0)
        {
            throw Invalid("userId", "userId must be a positive integer.");
        }

        if (reason is not null && reason.Length > 500)
        {
            throw Invalid("reason", "Reason cannot exceed 500 characters.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            throw new NotFoundException($"Ticket {ticketId} not found.");
        }

        if (!await _accessPolicy.CanReopenAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot reopen ticket {ticketId}");
        }

        if (ticket.Status != (int)TicketStatus.Solved && ticket.Status != (int)TicketStatus.Closed)
        {
            throw new ConflictException("Ticket ya está abierto");
        }

        if (!string.IsNullOrWhiteSpace(reason))
        {
            try
            {
                await _glpi.CreateFollowupAsync(ticketId, reason.Trim(), isPrivate: true, userId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create followup note for reopen on ticket {TicketId}", ticketId);
            }
        }

        await _glpi.ReopenTicketAsync(ticketId, cancellationToken);

        try
        {
            await _notifications.NotifyTicketStatusChangedAsync(
                ticketId,
                (int)TicketStatus.Assigned,
                ticket.AssigneeIds.FirstOrDefault(),
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit TicketStatusChanged notification for reopen on ticket {TicketId}", ticketId);
        }

        try
        {
            var auditDetails = string.IsNullOrWhiteSpace(reason)
                ? null
                : System.Text.Json.JsonSerializer.Serialize(new { reason });
            await _audit.LogAsync(userId, "reopen", ticketId, auditDetails, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record audit log for reopen on ticket {TicketId}", ticketId);
        }

        var updated = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        return (updated ?? ticket).ToDetail();
    }


    private static void AttachUsers(IReadOnlyList<Ticket> tickets, IReadOnlyList<TicketUser> links)
    {
        foreach (var ticket in tickets)
        {
            var ticketLinks = links.Where(link => link.TicketId == ticket.Id).ToArray();

            ticket.AssigneeIds = ticketLinks
                .Where(link => link.Type == (int)TicketUserType.Assigned)
                .Select(link => link.UserId)
                .ToArray();

            ticket.RequesterIds = ticketLinks
                .Where(link => link.Type == (int)TicketUserType.Requester)
                .Select(link => link.UserId)
                .ToArray();
        }
    }

    private static ValidationException Invalid(string field, string message) =>
        new(new Dictionary<string, string[]> { [field] = [message] });

    /// <summary>
    /// Normalizes a date filter bound to UTC. Values without an explicit kind (typical when
    /// bound from a `yyyy-MM-dd` query string) are interpreted in the operational local timezone
    /// (Europe/Madrid) and converted to UTC bounds so tickets created near midnight and across
    /// daylight saving transitions are properly included.
    /// When <paramref name="endOfDay"/> is set and the bound is a date-only
    /// value, it is pushed to 23:59:59.999 local before converting to UTC.
    /// </summary>
    private static DateTime? ToUtcBound(DateTime? value, bool endOfDay)
    {
        if (!value.HasValue)
        {
            return null;
        }

        var raw = value.Value;
        if (raw.Kind == DateTimeKind.Utc)
        {
            if (endOfDay && raw.TimeOfDay == TimeSpan.Zero)
            {
                return raw.Date.AddDays(1).AddTicks(-1);
            }
            return raw;
        }

        if (raw.Kind == DateTimeKind.Local)
        {
            if (endOfDay && raw.TimeOfDay == TimeSpan.Zero)
            {
                var endLocal = raw.Date.AddDays(1).AddTicks(-1);
                return endLocal.ToUniversalTime();
            }
            return raw.ToUniversalTime();
        }

        // Unspecified kind: bound from query string "yyyy-MM-dd"
        if (endOfDay && raw.TimeOfDay == TimeSpan.Zero)
        {
            var endLocal = raw.Date.AddDays(1).AddTicks(-1);
            return TimeZoneInfo.ConvertTimeToUtc(endLocal, LocalTimeZone);
        }

        return TimeZoneInfo.ConvertTimeToUtc(raw, LocalTimeZone);
    }

    public Task<int> CreateTicketAsync(
        string title,
        string description,
        int urgency,
        int? categoryId,
        int requesterUserId,
        CancellationToken cancellationToken) =>
        CreateTicketAsync(title, description, urgency, categoryId, requesterUserId, null, cancellationToken);

    public async Task<int> CreateTicketAsync(
        string title,
        string description,
        int urgency,
        int? categoryId,
        int requesterUserId,
        int? requesterEntityId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw Invalid("title", "title is required.");
        }

        if (requesterUserId <= 0)
        {
            throw Invalid("requesterUserId", "requesterUserId must be a positive integer.");
        }

        int? assignmentGroupId;
        if (categoryId.HasValue)
        {
            if (categoryId.Value <= 0)
            {
                throw Invalid("categoryId", "categoryId must be a positive integer.");
            }

            assignmentGroupId = requesterEntityId.HasValue
                ? await _tickets.GetAssignmentGroupForCategoryAsync(categoryId.Value, requesterEntityId.Value, cancellationToken)
                : await _tickets.GetAssignmentGroupForCategoryAsync(categoryId.Value, cancellationToken);

            if (assignmentGroupId is null or <= 0)
            {
                throw Invalid(
                    "categoryId",
                    "La categoría seleccionada no existe, no está autorizada para tu entidad o no tiene un grupo de soporte válido configurado.");
            }
        }
        else
        {
            var userGroups = requesterEntityId.HasValue
                ? await _tickets.GetAuthorizedGroupIdsForUserAsync(requesterUserId, requesterEntityId.Value, cancellationToken)
                : await _tickets.GetAuthorizedGroupIdsForUserAsync(requesterUserId, null, cancellationToken);

            assignmentGroupId = userGroups.FirstOrDefault();
            if (assignmentGroupId is null or <= 0)
            {
                throw Invalid(
                    "categoryId",
                    "No existe un grupo de destino válido y autorizado para asignar el ticket. Seleccione una categoría configurada.");
            }
        }

        var validGroupId = assignmentGroupId.Value;

        var ticketId = await _glpi.CreateTicketAsync(
            title,
            description ?? string.Empty,
            urgency,
            categoryId,
            requesterUserId,
            validGroupId,
            cancellationToken);

        // Notify SignalR clients and create persistent notifications for the group's technicians
        try
        {
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, cancellationToken) ?? Array.Empty<int>();
            var effectiveGroupId = ticketGroups.FirstOrDefault() > 0 ? ticketGroups.First() : validGroupId;

            if (effectiveGroupId > 0 && ticketGroups.Count == 0)
            {
                await _tickets.EnsureTicketGroupAssignedAsync(ticketId, effectiveGroupId, cancellationToken);
            }

            if (_persistentNotifications is not null && _dashboard is not null && effectiveGroupId > 0)
            {
                var techIds = await _dashboard.GetTechnicianUserIdsInGroupAsync(effectiveGroupId, cancellationToken);
                foreach (var techId in techIds)
                {
                    try
                    {
                        await _persistentNotifications.CreateTicketCreatedOnceAsync(
                            techId,
                            ticketId,
                            $"Nuevo ticket #{ticketId}",
                            $"Se ha asignado el ticket '{title}' a tu grupo.",
                            cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to create persistent notification for technician {TechId}", techId);
                    }
                }
            }

            await _notifications.NotifyTicketCreatedAsync(ticketId, effectiveGroupId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit TicketCreated SignalR notification for ticket {TicketId}", ticketId);
        }

        return ticketId;
    }

    /// <summary>
    /// Sets a ticket to Pending (Waiting = 4) status with a private followup (H-34).
    /// </summary>
    public Task<TicketDetailDto> SetPendingAsync(
        int ticketId,
        int reasonId,
        string comment,
        int userId,
        CancellationToken cancellationToken) =>
        SetPendingAsync(ticketId, reasonId, comment, userId, AppRole.Technician, cancellationToken);

    /// <inheritdoc cref="SetPendingAsync(int, int, string, int, CancellationToken)"/>
    public async Task<TicketDetailDto> SetPendingAsync(
        int ticketId,
        int reasonId,
        string comment,
        int userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        if (userId <= 0)
        {
            throw Invalid("userId", "userId must be a positive integer.");
        }

        if (!PendingReasons.IsValid(reasonId))
        {
            throw new UnprocessableEntityException($"El motivo de pendiente {reasonId} no es válido.");
        }

        if (string.IsNullOrWhiteSpace(comment?.Trim()))
        {
            throw new UnprocessableEntityException("El comentario es obligatorio para poner el ticket en pendiente.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            throw new NotFoundException($"Ticket {ticketId} not found.");
        }

        if (ticket.Status == (int)TicketStatus.Closed)
        {
            throw new ConflictException($"El ticket {ticketId} ya está cerrado.");
        }

        if (ticket.Status == (int)TicketStatus.Solved)
        {
            throw new ConflictException($"El ticket {ticketId} ya está resuelto y no puede pasarse a pendiente directamente.");
        }

        if (ticket.Status == (int)TicketStatus.Waiting)
        {
            throw new ConflictException($"El ticket {ticketId} ya se encuentra en espera (pendiente).");
        }

        if (ticket.Status == (int)TicketStatus.New)
        {
            throw new ConflictException($"El ticket {ticketId} es nuevo y debe asignarse antes de pasarse a pendiente.");
        }

        // Valida autorización y transición de estado según la matriz de ciclo de vida (QA-08)
        var transition = await _accessPolicy.EvaluateStatusTransitionAsync(
            userId, role, ticketId, (int)TicketStatus.Waiting, cancellationToken);
        if (!transition.Allowed)
        {
            throw new ForbiddenException(transition.Reason ?? "No tienes permisos para poner este ticket en pendiente.");
        }

        // 1. Llama a GLPI REST: actualiza estado a 4 (Pendiente) PRIMERO para asegurar que la transición es válida y autorizada
        await _glpi.UpdateTicketStatusAsync(ticketId, (int)TicketStatus.Waiting, cancellationToken);

        // 2. Solo tras confirmar el cambio de estado, crea el seguimiento privado (ITILFollowup con is_private: 1) con el comentario
        await _glpi.CreateFollowupAsync(ticketId, comment.Trim(), isPrivate: true, userId, cancellationToken);

        // 3. Lee de vuelta el ticket (GET /Ticket/{id}) para confirmar
        var finalState = await ReadStateFromGlpiAsync(ticketId, cancellationToken);
        var effectiveStatus = finalState?.Status ?? (int)TicketStatus.Waiting;

        // 4. Guarda auditoría en PostgreSQL
        try
        {
            var auditDetails = System.Text.Json.JsonSerializer.Serialize(new
            {
                reasonId,
                comment = comment.Trim()
            });
            await _audit.LogAsync(userId, "pending", ticketId, auditDetails, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record audit log for pending on ticket {TicketId}", ticketId);
        }

        // 5. Emite un evento SignalR TicketStatusChanged al grupo
        var latest = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        var assigneeId = (latest ?? ticket).AssigneeIds?.FirstOrDefault();

        try
        {
            await _notifications.NotifyTicketStatusChangedAsync(
                ticketId,
                effectiveStatus,
                assigneeId,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit TicketStatusChanged notification for ticket {TicketId}", ticketId);
        }

        var detail = (latest ?? ticket).ToDetail();
        return detail with
        {
            Status = effectiveStatus,
            StatusLabel = TicketLabels.Status(effectiveStatus)
        };
    }
}


