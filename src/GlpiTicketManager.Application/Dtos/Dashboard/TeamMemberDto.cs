namespace GlpiTicketManager.Application.Dtos.Dashboard;

/// <summary>
/// Summary totals by ticket status for a group (H-41).
/// </summary>
public sealed record GroupDashboardSummaryDto(
    long Total,
    long Queued,
    long Assigned,
    long InProgress,
    long Pending,
    long Resolved,
    long Closed);

/// <summary>
/// Technician in a group with workload metrics and latest comment for the supervisor team view (H-35 / H-40 / H-41).
/// Matches frontend TeamMember interface in TeamDashboard.tsx.
/// </summary>
public sealed record TeamMemberDto(
    long UserId,
    string Name,
    long ActiveTickets,
    long PendingTickets,
    long? CurrentTicketId,
    long ResolvedToday = 0,
    long QueuedCount = 0,
    string? LastComment = null)
{
    public long Id => UserId;
    public long? CurrentTicket => CurrentTicketId > 0 ? CurrentTicketId : null;
    public long? ActiveTicket => CurrentTicketId > 0 ? CurrentTicketId : null;
    public long PendingCount => PendingTickets;
}

/// <summary>
/// Complete group dashboard response for the supervisor team view (H-40 / H-41).
/// </summary>
public sealed record GroupDashboardDto(
    long TotalTickets,
    long QueuedTickets,
    long AssignedTickets,
    long InProgressTickets,
    long PendingTickets,
    long ResolvedTickets,
    long ClosedTickets,
    IReadOnlyList<TeamMemberDto> Technicians,
    GroupDashboardSummaryDto? Summary = null)
{
    public GroupDashboardSummaryDto EffectiveSummary =>
        Summary ?? new GroupDashboardSummaryDto(
            TotalTickets,
            QueuedTickets,
            AssignedTickets,
            InProgressTickets,
            PendingTickets,
            ResolvedTickets,
            ClosedTickets);
}
