namespace GlpiTicketManager.Application.Abstractions;

public interface IRevokedTokenRepository
{
    Task RevokeAsync(string jti, int userId, DateTime expiresAt, CancellationToken ct = default);
    Task<bool> IsRevokedAsync(string jti, CancellationToken ct = default);
    Task<int> PurgeExpiredAsync(CancellationToken ct = default);
}
