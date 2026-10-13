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

    public Task<int> CreateAsync(CreateTicketRequest request, CancellationToken cancellationToken)
    {
        ValidateCreate(request);
        return _glpi.CreateTicketAsync(request, cancellationToken);
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

    private static void ValidateCreate(CreateTicketRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            errors["title"] = ["title is required."];
        }

        if (!Enum.IsDefined((TicketType)request.Type))
        {
            errors["type"] = ["type must be 1 (Incident) or 2 (Request)."];
        }

        if (!Enum.IsDefined((TicketPriority)request.Urgency))
        {
            errors["urgency"] = ["urgency must be between 1 and 6."];
        }

        if (!Enum.IsDefined((TicketPriority)request.Impact))
        {
            errors["impact"] = ["impact must be between 1 and 6."];
        }

        if (errors.Count > 0)
        {
            throw new ValidationException(errors);
        }
    }

    private static ValidationException Invalid(string field, string message) =>
        new(new Dictionary<string, string[]> { [field] = [message] });
}
