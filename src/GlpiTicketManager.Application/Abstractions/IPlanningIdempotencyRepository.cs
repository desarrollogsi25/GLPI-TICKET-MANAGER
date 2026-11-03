namespace GlpiTicketManager.Application.Abstractions;

public enum PlanningReservationDisposition
{
    Acquired,
    InProgress,
    Completed,
    PayloadConflict
}

public sealed record PlanningReservation(
    PlanningReservationDisposition Disposition,
    int TicketId,
    string PayloadSha256,
    int? GlpiTaskId);

/// <summary>
/// Durable, cross-instance reservation for creating one GLPI TicketTask per operation key.
/// </summary>
public interface IPlanningIdempotencyRepository
{
    Task<PlanningReservation> AcquireAsync(
        string idempotencyKey,
        int ticketId,
        string payloadSha256,
        CancellationToken cancellationToken);

    Task CompleteAsync(
        string idempotencyKey,
        int ticketId,
        string payloadSha256,
        int glpiTaskId,
        CancellationToken cancellationToken);

    Task ReleaseAsync(
        string idempotencyKey,
        int ticketId,
        string payloadSha256,
        CancellationToken cancellationToken);
}
