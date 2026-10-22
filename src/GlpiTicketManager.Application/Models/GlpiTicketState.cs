namespace GlpiTicketManager.Application.Models;

/// <summary>
/// The state of a ticket as GLPI reports it, read back through the REST API.
///
/// BUG-032 / H-31: GLPI owns the status and the solutions of a ticket. Writing to it
/// and then reading the row from MariaDB is not a verification: MariaDB is GLPI's own
/// table and the write may not be visible there yet. The only reliable way to confirm
/// that a status change or a solution was persisted is to ask GLPI.
/// </summary>
/// <param name="TicketId">Identifier of the ticket.</param>
/// <param name="Status">Current status as GLPI sees it (1 New … 6 Closed).</param>
/// <param name="SolvedAt">When the ticket was solved, or null when it was not.</param>
/// <param name="ClosedAt">When the ticket was closed, or null when it was not.</param>
public sealed record GlpiTicketState(
    int TicketId,
    int Status,
    DateTime? SolvedAt = null,
    DateTime? ClosedAt = null);
