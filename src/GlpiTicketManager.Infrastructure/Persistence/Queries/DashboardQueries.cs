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
                ), 0) AS SIGNED) AS CurrentTicketId,
            CAST(COALESCE(SUM(CASE WHEN t.status IN (5, 6) AND t.is_deleted = 0 AND (DATE(t.solvedate) = UTC_DATE() OR DATE(t.closedate) = UTC_DATE() OR DATE(t.date_mod) = UTC_DATE()) THEN 1 ELSE 0 END), 0) AS INT) AS ResolvedToday,
            CAST(COALESCE((
                SELECT COUNT(1)
                FROM glpi_groups_tickets gt_q
                INNER JOIN glpi_tickets t_q ON t_q.id = gt_q.tickets_id
                WHERE gt_q.groups_id = @GroupId
                  AND gt_q.type = 2
                  AND t_q.is_deleted = 0
                  AND t_q.status IN (1, 2)
                  AND NOT EXISTS (
                      SELECT 1
                      FROM glpi_tickets_users tu_q
                      WHERE tu_q.tickets_id = t_q.id
                        AND tu_q.type = 2
                  )
            ), 0) AS INT) AS QueuedCount,
            COALESCE(
                (
                    SELECT f.content
                    FROM glpi_itilfollowups f
                    INNER JOIN glpi_tickets_users tu_f ON tu_f.tickets_id = f.items_id AND tu_f.type = 2
                    WHERE f.itemtype = 'Ticket'
                      AND (f.users_id = u.id OR tu_f.users_id = u.id)
                    ORDER BY f.date_creation DESC, f.id DESC
                    LIMIT 1
                ),
                (
                    SELECT s.content
                    FROM glpi_itilsolutions s
                    INNER JOIN glpi_tickets_users tu_s ON tu_s.tickets_id = s.items_id AND tu_s.type = 2
                    WHERE s.itemtype = 'Ticket'
                      AND (s.users_id = u.id OR tu_s.users_id = u.id)
                    ORDER BY s.date_creation DESC, s.id DESC
                    LIMIT 1
                )
            ) AS LastComment,
            NULLIF(
                GREATEST(
                    COALESCE((
                        SELECT MAX(t_act.date_mod)
                        FROM glpi_tickets_users tu_act
                        INNER JOIN glpi_tickets t_act ON t_act.id = tu_act.tickets_id
                        WHERE tu_act.users_id = u.id AND tu_act.type = 2 AND t_act.is_deleted = 0
                    ), '1970-01-01 00:00:00'),
                    COALESCE((
                        SELECT MAX(f_act.date_creation)
                        FROM glpi_itilfollowups f_act
                        WHERE f_act.users_id = u.id
                    ), '1970-01-01 00:00:00')
                ),
                '1970-01-01 00:00:00'
            ) AS LastActivity
        FROM glpi_groups_users gu
        INNER JOIN glpi_users u ON u.id = gu.users_id
        LEFT JOIN glpi_tickets_users tu ON tu.users_id = u.id AND tu.type = 2
        LEFT JOIN glpi_tickets t ON t.id = tu.tickets_id AND t.is_deleted = 0
        WHERE gu.groups_id = @GroupId
          AND u.is_deleted = 0
        GROUP BY u.id, u.name
        ORDER BY u.name ASC;
        """;

    public const string GroupTicketTotals = """
        SELECT
            CAST(COUNT(1) AS INT) AS TotalTickets,
            CAST(COALESCE(SUM(CASE WHEN t.status IN (1, 2) AND NOT EXISTS (
                SELECT 1 FROM glpi_tickets_users tu WHERE tu.tickets_id = t.id AND tu.type = 2
            ) THEN 1 ELSE 0 END), 0) AS INT) AS QueuedTickets,
            CAST(COALESCE(SUM(CASE WHEN t.status IN (1, 2) AND EXISTS (
                SELECT 1 FROM glpi_tickets_users tu WHERE tu.tickets_id = t.id AND tu.type = 2
            ) THEN 1 ELSE 0 END), 0) AS INT) AS AssignedTickets,
            CAST(COALESCE(SUM(CASE WHEN t.status = 3 THEN 1 ELSE 0 END), 0) AS INT) AS InProgressTickets,
            CAST(COALESCE(SUM(CASE WHEN t.status = 4 THEN 1 ELSE 0 END), 0) AS INT) AS PendingTickets,
            CAST(COALESCE(SUM(CASE WHEN t.status = 5 THEN 1 ELSE 0 END), 0) AS INT) AS ResolvedTickets,
            CAST(COALESCE(SUM(CASE WHEN t.status = 6 THEN 1 ELSE 0 END), 0) AS INT) AS ClosedTickets
        FROM glpi_groups_tickets gt
        INNER JOIN glpi_tickets t ON t.id = gt.tickets_id
        WHERE gt.groups_id = @GroupId
          AND gt.type = 2
          AND t.is_deleted = 0;
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

    public const string GroupTickets = """
        SELECT
            CAST(t.id AS SIGNED)       AS Id,
            t.name                      AS Title,
            CAST(t.status AS INT)       AS Status,
            CAST(tu.users_id AS SIGNED) AS AssigneeId,
            u.name                      AS AssigneeName,
            CAST(t.priority AS INT)     AS Priority,
            t.date                      AS CreatedAt,
            t.date_mod                  AS UpdatedAt,
            COALESCE(
                (SELECT f.content FROM glpi_itilfollowups f WHERE f.itemtype = 'Ticket' AND f.items_id = t.id ORDER BY f.date_creation DESC, f.id DESC LIMIT 1),
                (SELECT s.content FROM glpi_itilsolutions s WHERE s.itemtype = 'Ticket' AND s.items_id = t.id ORDER BY s.date_creation DESC, s.id DESC LIMIT 1)
            )                           AS LastComment
        FROM glpi_groups_tickets gt
        INNER JOIN glpi_tickets t ON t.id = gt.tickets_id
        LEFT JOIN (
            SELECT tickets_id, MIN(users_id) AS users_id
            FROM glpi_tickets_users
            WHERE type = 2
            GROUP BY tickets_id
        ) tu ON tu.tickets_id = t.id
        LEFT JOIN glpi_users u ON u.id = tu.users_id
        WHERE gt.groups_id = @GroupId
          AND gt.type = 2
          AND t.is_deleted = 0
        ORDER BY t.date_mod DESC, t.id DESC;
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
