namespace GlpiTicketManager.Application.Abstractions;

public enum PlanningRequestState { Started, InProgress, Completed, Mismatched }

public sealed record PlanningRequestClaim(PlanningRequestState State, int? TaskId = null);

/// <summary>
/// Cross-instance deduplication for non-idempotent GLPI TicketTask creation.
/// An uncertain write remains reserved until an operator reconciles GLPI.
/// </summary>
public interface ITicketPlanningRequestStore
{
    /// <summary>
    /// A PostgreSQL advisory lock serializes schedule checks and GLPI writes for the
    /// same technician across all API replicas. Releases when disposed, including on failure.
    /// </summary>
    Task<IAsyncDisposable> AcquireTechnicianScheduleLockAsync(int technicianId,
        CancellationToken cancellationToken);

    /// <summary>
    /// A PostgreSQL advisory lock serializes claim checks and GLPI writes for the
    /// same ticket across all API replicas. Releases when disposed, including on failure.
    /// </summary>
    Task<IAsyncDisposable> AcquireTicketClaimLockAsync(int ticketId,
        CancellationToken cancellationToken);
    Task<PlanningRequestClaim> ClaimAsync(
        Guid requestId, int ticketId, int userId, string payloadHash, CancellationToken cancellationToken);

    Task CompleteAsync(Guid requestId, int taskId, CancellationToken cancellationToken);

    /// <summary>Releases a reservation only if GLPI was never called.</summary>
    Task CancelAsync(Guid requestId, CancellationToken cancellationToken);
}
