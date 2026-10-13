namespace GlpiTicketManager.Application.Dtos.Dashboard;

public sealed record StatusCountDto(int Status, string StatusLabel, long Count);

public sealed record TechnicianWorkloadDto(int UserId, long OpenTickets);

/// <summary>
/// Aggregated metrics for the dashboard.
/// </summary>
public sealed record DashboardStatsDto(
    long TotalTickets,
    long OpenTickets,
    long NewTickets,
    long AssignedTickets,
    long PendingTickets,
    long SolvedTickets,
    long ClosedTickets,
    long OverdueTickets,
    decimal? AverageResolutionHours,
    IReadOnlyList<StatusCountDto> ByStatus,
    IReadOnlyList<TechnicianWorkloadDto> ByTechnician);
