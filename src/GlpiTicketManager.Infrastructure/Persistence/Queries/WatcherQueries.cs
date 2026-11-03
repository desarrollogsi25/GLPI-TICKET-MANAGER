namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

public static class WatcherQueries
{
    public const string GetCheckpoint = """
        SELECT last_seen_ticket_id
        FROM glpi_watcher_checkpoint
        WHERE id = 1;
        """;

    public const string UpsertCheckpoint = """
        INSERT INTO glpi_watcher_checkpoint (id, last_seen_ticket_id, updated_at)
        VALUES (1, @LastSeenTicketId, NOW())
        ON CONFLICT (id) DO UPDATE
        SET last_seen_ticket_id = EXCLUDED.last_seen_ticket_id,
            updated_at = NOW()
        WHERE EXCLUDED.last_seen_ticket_id > glpi_watcher_checkpoint.last_seen_ticket_id;
        """;

    public const string RecordPending = """
        INSERT INTO glpi_watcher_pending_tickets
            (ticket_id, category_id, ticket_name, status, attempts, last_attempt_at, next_retry_at, last_error, created_at)
        VALUES
            (@TicketId, @CategoryId, @TicketName, @Status, 1, NOW(), @NextRetryAt, @LastError, NOW())
        ON CONFLICT (ticket_id) DO UPDATE
        SET category_id = EXCLUDED.category_id,
            ticket_name = EXCLUDED.ticket_name,
            status = EXCLUDED.status,
            attempts = glpi_watcher_pending_tickets.attempts + 1,
            last_attempt_at = NOW(),
            next_retry_at = @NextRetryAt,
            last_error = EXCLUDED.last_error;
        """;

    public const string GetPending = """
        SELECT
            ticket_id AS TicketId,
            category_id AS CategoryId,
            ticket_name AS TicketName,
            status AS Status,
            attempts AS Attempts,
            next_retry_at AS NextRetryAt,
            last_error AS LastError
        FROM glpi_watcher_pending_tickets
        WHERE next_retry_at <= NOW()
          AND status IN ('AwaitingGroup', 'Retry', 'AwaitingTechnician')
        ORDER BY ticket_id ASC
        LIMIT @Limit;
        """;

    public const string RemovePending = """
        DELETE FROM glpi_watcher_pending_tickets
        WHERE ticket_id = @TicketId;
        """;

    public const string MarkPermanentlyFailed = """
        UPDATE glpi_watcher_pending_tickets
        SET status = 'PermanentlyFailed',
            last_error = @Reason,
            last_attempt_at = NOW()
        WHERE ticket_id = @TicketId;
        """;

    public const string RecoverPending = """
        UPDATE glpi_watcher_pending_tickets
        SET status = 'AwaitingGroup',
            attempts = 0,
            next_retry_at = NOW(),
            last_error = 'Explicitly recovered'
        WHERE ticket_id = @TicketId;
        """;

    public const string GetPermanentlyFailed = """
        SELECT
            ticket_id AS TicketId,
            category_id AS CategoryId,
            ticket_name AS TicketName,
            status AS Status,
            attempts AS Attempts,
            next_retry_at AS NextRetryAt,
            last_error AS LastError
        FROM glpi_watcher_pending_tickets
        WHERE status = 'PermanentlyFailed'
        ORDER BY ticket_id ASC
        LIMIT @Limit;
        """;

    public const string GetQueueCounts = """
        SELECT
            CAST(COUNT(*) FILTER (WHERE status IN ('AwaitingGroup', 'Retry', 'AwaitingTechnician')) AS INTEGER) AS PendingCount,
            CAST(COUNT(*) FILTER (WHERE status = 'PermanentlyFailed') AS INTEGER) AS PermanentlyFailedCount
        FROM glpi_watcher_pending_tickets;
        """;
}
