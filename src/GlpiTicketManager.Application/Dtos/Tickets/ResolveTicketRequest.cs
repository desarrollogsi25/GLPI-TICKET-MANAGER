namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Payload of the atomic resolve operation (BUG-031 / H-31).
/// A single call writes the solution and drives the ticket to its resolved state,
/// so the technician never has to orchestrate two requests.
/// </summary>
public sealed record ResolveTicketRequest
{
    /// <summary>
    /// Free-text solution written by the assigned technician.
    /// Required, 1..2000 characters once trimmed. Short solutions such as "OK" are valid.
    /// </summary>
    public string Content { get; init; } = string.Empty;
}
