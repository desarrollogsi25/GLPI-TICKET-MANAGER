using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Abstractions;

public interface INotificationRepository
{
    Task<long> CreateAsync(Notification notification, CancellationToken ct = default);
    Task<long?> CreateIdempotentAsync(Notification notification, string idempotencyKey, CancellationToken ct = default);
    /// <summary>Atomic PostgreSQL insert; null when this user already received TicketCreated for the ticket.</summary>
    Task<long?> TryCreateTicketCreatedAsync(Notification notification, CancellationToken ct = default);
    Task<IReadOnlyList<Notification>> GetByUserAsync(int userId, int limit = 50, int offset = 0, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
    Task<bool> MarkAsReadAsync(long id, int userId, CancellationToken ct = default);
    Task<int> MarkAllAsReadAsync(int userId, CancellationToken ct = default);
}