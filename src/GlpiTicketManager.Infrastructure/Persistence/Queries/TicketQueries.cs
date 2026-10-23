using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL used to read tickets straight from the GLPI schema.
/// Column aliases match the domain entity property names so Dapper maps them 1:1.
/// </summary>
public static class TicketQueries
{
    /// <summary>Shared projection over <c>glpi_tickets</c>, terminated by a newline.</summary>
    public const string BaseProjection = """
        SELECT
            t.id                AS Id,
            t.name              AS Name,
            t.content           AS Content,
            t.status            AS Status,
            t.type              AS Type,
            t.priority          AS Priority,
            t.urgency           AS Urgency,
            t.impact            AS Impact,
            t.itilcategories_id AS CategoryId,
            t.date              AS CreatedAt,
            t.date_mod          AS UpdatedAt,
            t.solvedate         AS SolvedAt,
            t.closedate         AS ClosedAt,
            t.is_deleted        AS IsDeleted,
            (SELECT COUNT(*) > 0
             FROM glpi_itilsolutions s
             WHERE s.itemtype = 'Ticket'
               AND s.items_id = t.id) AS HasSolution
        FROM glpi_tickets t
        """ + "\n";

    /// <summary>
    /// Tickets where the given user is the assigned technician.
    /// NOTE: "type = 2" refers to <c>glpi_tickets_users.type</c> (2 = assigned technician),
    /// not the ticket nature stored in <c>glpi_tickets.type</c>.
    /// </summary>
    public const string ByAssignee = BaseProjection + """

        INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id
        WHERE tu.users_id = @AssigneeId
          AND tu.type = 2
          AND t.is_deleted = 0
        ORDER BY t.date ASC
        LIMIT @Limit OFFSET @Offset;
        """;

    public const string UnassignedByGroup = """
        SELECT
            t.id                AS Id,
            t.name              AS Name,
            t.content           AS Content,
            t.status            AS Status,
            t.type              AS Type,
            t.priority          AS Priority,
            t.urgency           AS Urgency,
            t.impact            AS Impact,
            t.itilcategories_id AS CategoryId,
            t.date              AS CreatedAt,
            t.date_mod          AS UpdatedAt,
            t.solvedate         AS SolvedAt,
            t.closedate         AS ClosedAt,
            t.is_deleted        AS IsDeleted,
            (SELECT COUNT(*) > 0
             FROM glpi_itilsolutions s
             WHERE s.itemtype = 'Ticket'
               AND s.items_id = t.id) AS HasSolution
        FROM glpi_tickets t
        INNER JOIN glpi_groups_tickets gt ON t.id = gt.tickets_id
        WHERE gt.groups_id = @GroupId
          AND gt.type = 2
          AND t.status IN (1, 2)
          AND t.is_deleted = 0
          AND NOT EXISTS (
            SELECT 1 FROM glpi_tickets_users tu
            WHERE tu.tickets_id = t.id AND tu.type = 2
          )
        ORDER BY t.date DESC
        LIMIT @Limit OFFSET @Offset;
        """;

    public const string ById = BaseProjection + """

        WHERE t.id = @TicketId
          AND t.is_deleted = 0;
        """;

    public const string FollowupsByTicket = """
        SELECT
            f.id             AS id,
            f.date           AS createdAt,
            f.content        AS content,
            f.users_id       AS userId,
            f.is_private     AS isPrivate,
            f.sourceitems_id AS sourceItemId
        FROM glpi_itilfollowups f
        WHERE f.itemtype = 'Ticket'
          AND f.items_id = @TicketId
        ORDER BY f.date ASC, f.id ASC;
        """;

    public const string FollowupsByTicketFiltered = """
        SELECT
            f.id             AS id,
            f.date           AS createdAt,
            f.content        AS content,
            f.users_id       AS userId,
            f.is_private     AS isPrivate,
            f.sourceitems_id AS sourceItemId
        FROM glpi_itilfollowups f
        WHERE f.itemtype = 'Ticket'
          AND f.items_id = @TicketId
          AND (@CanSeePrivate = 1 OR f.is_private = 0)
        ORDER BY f.date ASC, f.id ASC;
        """;

