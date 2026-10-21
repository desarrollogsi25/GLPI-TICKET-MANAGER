using System.Data.Common;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class AuditRepository : IAuditRepository
{
    private readonly IAppDbConnectionFactory _factory;

    public AuditRepository(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task<long> LogAsync(int userId, string action, int? ticketId, string? details, CancellationToken ct = default)
    {
        string? jsonDetails = details;
        if (!string.IsNullOrWhiteSpace(jsonDetails))
        {
            var trimmed = jsonDetails.Trim();
            if (!((trimmed.StartsWith('{') && trimmed.EndsWith('}')) || (trimmed.StartsWith('[') && trimmed.EndsWith(']'))))
            {
                jsonDetails = System.Text.Json.JsonSerializer.Serialize(new { message = jsonDetails });
            }
        }

        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.ExecuteScalarAsync<long>(
            new CommandDefinition(
                AuditQueries.Log,
                new { UserId = userId, Action = action, TicketId = ticketId, Details = jsonDetails },
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<AuditEntry>> GetByUserAsync(int userId, int limit, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var entries = await conn.QueryAsync<AuditEntry>(
            new CommandDefinition(
                AuditQueries.GetByUser,
                new { UserId = userId, Limit = limit },
                cancellationToken: ct));
        return entries.AsList();
    }

    public async Task<IReadOnlyList<AuditEntry>> GetByTicketAsync(int ticketId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var entries = await conn.QueryAsync<AuditEntry>(
            new CommandDefinition(
                AuditQueries.GetByTicket,
                new { TicketId = ticketId },
                cancellationToken: ct));
        return entries.AsList();
    }

    public async Task<int> PurgeOlderThanAsync(DateTime cutoff, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.ExecuteAsync(
            new CommandDefinition(
                AuditQueries.PurgeOlderThan,
                new { Cutoff = cutoff },
                cancellationToken: ct));
    }
}
