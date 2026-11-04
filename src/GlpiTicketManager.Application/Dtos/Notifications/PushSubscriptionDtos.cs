namespace GlpiTicketManager.Application.Dtos.Notifications;

public sealed record PushKeysDto(string P256dh, string Auth);

public sealed record PushSubscriptionDto(
    string Endpoint,
    PushKeysDto Keys);

public sealed record PushSubscriptionEntity(
    long Id,
    int UserId,
    string Endpoint,
    string P256dh,
    string Auth,
    string? UserAgent,
    DateTime CreatedAt,
    DateTime? LastUsedAt);

public sealed record VapidPublicKeyDto(string PublicKey);
