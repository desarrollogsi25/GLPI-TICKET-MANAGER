namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL para la tabla <c>glpi_itilsolutions</c> — solución escrita al cerrar un ticket (ADR-006).
/// </summary>
public static class SolutionQueries
{

    /// <summary>
    /// Verifica que al menos exista una solución escrita válida para el ticket.
    /// </summary>
    /// <remarks>
    /// BUG-031 (H-31): esta consulta imponía un mínimo de 10 caracteres que el API no
    /// exige (sólo rechaza vacío y &gt; 2000). Una solución corta como "OK" se insertaba
    /// correctamente (201) pero esta consulta no la encontraba, por lo que el cambio de
    /// estado a Resuelto respondía 422 "Ticket no puede marcarse como resuelto sin
    /// solución escrita" aunque la solución sí existiera. El contrato válido es
    /// "contenido no vacío"; las soluciones obsoletas (status = 4) siguen sin contar.
    /// </remarks>
    public const string Exists = """
        SELECT COUNT(*) > 0 AS HasSolution
        FROM glpi_itilsolutions
        WHERE itemtype = 'Ticket'
          AND items_id = @TicketId
          AND status <> 4
          AND TRIM(content) <> '';
        """;
}