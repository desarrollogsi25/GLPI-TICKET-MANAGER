namespace GlpiTicketManager.Domain.Entities;

/// <summary>Number of tickets for a given status.</summary>
public sealed class TicketStatusCount
{
    public int Status { get; init; }

    public long Count { get; init; }
}
