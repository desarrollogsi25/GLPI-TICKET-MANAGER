namespace GlpiTicketManager.Application.Dtos.Dashboard;

/// <summary>
/// Technician in a group with workload metrics for the supervisor team view (H-35).
/// Matches frontend TeamMember interface in TeamDashboard.tsx.
/// </summary>
public sealed record TeamMemberDto(
    int UserId,
    string Name,
    int ActiveTickets,
    int PendingTickets,
    int? CurrentTicketId);
