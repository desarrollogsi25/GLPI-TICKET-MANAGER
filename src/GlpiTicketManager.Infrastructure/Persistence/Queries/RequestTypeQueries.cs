namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL para leer requesttypes activos.
/// </summary>
public static class RequestTypeQueries
{
    /// <summary>
    /// Obtiene todos los requesttypes activos (is_active = 1).
    /// </summary>
    public const string AllActive = """
        SELECT
            CAST(r.id AS SIGNED) AS Id,
            r.name               AS Name
        FROM glpi_requesttypes r
        WHERE r.is_active = 1
        ORDER BY r.name ASC;
        """;
}