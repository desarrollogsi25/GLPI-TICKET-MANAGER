using GlpiTicketManager.Application.Dtos.Dashboard;

namespace GlpiTicketManager.Application.Abstractions;

public sealed record GlpiTicketGroupInfo
{
    public int TicketId { get; init; }
    public string TicketName { get; init; } = string.Empty;
    public int GroupId { get; init; }

    public GlpiTicketGroupInfo() { }

    public GlpiTicketGroupInfo(int ticketId, string ticketName, int groupId)
    {
        TicketId = ticketId;
        TicketName = ticketName;
        GroupId = groupId;
    }

    public GlpiTicketGroupInfo(long ticketId, string ticketName, long groupId)
    {
        TicketId = (int)ticketId;
        TicketName = ticketName;
        GroupId = (int)groupId;
    }
}

public interface IDashboardRepository
{
    Task<IReadOnlyList<TeamMemberDto>> GetTeamMembersByGroupAsync(int groupId, CancellationToken ct = default);
    Task<IReadOnlyList<GroupSummaryDto>> GetAdminGroupSummariesAsync(CancellationToken ct = default);
    Task<GlpiTicketGroupInfo?> GetTicketGroupAssignmentAsync(int ticketId, CancellationToken ct = default);
    Task<IReadOnlyList<int>> GetTechnicianUserIdsInGroupAsync(int groupId, CancellationToken ct = default);
}
