namespace GlpiTicketManager.Application.Models;

/// <summary>
/// Last known status of a ticket touched directly in GLPI. MariaDB returns SIGNED
/// integers as Int64, so the Dapper row keeps long values.
/// </summary>
public sealed record TicketChange(long TicketId, long Status, long? AssigneeId, DateTime ModifiedAt);
