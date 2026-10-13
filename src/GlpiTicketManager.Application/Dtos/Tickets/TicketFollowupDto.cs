namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// A follow-up (comment / trace) on a ticket.
/// </summary>
public sealed record TicketFollowupDto(
    int Id,
    int UserId,
    string? Content,
    DateTime CreatedAt,
    bool IsPrivate);
