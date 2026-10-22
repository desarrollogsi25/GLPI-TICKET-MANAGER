using System.Data.Common;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class NotificationRepository : INotificationRepository
{
    private readonly IAppDbConnectionFactory _factory;

    public NotificationRepository(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task<long> CreateAsync(Notification notification, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.ExecuteScalarAsync<long>(
            new CommandDefinition(
                NotificationQueries.Insert,
                new
                {
                    notification.UserId,
                    notification.Type,
                    notification.TicketId,
                    notification.Title,
                    notification.Message,
                    notification.IsRead,
                    notification.CreatedAt
                },
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<Notification>> GetByUserAsync(int userId, int limit = 50, int offset = 0, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var entries = await conn.QueryAsync<Notification>(
            new CommandDefinition(
                NotificationQueries.GetByUser,
                new { UserId = userId, Limit = limit, Offset = offset },
                cancellationToken: ct));
        return entries.AsList();
    }

    public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                NotificationQueries.GetUnreadCount,
                new { UserId = userId },
                cancellationToken: ct));
    }

    public async Task<bool> MarkAsReadAsync(long id, int userId, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)await _factory.CreateAsync(ct);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(
                NotificationQueries.MarkAsRead,
                new { Id = id, UserId = userId },
                cancellationToken: ct));
        return rows > 0;
    }
}
