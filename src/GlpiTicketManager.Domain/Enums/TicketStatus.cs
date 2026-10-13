namespace GlpiTicketManager.Domain.Enums;

/// <summary>
/// Lifecycle status of a GLPI ticket (column <c>glpi_tickets.status</c>).
/// </summary>
public enum TicketStatus
{
    New = 1,
    Assigned = 2,
    Planned = 3,
    Waiting = 4,
    Solved = 5,
    Closed = 6
}
