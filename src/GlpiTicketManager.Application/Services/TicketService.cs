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

    public async Task<PagedResult<TicketSummaryDto>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
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

        var effectiveLimit = limit <= 0 ? DefaultLimit : Math.Min(limit, MaxLimit);
        var effectiveOffset = Math.Max(offset, 0);

        var rows = await _tickets.GetFilteredAsync(assigneeId, serviceId, effectiveLimit, effectiveOffset, cancellationToken);
        var total = await _tickets.CountFilteredAsync(assigneeId, serviceId, cancellationToken);

        if (rows.Count > 0)
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
        UpdateStatusAsync(ticketId, status, userId, AppRole.Technician, cancellationToken);

    public async Task<bool> UpdateStatusAsync(
        int ticketId,
        int status,
        int userId,
        AppRole role,
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

        if (!await _accessPolicy.CanModifyStatusAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot modify status of ticket {ticketId}");
        }

        if (status == (int)TicketStatus.Solved)
        {
            var solutionExists = await _tickets.SolutionExistsAsync(ticketId, cancellationToken);
            if (!solutionExists)
            {
                throw new UnprocessableEntityException("Ticket no puede marcarse como resuelto sin solución escrita.");
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
            await _notifications.NotifyTicketStatusChangedAsync(ticketId, status, assigneeId, cancellationToken);
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

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            throw new NotFoundException($"Ticket {ticketId} not found.");
        }

        if (!await _accessPolicy.CanAddSolutionAsync(userId, role, ticketId, cancellationToken))
        {
            throw new ForbiddenException($"User {userId} cannot add solution to ticket {ticketId}");
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ValidationException("content", "Solution content cannot be empty.");
        }

        if (content.Trim().Length < 10)
        {
            throw new ValidationException("content", "Solution content must be at least 10 characters.");
        }

        if (content.Length > 2000)
        {
            throw new ValidationException("content", "Solution content exceeds maximum length.");
        }

        var solutionId = await _glpi.CreateSolutionAsync(ticketId, content, cancellationToken);

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
            await _audit.LogAsync(userId, "reopen", ticketId, reason, cancellationToken);
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
}

