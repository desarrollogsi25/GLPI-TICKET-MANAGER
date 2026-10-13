using System.Data;
using Microsoft.Extensions.Options;
using MySqlConnector;

namespace GlpiTicketManager.Infrastructure.Persistence;

/// <summary>
/// MariaDB connection factory backed by MySqlConnector.
/// Dapper opens the connection per query, so this stays allocation-only.
/// </summary>
public sealed class MySqlConnectionFactory : IDbConnectionFactory
{
    private readonly DatabaseOptions _options;

    public MySqlConnectionFactory(IOptions<DatabaseOptions> options)
    {
        _options = options.Value;
    }

    public IDbConnection CreateConnection() => new MySqlConnection(_options.ConnectionString);
}
