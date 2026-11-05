namespace GlpiTicketManager.Application.Models;

/// <summary>Last known status of a ticket touched directly in GLPI.</summary>
public sealed record TicketChange(int TicketId, int Status, int? AssigneeId, DateTime ModifiedAt);
