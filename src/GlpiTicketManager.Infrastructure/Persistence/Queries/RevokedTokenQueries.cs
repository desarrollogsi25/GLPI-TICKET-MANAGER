namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

public static class RevokedTokenQueries
{
    public const string Revoke = """
        INSERT INTO revoked_tokens (jti, user_id, expires_at)
        VALUES (@Jti, @UserId, @ExpiresAt)
        ON CONFLICT (jti) DO NOTHING;
        """;

    public const string IsRevoked = """
        SELECT EXISTS(SELECT 1 FROM revoked_tokens WHERE jti = @Jti);
        """;

    public const string PurgeExpired = """
        DELETE FROM revoked_tokens
        WHERE expires_at < NOW();
        """;
}
