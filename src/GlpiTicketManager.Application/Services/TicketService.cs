using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Mapping;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;

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

    public TicketService(ITicketRepository tickets, IGlpiApiClient glpi)
    {
        _tickets = tickets;
        _glpi = glpi;
    }

    public async Task<PagedResult<TicketSummaryDto>> GetByAssigneeAsync(
        int assigneeId,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        if (assigneeId <= 0)
        {
            throw Invalid("assigneeId", "assigneeId must be a positive integer.");
        }

        var effectiveLimit = limit <= 0 ? DefaultLimit : Math.Min(limit, MaxLimit);
        var effectiveOffset = Math.Max(offset, 0);

        var rows = await _tickets.GetByAssigneeAsync(assigneeId, effectiveLimit, effectiveOffset, cancellationToken);
        var total = await _tickets.CountByAssigneeAsync(assigneeId, cancellationToken);

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

    public async Task<TicketDetailDto?> GetByIdAsync(int ticketId, CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            throw Invalid("id", "id must be a positive integer.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, cancellationToken);
        return ticket?.ToDetail();
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken)
    {
        var stats = await _tickets.GetDashboardStatsAsync(cancellationToken);

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

    public async Task<bool> UpdateStatusAsync(
        int ticketId,
        int status,
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
            return true;
        }
        catch (GlpiApiException exception) when (exception.StatusCode == 404)
        {
            return false;
        }
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

    public async Task<TicketDetailDto> ClaimAsync(int ticketId, int userId, CancellationToken cancellationToken)
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

        var isMember = await _tickets.IsUserInTicketGroupAsync(ticketId, userId, cancellationToken);
        if (!isMember)
        {
            throw new ConflictException("El usuario no pertenece al grupo del ticket.");
        }

        var claimed = await _tickets.ClaimAsync(ticketId, userId, userId, cancellationToken);

        if (!claimed)
        {
            throw new ConflictException("No se pudo reclamar el ticket.");
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

    public async Task<int> SolutionInsertAsync(int ticketId, string content, int userId, CancellationToken cancellationToken)
    {
        return await _tickets.SolutionInsertAsync(ticketId, content, userId, cancellationToken);
    }

    public async Task<bool> IsUserInTicketGroupAsync(int ticketId, int userId, CancellationToken cancellationToken)
    {
        return await _tickets.IsUserInTicketGroupAsync(ticketId, userId, cancellationToken);
    }

    public Task<IReadOnlyList<int>> GetGroupIdsForUserAsync(int userId, CancellationToken cancellationToken)
    {
        return _tickets.GetGroupIdsForUserAsync(userId, cancellationToken);
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

