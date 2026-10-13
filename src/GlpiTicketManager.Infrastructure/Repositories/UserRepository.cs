using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using Microsoft.Extensions.Options;

namespace GlpiTicketManager.Infrastructure.Repositories;

/// <summary>
/// Dapper implementation of the user read side (used for authentication).
/// </summary>
public sealed class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly DatabaseOptions _options;

    public UserRepository(IDbConnectionFactory connectionFactory, IOptions<DatabaseOptions> options)
    {
        _connectionFactory = connectionFactory;
        _options = options.Value;
    }

    public async Task<UserAccount?> GetByNameAsync(string username, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            UserQueries.ByName,
            new { Username = username },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        return await connection.QueryFirstOrDefaultAsync<UserAccount>(command);
    }
}
