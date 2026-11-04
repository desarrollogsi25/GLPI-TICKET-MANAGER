using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure.Persistence;

namespace GlpiTicketManager.Infrastructure.Repositories;

/// <summary>PostgreSQL-backed webhook event ledger shared across API instances.</summary>
public sealed class GlpiWebhookIdempotencyRepository : IGlpiWebhookIdempotencyRepository
{
    private const string Insert = """
        INSERT INTO glpi_webhook_events (event_key, payload_sha256, state, lease_expires_at)
        VALUES (@Key, @Hash, 'pending', NOW() + INTERVAL '5 minutes')
        ON CONFLICT (event_key) DO NOTHING
        RETURNING 1;
        """;

    private const string Reacquire = """
        UPDATE glpi_webhook_events
        SET lease_expires_at = NOW() + INTERVAL '5 minutes', updated_at = NOW()
        WHERE event_key = @Key AND payload_sha256 = @Hash
          AND state = 'pending' AND lease_expires_at <= NOW()
        RETURNING 1;
        """;

    private readonly IAppDbConnectionFactory _factory;

    public GlpiWebhookIdempotencyRepository(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task<GlpiWebhookReservation> AcquireAsync(string eventKey, string payloadSha256, CancellationToken cancellationToken)
    {
        using var connection = await _factory.CreateAsync(cancellationToken);
        var inserted = await connection.QuerySingleOrDefaultAsync<int?>(new CommandDefinition(
            Insert, new { Key = eventKey, Hash = payloadSha256 }, cancellationToken: cancellationToken));
        if (inserted.HasValue)
        {
            return new GlpiWebhookReservation(GlpiWebhookReservationDisposition.Acquired);
        }

        var reclaimed = await connection.QuerySingleOrDefaultAsync<int?>(new CommandDefinition(
            Reacquire, new { Key = eventKey, Hash = payloadSha256 }, cancellationToken: cancellationToken));
        if (reclaimed.HasValue)
        {
            return new GlpiWebhookReservation(GlpiWebhookReservationDisposition.Acquired);
        }

        var existing = await connection.QuerySingleOrDefaultAsync<EventRow>(new CommandDefinition(
            "SELECT payload_sha256 AS PayloadSha256, state AS State FROM glpi_webhook_events WHERE event_key = @Key;",
            new { Key = eventKey }, cancellationToken: cancellationToken));
        if (existing is null || !string.Equals(existing.PayloadSha256, payloadSha256, StringComparison.OrdinalIgnoreCase))
        {
            return new GlpiWebhookReservation(GlpiWebhookReservationDisposition.PayloadConflict);
        }

        return new GlpiWebhookReservation(existing.State == "completed"
            ? GlpiWebhookReservationDisposition.Completed
            : GlpiWebhookReservationDisposition.InProgress);
    }

    public async Task CompleteAsync(string eventKey, string payloadSha256, CancellationToken cancellationToken)
    {
        using var connection = await _factory.CreateAsync(cancellationToken);
        var count = await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE glpi_webhook_events SET state = 'completed', lease_expires_at = NULL, updated_at = NOW() WHERE event_key = @Key AND payload_sha256 = @Hash AND state = 'pending';",
            new { Key = eventKey, Hash = payloadSha256 }, cancellationToken: cancellationToken));
        if (count == 0)
        {
            var completed = await connection.ExecuteScalarAsync<bool?>(new CommandDefinition(
                "SELECT TRUE FROM glpi_webhook_events WHERE event_key = @Key AND payload_sha256 = @Hash AND state = 'completed';",
                new { Key = eventKey, Hash = payloadSha256 }, cancellationToken: cancellationToken));
            if (completed != true)
            {
                throw new InvalidOperationException("GLPI webhook reservation could not be completed consistently.");
            }
        }
    }

    public async Task ReleaseAsync(string eventKey, string payloadSha256, CancellationToken cancellationToken)
    {
        using var connection = await _factory.CreateAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM glpi_webhook_events WHERE event_key = @Key AND payload_sha256 = @Hash AND state = 'pending';",
            new { Key = eventKey, Hash = payloadSha256 }, cancellationToken: cancellationToken));
    }

    private sealed record EventRow(string PayloadSha256, string State);
}
