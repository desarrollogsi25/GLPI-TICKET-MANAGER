namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>GLPI 11 native TicketTask snapshot. All dates have explicit UTC offsets.</summary>
public sealed record TicketTaskDto(
    int Id,
    int TicketId,
    int TechnicianId,
    string Content,
    int State,
    bool IsPrivate,
    DateTimeOffset? StartAt,
    DateTimeOffset? EndAt,
    int DurationSeconds);
