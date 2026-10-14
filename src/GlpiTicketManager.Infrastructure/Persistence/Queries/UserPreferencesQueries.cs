namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

public static class UserPreferencesQueries
{
    public const string Get = """
        SELECT
            user_id AS UserId,
            prefs::text AS Prefs,
            updated_at AS UpdatedAt
        FROM user_preferences
        WHERE user_id = @UserId;
        """;

    public const string Upsert = """
        INSERT INTO user_preferences (user_id, prefs)
        VALUES (@UserId, @Prefs::jsonb)
        ON CONFLICT (user_id) DO UPDATE
        SET prefs = EXCLUDED.prefs,
            updated_at = NOW();
        """;

    public const string Delete = """
        DELETE FROM user_preferences
        WHERE user_id = @UserId;
        """;
}
