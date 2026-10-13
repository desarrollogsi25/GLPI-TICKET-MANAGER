using System.Data;

namespace GlpiTicketManager.Infrastructure.Persistence;

/// <summary>
/// Creates open-able database connections. Kept tiny so repositories stay testable.
/// </summary>
public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
