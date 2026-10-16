namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL para la tabla <c>glpi_itilsolutions</c> — solución escrita al cerrar un ticket (ADR-006).
/// </summary>
public static class SolutionQueries
{

    /// <summary>
    /// Verifica que al menos exista una solución escrita válida para el ticket.
    /// </summary>
    public const string Exists = """
        SELECT COUNT(*) > 0 AS HasSolution
        FROM glpi_itilsolutions
        WHERE itemtype = 'Ticket'
          AND items_id = @TicketId
          AND TRIM(content) <> ''
          AND CHAR_LENGTH(TRIM(content)) >= 10;
        """;
}