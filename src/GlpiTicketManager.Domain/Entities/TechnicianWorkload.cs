namespace GlpiTicketManager.Domain.Entities;

/// <summary>Open ticket count per assigned technician.</summary>
public sealed class TechnicianWorkload
{
    public int UserId { get; init; }

    public long OpenTickets { get; init; }
}
