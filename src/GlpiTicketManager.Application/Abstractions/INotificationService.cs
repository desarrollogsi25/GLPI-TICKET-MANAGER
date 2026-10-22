using GlpiTicketManager.Application.Dtos.Notifications;

namespace GlpiTicketManager.Application.Abstractions;

public interface INotificationService
{
    Task<NotificationDto> CreateAsync(
        int userId,
        string type,
        int? ticketId,
        string title,
        string message,
        CancellationToken ct = default);

    Task<IReadOnlyList<NotificationDto>> GetByUserAsync(
        int userId,
        int limit = 50,
        int offset = 0,
        CancellationToken ct = default);

    Task<int> GetUnreadCountAsync(
        int userId,
        CancellationToken ct = default);

    Task<bool> MarkAsReadAsync(
        long id,
        int userId,
        CancellationToken ct = default);

    Task<int> MarkAllAsReadAsync(
        int userId,
        CancellationToken ct = default);
}
