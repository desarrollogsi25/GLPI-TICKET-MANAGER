using System.Data.Common;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class AppSettingsRepository : IAppSettingsRepository
{
    private readonly IAppDbConnectionFactory _factory;

    public AppSettingsRepository(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task<AppSetting?> GetAsync(string key, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.QueryFirstOrDefaultAsync<AppSetting>(
            new CommandDefinition(AppSettingsQueries.Get, new { Key = key }, cancellationToken: ct));
    }

    public async Task<IReadOnlyDictionary<string, string>> GetAllAsync(CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var rows = await conn.QueryAsync<(string Key, string Value)>(
            new CommandDefinition(AppSettingsQueries.GetAll, cancellationToken: ct));
        return rows.ToDictionary(r => r.Key, r => r.Value);
    }

    public async Task UpsertAsync(string key, string value, int updatedBy, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        await conn.ExecuteAsync(
            new CommandDefinition(
                AppSettingsQueries.Upsert,
                new { Key = key, Value = value, UpdatedBy = updatedBy },
                cancellationToken: ct));
    }

    public async Task<bool> DeleteAsync(string key, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var affected = await conn.ExecuteAsync(
            new CommandDefinition(AppSettingsQueries.Delete, new { Key = key }, cancellationToken: ct));
        return affected > 0;
    }
}
