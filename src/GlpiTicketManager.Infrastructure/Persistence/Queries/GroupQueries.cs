namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL para leer grupos de la entidad del usuario autenticado.
/// </summary>
public static class GroupQueries
{
    /// <summary>
    /// Obtiene los grupos de la entidad del usuario asignables a tickets.
    /// </summary>
    public const string GetByEntity = """
        SELECT
            CAST(g.id AS SIGNED) AS Id,
            g.name               AS Name
        FROM glpi_groups g
        WHERE g.entities_id = @EntityId
          AND g.is_assign = 1
        ORDER BY g.name ASC;
        """;

    /// <summary>
    /// Obtiene los grupos asignables a los que pertenece el usuario autenticado.
    /// </summary>
    public const string GetByUser = """
        SELECT
            CAST(g.id AS SIGNED) AS Id,
            g.name               AS Name
        FROM glpi_groups g
        INNER JOIN glpi_groups_users gu ON gu.groups_id = g.id
        WHERE gu.users_id = @UserId
          AND g.is_assign = 1
        ORDER BY g.name ASC;
        """;
}