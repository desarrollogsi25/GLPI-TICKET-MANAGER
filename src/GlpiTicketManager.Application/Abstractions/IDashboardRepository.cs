using GlpiTicketManager.Application.Dtos.Dashboard;

namespace GlpiTicketManager.Application.Abstractions;

public sealed record GlpiTicketGroupInfo(int TicketId, string TicketName, int GroupId);

public interface IDashboardRepository
{
    Task<IReadOnlyList<TeamMemberDto>> GetTeamMembersByGroupAsync(int groupId, CancellationToken ct = default);
    Task<IReadOnlyList<GroupSummaryDto>> GetAdminGroupSummariesAsync(CancellationToken ct = default);
    Task<GlpiTicketGroupInfo?> GetTicketGroupAssignmentAsync(int ticketId, CancellationToken ct = default);
    Task<IReadOnlyList<int>> GetTechnicianUserIdsInGroupAsync(int groupId, CancellationToken ct = default);
}
