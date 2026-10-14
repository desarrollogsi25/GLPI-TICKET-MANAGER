namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Payload to attach a written solution to a ticket (ADR-006).
/// A solution is required before a ticket can be marked as Solved.
/// </summary>
public sealed record SolutionRequest
{
    /// <summary>Free-text solution written by the assigned technician.</summary>
    public string Content { get; init; } = string.Empty;
}