    public const string UsersByTicket = """
        SELECT
            tu.tickets_id AS TicketId,
            tu.users_id   AS UserId,
            tu.type       AS Type
        FROM glpi_tickets_users tu
        WHERE tu.tickets_id = @TicketId
        ORDER BY tu.type ASC;
        """;

    public const string UsersByTicketIds = """
        SELECT
            tu.tickets_id AS TicketId,
            tu.users_id   AS UserId,
            tu.type       AS Type
        FROM glpi_tickets_users tu
        WHERE tu.tickets_id IN @TicketIds
        ORDER BY tu.tickets_id ASC, tu.type ASC;
        """;

    public const string SolutionsByTicket = """
        SELECT
            s.id             AS Id,
            s.date_creation  AS CreatedAt,
            s.content        AS Content,
            s.users_id       AS UserId
        FROM glpi_itilsolutions s
        WHERE s.itemtype = 'Ticket'
          AND s.items_id = @TicketId
          AND s.status <> 4
        ORDER BY s.date_creation ASC, s.id ASC;
        """;

    /// <summary>Full detail: ticket + follow-ups + user links + solutions (one round-trip, four result sets).</summary>
    public static string Detail => ById + "\n" + FollowupsByTicket + "\n" + UsersByTicket + "\n" + SolutionsByTicket;

    /// <summary>Full detail with followup privacy filter.</summary>
    public static string DetailFiltered => ById + "\n" + FollowupsByTicketFiltered + "\n" + UsersByTicket + "\n" + SolutionsByTicket;

    private const string AggregateStats = """
        SELECT
            COUNT(*)                                                                                   AS TotalTickets,
            CAST(SUM(CASE WHEN t.status IN (1,2,3,4) THEN 1 ELSE 0 END) AS SIGNED)                      AS OpenTickets,
            CAST(SUM(CASE WHEN t.status = 1 THEN 1 ELSE 0 END) AS SIGNED)                              AS NewTickets,
            CAST(SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END) AS SIGNED)                              AS AssignedTickets,
            CAST(SUM(CASE WHEN t.status IN (3,4) THEN 1 ELSE 0 END) AS SIGNED)                         AS PendingTickets,
            CAST(SUM(CASE WHEN t.status = 5 THEN 1 ELSE 0 END) AS SIGNED)                              AS SolvedTickets,
            CAST(SUM(CASE WHEN t.status = 6 THEN 1 ELSE 0 END) AS SIGNED)                              AS ClosedTickets,
            CAST(SUM(CASE WHEN t.status IN (1,2,3,4)
                           AND t.time_to_resolve IS NOT NULL
                           AND t.time_to_resolve < NOW() THEN 1 ELSE 0 END) AS SIGNED)                 AS OverdueTickets,
            AVG(CASE WHEN t.solvedate IS NOT NULL THEN TIMESTAMPDIFF(HOUR, t.date, t.solvedate) END)   AS AverageResolutionHours
        FROM glpi_tickets t
        WHERE t.is_deleted = 0;
        """;

    private const string StatusBreakdown = """
        SELECT
            t.status AS Status,
            COUNT(*) AS Count
        FROM glpi_tickets t
        WHERE t.is_deleted = 0
        GROUP BY t.status
        ORDER BY t.status ASC;
        """;

    private const string TechnicianWorkload = """
        SELECT
            tu.users_id AS UserId,
            COUNT(*)    AS OpenTickets
        FROM glpi_tickets t
        INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id AND tu.type = 2
        WHERE t.is_deleted = 0
          AND t.status IN (1,2,3,4)
        GROUP BY tu.users_id
        ORDER BY OpenTickets DESC
        LIMIT 10;
        """;

    public const string CountByAssignee = """
        SELECT COUNT(*)
        FROM glpi_tickets t
        INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id
        WHERE tu.users_id = @AssigneeId
          AND tu.type = 2
          AND t.is_deleted = 0;
        """;

    public const string UpdateStatus = """
        UPDATE glpi_tickets
        SET status = @NewStatus,
            users_id_lastupdater = @UpdatedBy
        WHERE id = @TicketId;
        """;

