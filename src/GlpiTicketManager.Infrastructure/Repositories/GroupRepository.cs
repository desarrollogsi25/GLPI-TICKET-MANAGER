using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using MySqlConnector;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class GroupRepository : IGroupRepository
{
    private readonly IDbConnectionFactory _factory;

    public GroupRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IReadOnlyList<GroupDto>> GetByEntityAsync(int entityId, CancellationToken ct = default)
    {
        using var conn = _factory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
            await mysqlConn.OpenAsync(ct);
        else
            conn.Open();

        var result = await conn.QueryAsync<GroupDto>(
            new CommandDefinition(
                GroupQueries.GetByEntity,
                new { EntityId = entityId },
                cancellationToken: ct));

        return result.ToList();
    }

    public async Task<IReadOnlyList<GroupDto>> GetByUserAsync(int userId, CancellationToken ct = default)
    {
        using var conn = _factory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
            await mysqlConn.OpenAsync(ct);
        else
            conn.Open();

        var result = await conn.QueryAsync<GroupDto>(
            new CommandDefinition(
                GroupQueries.GetByUser,
                new { UserId = userId },
                cancellationToken: ct));

        return result.ToList();
    }
}
