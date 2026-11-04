namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL used to read ticket tasks straight from the GLPI schema.
/// </summary>
/// <remarks>
/// <c>begin</c> and <c>end</c> are reserved words in MariaDB, so both the column and the
/// alias are quoted. The aliases match the <c>TicketTask</c> entity property names so
/// Dapper maps them 1:1.
/// </remarks>
public static class TicketTaskQueries
{
    public const string BaseProjection = """
        SELECT
            tt.id             AS Id,
            tt.uuid           AS Uuid,
            tt.tickets_id     AS TicketId,
            tt.content        AS Content,
            tt.state          AS State,
            tt.`begin`        AS `Begin`,
            tt.`end`          AS `End`,
            tt.actiontime     AS ActionTime,
            tt.users_id_tech  AS TechnicianId,
            tt.groups_id_tech AS GroupId,
            tt.is_private     AS IsPrivate,
            tt.date_creation  AS CreatedAt,
            tt.date_mod       AS UpdatedAt
        FROM glpi_tickettasks tt
        """;

    public const string ByTicket = BaseProjection + """

        WHERE tt.tickets_id = @TicketId
        ORDER BY tt.`begin` ASC, tt.id ASC;
        """;

    public const string ById = BaseProjection + """

        WHERE tt.id = @TaskId;
        """;

    public const string ByUuid = BaseProjection + """

        WHERE tt.tickets_id = @TicketId
          AND tt.uuid = @Uuid
        LIMIT 1;
        """;

    /// <summary>
    /// Overlapping pending tasks of a technician across every open ticket. This is the
    /// conflict check; it has to span tickets, which is why it reads the schema directly
    /// instead of going through the REST API one ticket at a time.
    /// </summary>
    public const string Conflicts = BaseProjection + """

        INNER JOIN glpi_tickets t ON t.id = tt.tickets_id
        WHERE tt.users_id_tech = @TechnicianId
          AND tt.state = 1
          AND tt.`begin` IS NOT NULL
          AND tt.`end` IS NOT NULL
          AND tt.`begin` < @EndUtc
          AND tt.`end` > @BeginUtc
          AND t.is_deleted = 0
          AND (@ExcludeTaskId IS NULL OR tt.id <> @ExcludeTaskId)
        ORDER BY tt.`begin` ASC
        LIMIT 20;
        """;

    public const string NextPlanned = BaseProjection + """

        WHERE tt.tickets_id = @TicketId
          AND tt.state = 1
          AND tt.`begin` IS NOT NULL
        ORDER BY tt.`begin` ASC
        LIMIT 1;
        """;
}
