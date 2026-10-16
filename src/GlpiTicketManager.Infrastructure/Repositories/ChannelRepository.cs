using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Channels;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using MySqlConnector;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class ChannelRepository : IChannelRepository
{
    private readonly IDbConnectionFactory _factory;

    public ChannelRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IReadOnlyList<ChannelDto>> GetAllActiveAsync(CancellationToken ct = default)
    {
        using var conn = _factory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
            await mysqlConn.OpenAsync(ct);
        else
            conn.Open();

        var result = await conn.QueryAsync<ChannelDto>(
            new CommandDefinition(
                RequestTypeQueries.AllActive,
                cancellationToken: ct));

        return result.ToList();
    }
}
