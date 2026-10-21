namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL used to read GLPI users (authentication).
/// </summary>
public static class UserQueries
{
    public const string ByName = """
        SELECT
            u.id             AS Id,
            u.name           AS Name,
            u.realname       AS RealName,
            u.firstname      AS FirstName,
            u.password       AS PasswordHash,
            u.is_active      AS IsActive,
            u.is_deleted     AS IsDeleted,
            u.entities_id    AS DefaultEntityId,
            u.authtype       AS Auth,
            (SELECT pu.profiles_id
             FROM glpi_profiles_users pu
             WHERE pu.users_id = u.id
             ORDER BY pu.is_default_profile DESC, pu.profiles_id DESC
             LIMIT 1)        AS ProfileId
        FROM glpi_users u
        WHERE u.name = @Username
          AND u.is_deleted = 0
        LIMIT 1;
        """;
}
