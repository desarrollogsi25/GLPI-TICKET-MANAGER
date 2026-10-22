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

    private readonly ITicketRepository _tickets;
    private readonly IGlpiApiClient _glpi;
    private readonly IAuditRepository _audit;
    private readonly ITicketAccessPolicy _accessPolicy;
    private readonly ITicketNotificationService _notifications;
    private readonly ILogger<TicketService> _logger;

    public TicketService(
        ITicketRepository tickets,
        IGlpiApiClient glpi,
        IAuditRepository audit,
        ITicketAccessPolicy accessPolicy,
        ITicketNotificationService notifications,
        ILogger<TicketService> logger)
    {
        _tickets = tickets;
        _glpi = glpi;
        _audit = audit;
        _accessPolicy = accessPolicy;
        _notifications = notifications;
        _logger = logger;
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

    public async Task<PagedResult<TicketSummaryDto>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int? requesterId,
        DateTime? startDate,
        DateTime? endDate,
        int limit,
        int offset,
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

        var rows = await _tickets.GetFilteredAsync(
            assigneeId,
            serviceId,
            requesterId,
            startUtc,
            endUtc,
            effectiveLimit,
            effectiveOffset,
            cancellationToken);
        var total = await _tickets.CountFilteredAsync(
            assigneeId,
            serviceId,
            requesterId,
            startUtc,
            endUtc,
            cancellationToken);

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
            ticket = await _tickets.GetByIdAsync(ticketId, canSeePrivate: false, cancellationToken) ?? ticket;
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
            stats.PendingTickets,
            stats.SolvedTickets,
            stats.ClosedTickets,
            stats.OverdueTickets,
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

        // Business-rule evaluation returns a clear, operator-facing reason on rejection
        var decision = await _accessPolicy.EvaluateStatusTransitionAsync(userId, role, ticketId, status, cancellationToken);
        if (!decision.Allowed)
        {
            throw new ForbiddenException(
                decision.Reason ?? $"User {userId} cannot modify status of ticket {ticketId} to {status}");
        }

        try
        {
            await _glpi.UpdateTicketStatusAsync(ticketId, status, cancellationToken);
        }
        catch (GlpiApiException exception) when (exception.StatusCode == 404)
        {
            return false;
        }

        // Auto-close: resolving a ticket immediately closes it (status 6) in GLPI so the
        // lifecycle does not stall in "Resolved". A failure here is logged but never rolls
        // back the resolve that already succeeded.
        var effectiveStatus = status;
        if (status == (int)TicketStatus.Solved)
        {
            effectiveStatus = (int)TicketStatus.Closed;
            try
            {
                await _glpi.UpdateTicketStatusAsync(ticketId, effectiveStatus, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Auto-close after resolve failed for ticket {TicketId}", ticketId);
                effectiveStatus = status;
            }
        }

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

        if (ticket.Status != (int)TicketStatus.New)
        {
            throw new ConflictException("El ticket debe estar en estado 'Nuevo' (1) y sin asignar.");
        }

        var links = await _tickets.GetUsersForTicketsAsync(
            new[] { ticketId },
            cancellationToken);

        if (links.Any(l => l.Type == (int)TicketUserType.Assigned))
        {
            throw new ConflictException("El ticket ya está asignado a un técnico.");
        }

        if (!await _accessPolicy.CanClaimAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot claim ticket {ticketId}");
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
    /// This method writes the solution once, verifies the resulting state, applies the
    /// product auto-close rule and emits a single realtime event.
    /// </para>
    /// </summary>
    public Task<TicketDetailDto> ResolveAsync(
        int ticketId,
        string content,
        int userId,
        CancellationToken cancellationToken) =>
        ResolveAsync(ticketId, content, userId, AppRole.Technician, cancellationToken);

    public async Task<TicketDetailDto> ResolveAsync(
        int ticketId,
        string content,
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

        try
        {
            // Writing the solution through GLPI's REST API is what moves the ticket to
            // Solved (5); GLPI rejects a second solution for an already solved ticket.
            await _glpi.CreateSolutionAsync(ticketId, content, cancellationToken);
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

        if (effectiveStatus != (int)TicketStatus.Solved)
        {
            // Defensive against GLPI versions that do not auto-solve on solution.
            await _glpi.UpdateTicketStatusAsync(ticketId, (int)TicketStatus.Solved, cancellationToken);
            effectiveStatus = (int)TicketStatus.Solved;
        }

        // Auto-close: resolving a ticket closes it (status 6) in GLPI, exactly like the
        // legacy PATCH /status path. A failure here is logged but never rolls back the
        // resolve that already succeeded.
        try
        {
            await _glpi.UpdateTicketStatusAsync(ticketId, (int)TicketStatus.Closed, cancellationToken);
            effectiveStatus = (int)TicketStatus.Closed;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Auto-close after resolve failed for ticket {TicketId}", ticketId);
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

        if (!await _accessPolicy.CanAddSolutionAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot add solution to ticket {ticketId}");
        }

        int solutionId;
        try
        {
            solutionId = await _glpi.CreateSolutionAsync(ticketId, content, cancellationToken);
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
                await _glpi.CreateFollowupAsync(ticketId, reason.Trim(), isPrivate: true, cancellationToken);
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
    /// bound from a `yyyy-MM-dd` query string) are treated as UTC, matching how GLPI stores
    /// ticket dates. When <paramref name="endOfDay"/> is set and the bound is a date-only
    /// value, it is pushed to 23:59:59.999 so a single-day range includes the whole day.
    /// </summary>
    private static DateTime? ToUtcBound(DateTime? value, bool endOfDay)
    {
        if (!value.HasValue)
        {
            return null;
        }

        var bound = value.Value.Kind switch
        {
            DateTimeKind.Utc => value.Value,
            DateTimeKind.Local => value.Value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
        };

        if (endOfDay && bound.TimeOfDay == TimeSpan.Zero)
        {
            bound = bound.Date.AddDays(1).AddTicks(-1);
        }

        return bound;
    }

    public async Task<int> CreateTicketAsync(
        string title,
        string description,
        int urgency,
        int? categoryId,
        int requesterUserId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw Invalid("title", "title is required.");
        }

        var assignmentGroupId = categoryId is > 0
            ? await _tickets.GetAssignmentGroupForCategoryAsync(categoryId.Value, cancellationToken)
            : null;

        var ticketId = await _glpi.CreateTicketAsync(
            title,
            description ?? string.Empty,
            urgency,
            categoryId,
            requesterUserId,
            assignmentGroupId,
            cancellationToken);

        // Notify SignalR clients about the newly created ticket (Clients.All)
        try
        {
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, cancellationToken);
            var groupId = ticketGroups.FirstOrDefault();
            await _notifications.NotifyTicketCreatedAsync(ticketId, groupId > 0 ? groupId : assignmentGroupId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit TicketCreated SignalR notification for ticket {TicketId}", ticketId);
        }

        return ticketId;
    }
}


