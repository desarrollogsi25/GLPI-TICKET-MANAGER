namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL para la tabla <c>glpi_itilsolutions</c> — solución escrita al cerrar un ticket (ADR-006).
/// </summary>
public static class SolutionQueries
{
    /// <summary>
    /// Inserta una solución en glpi_itilsolutions.
    /// Devuelve el id de la fila insertada (LAST_INSERT_ID).
    /// </summary>
    public const string Insert = """
        INSERT INTO glpi_itilsolutions
            (itemtype, items_id, content, users_id, date_creation, status)
        VALUES
            ('Ticket', @TicketId, @Content, @UserId, NOW(), 1);

        SELECT LAST_INSERT_ID() AS Id;
        """;

    /// <summary>
    /// Verifica que al menos exista una solución escrita para el ticket.
    /// </summary>
    public const string Exists = """
        SELECT COUNT(*) > 0 AS HasSolution
        FROM glpi_itilsolutions
        WHERE itemtype = 'Ticket'
          AND items_id = @TicketId;
        """;
}