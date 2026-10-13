namespace GlpiTicketManager.Domain.Enums;

/// <summary>
/// Role a user plays on a ticket (column <c>glpi_tickets_users.type</c>).
/// This is the value used to find "tickets assigned to a technician".
/// </summary>
public enum TicketUserType
{
    Requester = 1,
    Assigned = 2,
    Observer = 3
}
