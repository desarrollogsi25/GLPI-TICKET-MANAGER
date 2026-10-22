using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Abstractions;

public interface INotificationRepository
{
    Task<long> CreateAsync(Notification notification, CancellationToken ct = default);
    Task<IReadOnlyList<Notification>> GetByUserAsync(int userId, int limit = 50, int offset = 0, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
    Task<bool> MarkAsReadAsync(long id, int userId, CancellationToken ct = default);
    Task<int> MarkAllAsReadAsync(int userId, CancellationToken ct = default);
}
