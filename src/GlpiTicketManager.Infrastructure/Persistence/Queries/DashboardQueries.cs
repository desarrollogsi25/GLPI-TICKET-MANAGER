namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper SQL queries for team/admin dashboards and webhook integrations against MariaDB (GLPI).
/// </summary>
public static class DashboardQueries
{
    public const string TeamMembersByGroup = """
        SELECT
            CAST(u.id AS INT) AS UserId,
            u.name               AS Name,
            CAST(COALESCE(SUM(CASE WHEN t.status IN (2, 3) AND t.is_deleted = 0 THEN 1 ELSE 0 END), 0) AS INT) AS ActiveTickets,
            CAST(COALESCE(SUM(CASE WHEN t.status = 4 AND t.is_deleted = 0 THEN 1 ELSE 0 END), 0) AS INT)       AS PendingTickets,
            CAST(
                COALESCE((
                    SELECT CAST(t2.id AS SIGNED)
                    FROM glpi_tickets t2
                    INNER JOIN glpi_tickets_users tu2 ON tu2.tickets_id = t2.id
                    WHERE tu2.users_id = u.id
                      AND tu2.type = 2
                      AND t2.status IN (2, 3)
                      AND t2.is_deleted = 0
                    ORDER BY t2.date_mod DESC, t2.id DESC
                    LIMIT 1
                ), 0) AS SIGNED) AS CurrentTicketId
        FROM glpi_groups_users gu
        INNER JOIN glpi_users u ON u.id = gu.users_id
        LEFT JOIN glpi_tickets_users tu ON tu.users_id = u.id AND tu.type = 2
        LEFT JOIN glpi_tickets t ON t.id = tu.tickets_id AND t.is_deleted = 0
        WHERE gu.groups_id = @GroupId
          AND u.is_deleted = 0
        GROUP BY u.id, u.name
        ORDER BY u.name ASC;
        """;

    public const string AdminGroupSummaries = """
        SELECT
            CAST(g.id AS INT) AS GroupId,
            g.name               AS GroupName,
            CAST(COALESCE((
                SELECT COUNT(1)
                FROM glpi_groups_tickets gt
                INNER JOIN glpi_tickets t ON t.id = gt.tickets_id
                WHERE gt.groups_id = g.id
                  AND gt.type = 2
                  AND t.is_deleted = 0
            ), 0) AS INT) AS TotalTickets,
            CAST(COALESCE((
                SELECT COUNT(1)
                FROM glpi_groups_tickets gt
                INNER JOIN glpi_tickets t ON t.id = gt.tickets_id
                WHERE gt.groups_id = g.id
                  AND gt.type = 2
                  AND t.status = 4
                  AND t.is_deleted = 0
            ), 0) AS INT) AS PendingTickets,
            CAST(COALESCE((
                SELECT COUNT(DISTINCT gu.users_id)
                FROM glpi_groups_users gu
                INNER JOIN glpi_users u ON u.id = gu.users_id
                WHERE gu.groups_id = g.id
                  AND u.is_deleted = 0
            ), 0) AS INT) AS ActiveTechnicians
        FROM glpi_groups g
        WHERE g.is_assign = 1
        ORDER BY g.name ASC;
        """;

    public const string TicketGroupAssignment = """
        SELECT
            CAST(t.id AS SIGNED)        AS TicketId,
            t.name                      AS TicketName,
            CAST(gt.groups_id AS SIGNED) AS GroupId
        FROM glpi_tickets t
        INNER JOIN glpi_groups_tickets gt ON gt.tickets_id = t.id AND gt.type = 2
        WHERE t.id = @TicketId
          AND t.is_deleted = 0
        LIMIT 1;
        """;

    public const string TechnicianUserIdsInGroup = """
        SELECT
            CAST(gu.users_id AS SIGNED)
        FROM glpi_groups_users gu
        INNER JOIN glpi_users u ON u.id = gu.users_id
        WHERE gu.groups_id = @GroupId
          AND u.is_deleted = 0;
        """;
}
