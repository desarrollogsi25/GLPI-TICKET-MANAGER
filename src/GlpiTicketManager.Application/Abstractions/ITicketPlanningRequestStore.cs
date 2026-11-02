namespace GlpiTicketManager.Application.Abstractions;

public enum PlanningRequestState { Started, InProgress, Completed, Mismatched }

public sealed record PlanningRequestClaim(PlanningRequestState State, int? TaskId = null);

/// <summary>
/// Cross-instance deduplication for non-idempotent GLPI TicketTask creation.
/// An uncertain write remains reserved until an operator reconciles GLPI.
/// </summary>
public interface ITicketPlanningRequestStore
{
    Task<PlanningRequestClaim> ClaimAsync(
        Guid requestId, int ticketId, int userId, string payloadHash, CancellationToken cancellationToken);

    Task CompleteAsync(Guid requestId, int taskId, CancellationToken cancellationToken);

    /// <summary>Releases a reservation only if GLPI was never called.</summary>
    Task CancelAsync(Guid requestId, CancellationToken cancellationToken);
}
