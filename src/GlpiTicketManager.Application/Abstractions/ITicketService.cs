using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Ticket use cases exposed to the API layer.
/// </summary>
public interface ITicketService
{
    Task<PagedResult<TicketSummaryDto>> GetByAssigneeAsync(
        int assigneeId,
        int limit,
        int offset,
        CancellationToken cancellationToken);

    Task<TicketDetailDto?> GetByIdAsync(int ticketId, CancellationToken cancellationToken);

    Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken);

    Task<int> CreateAsync(CreateTicketRequest request, CancellationToken cancellationToken);

    Task<bool> UpdateStatusAsync(int ticketId, int status, CancellationToken cancellationToken);
}
