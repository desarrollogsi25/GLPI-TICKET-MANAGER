namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// Aggregated ticket metrics for the dashboard.
/// </summary>
public sealed class DashboardStats
{
    public long TotalTickets { get; set; }

    public long OpenTickets { get; set; }

    public long NewTickets { get; set; }

    public long AssignedTickets { get; set; }

    public long ExecutionTickets { get; set; }

    public long PlannedTickets { get; set; }

    public long PausedTickets { get; set; }

    public long PendingTickets { get; set; }

    public long SolvedTickets { get; set; }

    public long ClosedTickets { get; set; }

    public long OverdueTickets { get; set; }

    public long DueSoonTickets { get; set; }

    public long ScheduledTasksCount { get; set; }

    public decimal? AverageResolutionHours { get; set; }

    public IReadOnlyList<TicketStatusCount> ByStatus { get; set; } = [];

    public IReadOnlyList<TechnicianWorkload> ByTechnician { get; set; } = [];
}
