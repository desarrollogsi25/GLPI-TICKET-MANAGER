using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Channels;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Read-side access to tickets. All reads go straight to MariaDB through Dapper.
/// </summary>
public interface ITicketRepository
{
    Task<IReadOnlyList<Ticket>> GetByAssigneeAsync(
        int assigneeId,
        int limit,
        int offset,
        CancellationToken cancellationToken);

    Task<long> CountByAssigneeAsync(int assigneeId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Ticket>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int limit,
        int offset,
        CancellationToken cancellationToken);

    Task<long> CountFilteredAsync(
        int? assigneeId,
        int? serviceId,
        CancellationToken cancellationToken);

    Task<Ticket?> GetByIdAsync(int ticketId, CancellationToken cancellationToken);

    /// <summary>Loads the user links (requesters / assignees) for a set of tickets.</summary>
    Task<IReadOnlyList<TicketUser>> GetUsersForTicketsAsync(
        IReadOnlyCollection<int> ticketIds,
        CancellationToken cancellationToken);

    Task<DashboardStats> GetDashboardStatsAsync(CancellationToken cancellationToken);

    Task<PagedResult<Ticket>> GetUnassignedByGroupAsync(
        int groupId,
        int limit,
        int offset,
        CancellationToken cancellationToken);

    Task<bool> ClaimAsync(int ticketId, int userId, int updatedBy, CancellationToken cancellationToken);

    Task<bool> SolutionExistsAsync(int ticketId, CancellationToken cancellationToken);

    Task<int> SolutionInsertAsync(int ticketId, string content, int userId, CancellationToken cancellationToken);

    Task<bool> IsUserInTicketGroupAsync(int ticketId, int userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<int>> GetGroupIdsForUserAsync(int userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<int>> GetGroupIdsForTicketAsync(int ticketId, CancellationToken cancellationToken);

    Task<bool> IsUserAssignedToTicketAsync(int userId, int ticketId, CancellationToken cancellationToken);
}