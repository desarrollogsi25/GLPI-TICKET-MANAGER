using System.Data.Common;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class RevokedTokenRepository : IRevokedTokenRepository
{
    private readonly IAppDbConnectionFactory _factory;

    public RevokedTokenRepository(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task RevokeAsync(string jti, int userId, DateTime expiresAt, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        await conn.ExecuteAsync(
            new CommandDefinition(
                RevokedTokenQueries.Revoke,
                new { Jti = jti, UserId = userId, ExpiresAt = expiresAt },
                cancellationToken: ct));
    }

    public async Task<bool> IsRevokedAsync(string jti, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                RevokedTokenQueries.IsRevoked,
                new { Jti = jti },
                cancellationToken: ct));
    }

    public async Task<int> PurgeExpiredAsync(CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.ExecuteAsync(
            new CommandDefinition(
                RevokedTokenQueries.PurgeExpired,
                cancellationToken: ct));
    }
}
