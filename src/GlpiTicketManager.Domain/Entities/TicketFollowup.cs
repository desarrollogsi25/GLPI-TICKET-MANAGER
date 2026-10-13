namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// A follow-up (comment / trace) attached to a ticket (<c>glpi_ticketfollowups</c>).
/// </summary>
public sealed class TicketFollowup
{
    public int Id { get; init; }

    public int TicketId { get; init; }

    public int UserId { get; init; }

    public string? Content { get; init; }

    public DateTime CreatedAt { get; init; }

    public bool IsPrivate { get; init; }
}