    public const string ClaimConditionalUpdate = """
        UPDATE glpi_tickets 
        SET status = 2, date_mod = NOW(), users_id_lastupdater = @UpdatedBy
        WHERE id = @TicketId 
          AND status IN (1, 2)
          AND is_deleted = 0
          AND NOT EXISTS (
            SELECT 1 FROM glpi_tickets_users 
            WHERE tickets_id = @TicketId AND type = 2
          );
        """;

    public const string InsertAssignee = """
        INSERT INTO glpi_tickets_users 
          (tickets_id, users_id, type, use_notification, alternative_email)
        VALUES 
          (@TicketId, @UserId, 2, 1, NULL);
        """;

    /// <summary>Dashboard batch: aggregate + status breakdown + technician workload.</summary>
    public static string Dashboard => AggregateStats + "\n" + StatusBreakdown + "\n" + TechnicianWorkload;

    public static string BuildDashboardQuery(DashboardScope? scope)
    {
        string filter = string.Empty;
        string workloadQuery;

        if (scope is null || scope.IsGlobal)
        {
            filter = string.Empty;
            workloadQuery = TechnicianWorkload;
        }
        else if (scope.Role == AppRole.Supervisor)
        {
            if (scope.GroupIds is { Count: > 0 })
            {
                filter = " AND EXISTS (SELECT 1 FROM glpi_groups_tickets gt WHERE gt.tickets_id = t.id AND gt.groups_id IN @ScopeGroupIds AND gt.type = 2)";
                workloadQuery = $"""
                    SELECT
                        tu.users_id AS UserId,
                        COUNT(*)    AS OpenTickets
                    FROM glpi_tickets t
                    INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id AND tu.type = 2
                    WHERE t.is_deleted = 0
                      AND t.status IN (1,2,3,4)
                      {filter}
                    GROUP BY tu.users_id
                    ORDER BY OpenTickets DESC
                    LIMIT 10;
                    """;
            }
            else
            {
                filter = " AND 1 = 0";
                workloadQuery = "SELECT 0 AS UserId, 0 AS OpenTickets WHERE 1 = 0;";
            }
        }
        else // Technician
        {
            filter = " AND EXISTS (SELECT 1 FROM glpi_tickets_users tu_scope WHERE tu_scope.tickets_id = t.id AND tu_scope.users_id = @ScopeUserId AND tu_scope.type = 2)";
            workloadQuery = "SELECT 0 AS UserId, 0 AS OpenTickets WHERE 1 = 0;";
        }

        var aggregate = $"""
            SELECT
                COUNT(*)                                                                                   AS TotalTickets,
                CAST(SUM(CASE WHEN t.status IN (1,2,3,4) THEN 1 ELSE 0 END) AS SIGNED)                      AS OpenTickets,
                CAST(SUM(CASE WHEN t.status = 1 THEN 1 ELSE 0 END) AS SIGNED)                              AS NewTickets,
                CAST(SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END) AS SIGNED)                              AS AssignedTickets,
                CAST(SUM(CASE WHEN t.status IN (3,4) THEN 1 ELSE 0 END) AS SIGNED)                         AS PendingTickets,
                CAST(SUM(CASE WHEN t.status = 5 THEN 1 ELSE 0 END) AS SIGNED)                              AS SolvedTickets,
                CAST(SUM(CASE WHEN t.status = 6 THEN 1 ELSE 0 END) AS SIGNED)                              AS ClosedTickets,
                CAST(SUM(CASE WHEN t.status IN (1,2,3,4)
                               AND t.time_to_resolve IS NOT NULL
                               AND t.time_to_resolve < NOW() THEN 1 ELSE 0 END) AS SIGNED)                 AS OverdueTickets,
                AVG(CASE WHEN t.solvedate IS NOT NULL THEN TIMESTAMPDIFF(HOUR, t.date, t.solvedate) END)   AS AverageResolutionHours
            FROM glpi_tickets t
            WHERE t.is_deleted = 0 {filter};
            """;

        var statusBreakdown = $"""
            SELECT
                t.status AS Status,
                COUNT(*) AS Count
            FROM glpi_tickets t
            WHERE t.is_deleted = 0 {filter}
            GROUP BY t.status
            ORDER BY t.status ASC;
            """;

        return aggregate + "\n" + statusBreakdown + "\n" + workloadQuery;
    }
}
