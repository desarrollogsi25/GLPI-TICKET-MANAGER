using System.Data.Common;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class GlpiWatcherStateRepository : IGlpiWatcherStateRepository
{
    private readonly IAppDbConnectionFactory _factory;

    public GlpiWatcherStateRepository(IAppDbConnectionFactory factory)
    {
        _factory = factory;
    }

    public async Task<int?> GetLastSeenTicketIdAsync(CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.ExecuteScalarAsync<int?>(new CommandDefinition(
            WatcherQueries.GetCheckpoint, cancellationToken: ct));
    }

    public async Task SetLastSeenTicketIdAsync(int lastSeenTicketId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition(
            WatcherQueries.UpsertCheckpoint,
            new { LastSeenTicketId = lastSeenTicketId },
            cancellationToken: ct));
    }

    public async Task RecordPendingTicketAsync(
        int ticketId,
        int categoryId,
        string ticketName,
        string status,
        string? error = null,
        CancellationToken ct = default)
    {
        // Exponential backoff based on status:
        // AwaitingGroup: 3 seconds
        // Retry: 5 seconds
        var delay = status == "Retry" ? TimeSpan.FromSeconds(5) : TimeSpan.FromSeconds(3);
        var nextRetry = DateTime.UtcNow.Add(delay);

        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition(
            WatcherQueries.RecordPending,
            new
            {
                TicketId = ticketId,
                CategoryId = categoryId,
                TicketName = ticketName.Length > 255 ? ticketName[..255] : ticketName,
                Status = status,
                NextRetryAt = nextRetry,
                LastError = error
            },
            cancellationToken: ct));
    }

    public async Task<IReadOnlyList<GlpiWatcherPendingTicket>> GetPendingTicketsAsync(int limit = 20, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var entries = await conn.QueryAsync<GlpiWatcherPendingTicket>(
            new CommandDefinition(
                WatcherQueries.GetPending,
                new { Limit = limit },
                cancellationToken: ct));
        return entries.AsList();
    }

    public async Task<IReadOnlyList<GlpiWatcherPendingTicket>> GetPermanentlyFailedTicketsAsync(int limit = 20, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var entries = await conn.QueryAsync<GlpiWatcherPendingTicket>(
            new CommandDefinition(
                WatcherQueries.GetPermanentlyFailed,
                new { Limit = limit },
                cancellationToken: ct));
        return entries.AsList();
    }

    public async Task MarkPermanentlyFailedAsync(int ticketId, string reason, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition(
            WatcherQueries.MarkPermanentlyFailed,
            new { TicketId = ticketId, Reason = reason },
            cancellationToken: ct));
    }

    public async Task<bool> RecoverPendingTicketAsync(int ticketId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var affected = await conn.ExecuteAsync(new CommandDefinition(
            WatcherQueries.RecoverPending,
            new { TicketId = ticketId },
            cancellationToken: ct));
        return affected > 0;
    }

    public async Task RemovePendingTicketAsync(int ticketId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition(
            WatcherQueries.RemovePending,
            new { TicketId = ticketId },
            cancellationToken: ct));
    }
}
