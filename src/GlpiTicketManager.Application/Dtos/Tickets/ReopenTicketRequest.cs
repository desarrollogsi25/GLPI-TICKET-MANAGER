namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Payload to reopen a resolved or closed ticket (status 5 or 6).
/// </summary>
public sealed record ReopenTicketRequest
{
    public string? Reason { get; init; }
}
