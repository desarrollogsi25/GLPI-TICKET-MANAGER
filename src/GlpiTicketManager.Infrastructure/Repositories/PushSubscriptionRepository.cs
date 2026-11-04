using System.Data.Common;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Notifications;
using GlpiTicketManager.Infrastructure.Persistence;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class PushSubscriptionRepository : IPushSubscriptionRepository
{
    private readonly IAppDbConnectionFactory _factory;

    public PushSubscriptionRepository(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task UpsertSubscriptionAsync(int userId, PushSubscriptionDto dto, string? userAgent, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        const string sql = """
            INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, created_at, last_used_at)
            VALUES (@UserId, @Endpoint, @P256dh, @Auth, @UserAgent, NOW(), NOW())
            ON CONFLICT (endpoint) DO UPDATE
            SET user_id = EXCLUDED.user_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                user_agent = EXCLUDED.user_agent,
                last_used_at = NOW();
            """;

        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            UserId = userId,
            Endpoint = dto.Endpoint,
            P256dh = dto.Keys.P256dh,
            Auth = dto.Keys.Auth,
            UserAgent = userAgent
        }, cancellationToken: ct));
    }

    public async Task RemoveSubscriptionAsync(int userId, string endpoint, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        const string sql = "DELETE FROM user_push_subscriptions WHERE user_id = @UserId AND endpoint = @Endpoint;";
        await conn.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId, Endpoint = endpoint }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<PushSubscriptionEntity>> GetSubscriptionsByUserAsync(int userId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        const string sql = """
            SELECT id, user_id AS UserId, endpoint, p256dh, auth, user_agent AS UserAgent, created_at AS CreatedAt, last_used_at AS LastUsedAt
            FROM user_push_subscriptions
            WHERE user_id = @UserId
            ORDER BY id DESC;
            """;

        var list = await conn.QueryAsync<PushSubscriptionEntity>(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
        return list.AsList();
    }

    public async Task DeleteByEndpointAsync(string endpoint, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        const string sql = "DELETE FROM user_push_subscriptions WHERE endpoint = @Endpoint;";
        await conn.ExecuteAsync(new CommandDefinition(sql, new { Endpoint = endpoint }, cancellationToken: ct));
    }

    public async Task UpdateLastUsedAsync(string endpoint, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        const string sql = "UPDATE user_push_subscriptions SET last_used_at = NOW() WHERE endpoint = @Endpoint;";
        await conn.ExecuteAsync(new CommandDefinition(sql, new { Endpoint = endpoint }, cancellationToken: ct));
    }
}
