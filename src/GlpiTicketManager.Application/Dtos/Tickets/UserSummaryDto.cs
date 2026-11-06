namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Summary representation of a GLPI user/technician with display name.
/// Id is Int64 to match MariaDB's unsigned/bigint column types under Dapper.
/// </summary>
public sealed record UserSummaryDto(long Id, string Username, string DisplayName);
