namespace GlpiTicketManager.Application.Abstractions;

public enum GlpiWebhookReservationDisposition
{
    Acquired,
    InProgress,
    Completed,
    PayloadConflict
}

public sealed record GlpiWebhookReservation(GlpiWebhookReservationDisposition Disposition);

/// <summary>Cross-instance durable reservation for a GLPI webhook event.</summary>
public interface IGlpiWebhookIdempotencyRepository
{
    Task<GlpiWebhookReservation> AcquireAsync(string eventKey, string payloadSha256, CancellationToken cancellationToken);
    Task CompleteAsync(string eventKey, string payloadSha256, CancellationToken cancellationToken);
    Task ReleaseAsync(string eventKey, string payloadSha256, CancellationToken cancellationToken);
}
