namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL para leer grupos de la entidad del usuario autenticado.
/// </summary>
public static class GroupQueries
{
    /// <summary>
    /// Obtiene los grupos de la entidad del usuario.
    /// </summary>
    public const string ByEntity = """
        SELECT
            g.id                AS Id,
            g.name              AS Name
        FROM glpi_groups g
        WHERE g.entities_id = @EntityId
          AND g.is_deleted = 0
        ORDER BY g.name ASC;
        """;
}