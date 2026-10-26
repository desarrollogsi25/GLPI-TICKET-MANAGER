namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Payload to place a ticket into Pending (Waiting = 4) status (H-34).
/// </summary>
public sealed record PendingTicketRequest
{
    public int ReasonId { get; init; }
    public string Comment { get; init; } = string.Empty;
}
