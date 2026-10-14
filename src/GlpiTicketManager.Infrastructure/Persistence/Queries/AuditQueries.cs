namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

public static class AuditQueries
{
    public const string Log = """
        INSERT INTO audit_log (user_id, action, ticket_id, details)
        VALUES (@UserId, @Action, @TicketId, @Details::jsonb)
        RETURNING id;
        """;

    public const string GetByUser = """
        SELECT
            id AS Id,
            user_id AS UserId,
            action AS Action,
            ticket_id AS TicketId,
            details::text AS Details,
            created_at AS CreatedAt
        FROM audit_log
        WHERE user_id = @UserId
        ORDER BY created_at DESC
        LIMIT @Limit;
        """;

    public const string GetByTicket = """
        SELECT
            id AS Id,
            user_id AS UserId,
            action AS Action,
            ticket_id AS TicketId,
            details::text AS Details,
            created_at AS CreatedAt
        FROM audit_log
        WHERE ticket_id = @TicketId
        ORDER BY created_at DESC;
        """;

    public const string PurgeOlderThan = """
        DELETE FROM audit_log
        WHERE created_at < @Cutoff;
        """;
}
