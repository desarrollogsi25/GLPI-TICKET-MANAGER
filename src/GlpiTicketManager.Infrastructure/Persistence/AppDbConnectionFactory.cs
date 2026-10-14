using System.Data;
using Npgsql;

namespace GlpiTicketManager.Infrastructure.Persistence;

public interface IAppDbConnectionFactory
{
    Task<IDbConnection> CreateAsync(CancellationToken cancellationToken = default);
}

internal sealed class AppDbConnectionFactory : IAppDbConnectionFactory
{
    private readonly AppDbOptions _options;

    public AppDbConnectionFactory(AppDbOptions options) => _options = options;

    public async Task<IDbConnection> CreateAsync(CancellationToken cancellationToken = default)
    {
        var connection = new NpgsqlConnection(_options.ConnectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}
