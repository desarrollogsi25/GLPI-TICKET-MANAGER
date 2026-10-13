namespace GlpiTicketManager.Domain.Enums;

/// <summary>
/// Nature of a GLPI ticket (column <c>glpi_tickets.type</c>).
/// </summary>
public enum TicketType
{
    Incident = 1,
    Request = 2
}
