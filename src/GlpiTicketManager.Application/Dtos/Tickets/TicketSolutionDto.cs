namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Solution item representation.
/// </summary>
public sealed record TicketSolutionDto(
    int Id,
    int UserId,
    string Content,
    DateTime CreatedAt);
