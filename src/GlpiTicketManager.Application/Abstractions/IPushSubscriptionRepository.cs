using GlpiTicketManager.Application.Dtos.Notifications;

namespace GlpiTicketManager.Application.Abstractions;

public interface IPushSubscriptionRepository
{
    Task UpsertSubscriptionAsync(int userId, PushSubscriptionDto dto, string? userAgent, CancellationToken ct = default);
    Task RemoveSubscriptionAsync(int userId, string endpoint, CancellationToken ct = default);
    Task<IReadOnlyList<PushSubscriptionEntity>> GetSubscriptionsByUserAsync(int userId, CancellationToken ct = default);
    Task DeleteByEndpointAsync(string endpoint, CancellationToken ct = default);
    Task UpdateLastUsedAsync(string endpoint, CancellationToken ct = default);
}
