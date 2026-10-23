namespace GlpiTicketManager.Application.Dtos.Dashboard;

/// <summary>
/// Technician in a group with workload metrics for the supervisor team view (H-35 / H-40).
/// Matches frontend TeamMember interface in TeamDashboard.tsx.
/// </summary>
public sealed record TeamMemberDto(
    long UserId,
    string Name,
    long ActiveTickets,
    long PendingTickets,
    long? CurrentTicketId,
    long ResolvedToday = 0)
{
    public long Id => UserId;
    public long? CurrentTicket => CurrentTicketId > 0 ? CurrentTicketId : null;
}

/// <summary>
/// Complete group dashboard response for the supervisor team view (H-40).
/// </summary>
public sealed record GroupDashboardDto(
    long TotalTickets,
    long QueuedTickets,
    long AssignedTickets,
    long InProgressTickets,
    long PendingTickets,
    long ResolvedTickets,
    long ClosedTickets,
    IReadOnlyList<TeamMemberDto> Technicians);

