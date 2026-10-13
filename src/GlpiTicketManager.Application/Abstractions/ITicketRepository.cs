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

    Task<Ticket?> GetByIdAsync(int ticketId, CancellationToken cancellationToken);

    /// <summary>Loads the user links (requesters / assignees) for a set of tickets.</summary>
    Task<IReadOnlyList<TicketUser>> GetUsersForTicketsAsync(
        IReadOnlyCollection<int> ticketIds,
        CancellationToken cancellationToken);

    Task<DashboardStats> GetDashboardStatsAsync(CancellationToken cancellationToken);
}
