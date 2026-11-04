using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Read-side access to ticket tasks (Dapper over <c>glpi_tickettasks</c>).
/// </summary>
/// <remarks>
/// GLPI is the owner of the tasks; this interface only exists so that conflict
/// detection, list enrichment and the planning panel do not need one REST round-trip
/// per ticket. Every mutation still goes through <see cref="IGlpiApiClient"/>.
/// </remarks>
public interface ITicketTaskRepository
{
    Task<IReadOnlyList<TicketTask>> GetByTicketAsync(int ticketId, CancellationToken cancellationToken);

    Task<TicketTask?> GetByIdAsync(int taskId, CancellationToken cancellationToken);

    /// <summary>
    /// Finds the task created by a previous attempt with the same idempotency key.
    /// Returns null when this key was never used on the ticket.
    /// </summary>
    Task<TicketTask?> GetByUuidAsync(int ticketId, string uuid, CancellationToken cancellationToken);

    /// <summary>
    /// Tasks of <paramref name="technicianId"/> that overlap the given range and are
    /// still pending. Used to reject double bookings before writing to GLPI.
    /// </summary>
    Task<IReadOnlyList<TicketTask>> GetConflictsAsync(
        int technicianId,
        DateTime beginUtc,
        DateTime endUtc,
        int? excludeTaskId,
        CancellationToken cancellationToken);

    /// <summary>Next pending scheduled task of the ticket, ordered by start.</summary>
    Task<TicketTask?> GetNextPlannedAsync(int ticketId, CancellationToken cancellationToken);
}
