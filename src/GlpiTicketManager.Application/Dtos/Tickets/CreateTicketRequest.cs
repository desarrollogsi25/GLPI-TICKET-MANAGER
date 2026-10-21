namespace GlpiTicketManager.Application.Dtos.Tickets;

public sealed record CreateTicketRequest(
    string Title,
    string Description,
    int Urgency = 3,
    int? CategoryId = null
);
