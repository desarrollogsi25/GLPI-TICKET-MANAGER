namespace GlpiTicketManager.Application.Dtos.Dashboard;

/// <summary>
/// Summary of group performance and technician load for admin dashboard (H-35).
/// Matches frontend GroupSummary interface in AdminDashboard.tsx.
/// </summary>
public sealed record GroupSummaryDto(
    int GroupId,
    string GroupName,
    int TotalTickets,
    int PendingTickets,
    int ActiveTechnicians);
