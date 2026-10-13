namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// Link between a user and a ticket (<c>glpi_tickets_users</c>).
/// </summary>
public sealed class TicketUser
{
    public int TicketId { get; init; }

    public int UserId { get; init; }

    /// <summary>See <see cref="Enums.TicketUserType"/>.</summary>
    public int Type { get; init; }
}
