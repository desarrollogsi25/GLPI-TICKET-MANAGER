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
            r.id            AS Id,
            r.name          AS Name
        FROM glpi_requesttypes r
        WHERE r.is_active = 1
          AND r.is_deleted = 0
        ORDER BY r.name ASC;
        """;
}