namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// A GLPI ticket read directly from the database (<c>glpi_tickets</c>).
/// </summary>
public sealed class Ticket
{
    public int Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string? Content { get; init; }

    public int Status { get; init; }

    public int Type { get; init; }

    public int Priority { get; init; }

    public int Urgency { get; init; }

    public int Impact { get; init; }

    public int? CategoryId { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public DateTime? SolvedAt { get; init; }

    public DateTime? ClosedAt { get; init; }

    public bool IsDeleted { get; init; }

    /// <summary>
    /// True when at least one row exists in <c>glpi_itilsolutions</c> for this ticket.
    /// Required to allow the transition to Solved (ADR-006).
    /// </summary>
    public bool HasSolution { get; set; }

    public IReadOnlyList<int> AssigneeIds { get; set; } = [];

    public IReadOnlyList<int> RequesterIds { get; set; } = [];

    public IReadOnlyList<TicketFollowup> Followups { get; set; } = [];
}
