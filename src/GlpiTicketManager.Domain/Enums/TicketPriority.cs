namespace GlpiTicketManager.Domain.Enums;

/// <summary>
/// Priority of a GLPI ticket (column <c>glpi_tickets.priority</c>).
/// </summary>
public enum TicketPriority
{
    VeryLow = 1,
    Low = 2,
    Medium = 3,
    High = 4,
    VeryHigh = 5,
    Major = 6
}
