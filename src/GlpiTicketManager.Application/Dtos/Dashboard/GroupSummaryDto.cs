namespace GlpiTicketManager.Application.Dtos.Dashboard;

/// <summary>
/// Summary of group performance and technician load for admin dashboard (H-35).
/// Matches frontend GroupSummary interface in AdminDashboard.tsx.
/// </summary>
public sealed record GroupSummaryDto(
    long GroupId,
    string GroupName,
    long TotalTickets,
    long PendingTickets,
    long ActiveTechnicians);
