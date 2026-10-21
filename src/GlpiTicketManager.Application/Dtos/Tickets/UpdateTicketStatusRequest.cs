namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Payload to change the status of a ticket (1 = New ... 6 = Closed).
/// </summary>
public sealed record UpdateTicketStatusRequest
{
    public int Status { get; init; }
    public string? Solution { get; init; }
}
