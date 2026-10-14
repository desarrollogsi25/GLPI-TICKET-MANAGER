using System.Data.Common;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class UserPreferencesRepository : IUserPreferencesRepository
{
    private readonly IAppDbConnectionFactory _factory;

    public UserPreferencesRepository(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task<UserPreference?> GetAsync(int userId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.QueryFirstOrDefaultAsync<UserPreference>(
            new CommandDefinition(UserPreferencesQueries.Get, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task UpsertAsync(int userId, string prefs, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        await conn.ExecuteAsync(
            new CommandDefinition(
                UserPreferencesQueries.Upsert,
                new { UserId = userId, Prefs = prefs },
                cancellationToken: ct));
    }

    public async Task<bool> DeleteAsync(int userId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var affected = await conn.ExecuteAsync(
            new CommandDefinition(UserPreferencesQueries.Delete, new { UserId = userId }, cancellationToken: ct));
        return affected > 0;
    }
}
