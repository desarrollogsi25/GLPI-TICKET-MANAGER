namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

public static class NotificationQueries
{
    public const string Insert = """
        INSERT INTO notifications (user_id, type, ticket_id, title, message, is_read, created_at)
        VALUES (@UserId, @Type, @TicketId, @Title, @Message, @IsRead, @CreatedAt)
        RETURNING id;
        """;

    // A concurrent loser observes no row; on an insertion failure the key is
    // rolled back with the notification. Works across all API replicas sharing PG.
    public const string InsertTicketCreatedOnce = """
        WITH claim AS (
            INSERT INTO glpi_ticket_created_notification_keys (user_id, ticket_id)
            VALUES (@UserId, @TicketId)
            ON CONFLICT DO NOTHING
            RETURNING user_id
        )
        INSERT INTO notifications (user_id, type, ticket_id, title, message, is_read, created_at)
        SELECT @UserId, 'TicketCreated', @TicketId, @Title, @Message, FALSE, @CreatedAt
        FROM claim
        RETURNING id;
        """;

    public const string GetByUser = """
        SELECT
            id AS Id,
            user_id AS UserId,
            type AS Type,
            ticket_id AS TicketId,
            title AS Title,
            message AS Message,
            is_read AS IsRead,
            created_at AS CreatedAt
        FROM notifications
        WHERE user_id = @UserId
        ORDER BY created_at DESC
        LIMIT @Limit OFFSET @Offset;
        """;

    public const string GetUnreadCount = """
        SELECT COUNT(1)
        FROM notifications
        WHERE user_id = @UserId AND is_read = FALSE;
        """;

    public const string MarkAsRead = """
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = @Id AND user_id = @UserId;
        """;

    public const string MarkAllAsRead = """
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = @UserId AND is_read = FALSE;
        """;
}
