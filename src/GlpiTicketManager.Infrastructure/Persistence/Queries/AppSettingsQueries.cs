namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

public static class AppSettingsQueries
{
    public const string Get = """
        SELECT
            key AS Key,
            value AS Value,
            updated_at AS UpdatedAt,
            updated_by AS UpdatedBy
        FROM app_settings
        WHERE key = @Key;
        """;

    public const string GetAll = """
        SELECT
            key AS Key,
            value AS Value
        FROM app_settings;
        """;

    public const string Upsert = """
        INSERT INTO app_settings (key, value, updated_by)
        VALUES (@Key, @Value, @UpdatedBy)
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW();
        """;

    public const string Delete = """
        DELETE FROM app_settings
        WHERE key = @Key;
        """;
}
