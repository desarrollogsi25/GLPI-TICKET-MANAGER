using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Dtos.Channels;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Domain.Enums;

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

    Task<PagedResult<TicketSummaryDto>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int limit,
        int offset,
        CancellationToken cancellationToken);

    Task<TicketDetailDto?> GetByIdAsync(int ticketId, CancellationToken cancellationToken);

    Task<TicketDetailDto?> GetByIdAsync(int ticketId, int userId, CancellationToken cancellationToken);

    Task<TicketDetailDto?> GetByIdAsync(int ticketId, int userId, AppRole role, CancellationToken cancellationToken);

    Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken);

    Task<DashboardStatsDto> GetDashboardStatsAsync(DashboardScope? scope, CancellationToken cancellationToken);

    Task<bool> UpdateStatusAsync(int ticketId, int status, int userId, CancellationToken cancellationToken);

    Task<bool> UpdateStatusAsync(int ticketId, int status, int userId, AppRole role, CancellationToken cancellationToken);

    Task<PagedResult<TicketSummaryDto>> GetUnassignedByGroupAsync(
        int groupId,
        int limit,
        int offset,
        CancellationToken cancellationToken);

    Task<PagedResult<TicketSummaryDto>> GetUnassignedByGroupAsync(
        int groupId,
        int userId,
        int limit,
        int offset,
        CancellationToken cancellationToken);

    Task<PagedResult<TicketSummaryDto>> GetUnassignedByGroupAsync(
        int groupId,
        int userId,
        AppRole role,
        int limit,
        int offset,
        CancellationToken cancellationToken);

    Task<TicketDetailDto> ClaimAsync(int ticketId, int userId, CancellationToken cancellationToken);

    Task<TicketDetailDto> ClaimAsync(int ticketId, int userId, AppRole role, CancellationToken cancellationToken);

    Task<bool> SolutionExistsAsync(int ticketId, CancellationToken cancellationToken);

    Task<int> SolutionInsertAsync(int ticketId, string content, int userId, CancellationToken cancellationToken);

    Task<int> SolutionInsertAsync(int ticketId, string content, int userId, AppRole role, CancellationToken cancellationToken);

    Task<bool> IsUserInTicketGroupAsync(int ticketId, int userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<int>> GetGroupIdsForUserAsync(int userId, CancellationToken cancellationToken);

    Task<TicketDetailDto> ReopenAsync(int ticketId, int userId, string? reason, CancellationToken cancellationToken);

    Task<TicketDetailDto> ReopenAsync(int ticketId, int userId, AppRole role, string? reason, CancellationToken cancellationToken);
}