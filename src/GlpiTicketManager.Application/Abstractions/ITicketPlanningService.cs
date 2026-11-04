using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Use cases for the native GLPI planning of a ticket.
/// </summary>
/// <remarks>
/// <para>
/// "En proceso (planificado)" (status 3) is not a status this service writes. It is a
/// consequence of GLPI owning the ticket lifecycle: when a task with a start date exists,
/// GLPI moves the ticket to 3 by itself, and when the last planned task is completed it
/// moves the ticket back to 2 (or 1). Every method here therefore returns the status
/// GLPI reports <b>after</b> the task mutation, read back through the REST API.
/// </para>
/// </remarks>
public interface ITicketPlanningService
{
    Task<TicketPlanningDto> GetPlanningAsync(
        int ticketId,
        int userId,
        AppRole role,
        CancellationToken cancellationToken);

    /// <summary>
    /// Creates the scheduled task. Idempotent when <see cref="PlanTicketRequest.IdempotencyKey"/>
    /// is supplied: a retried request returns the task created by the first attempt
    /// instead of creating a second one.
    /// </summary>
    Task<TicketPlanningDto> PlanAsync(
        int ticketId,
        PlanTicketRequest request,
        int userId,
        AppRole role,
        CancellationToken cancellationToken);

    Task<TicketPlanningDto> RescheduleAsync(
        int ticketId,
        int taskId,
        RescheduleTicketRequest request,
        int userId,
        AppRole role,
        CancellationToken cancellationToken);

    /// <summary>Marks the task as done; GLPI then recomputes the ticket status.</summary>
    Task<TicketPlanningDto> CompleteAsync(
        int ticketId,
        int taskId,
        int userId,
        AppRole role,
        CancellationToken cancellationToken);

    /// <summary>
    /// Deletes the task and reconciles the ticket status, because GLPI does not
    /// recompute it on delete.
    /// </summary>
    Task<TicketPlanningDto> CancelAsync(
        int ticketId,
        int taskId,
        int userId,
        AppRole role,
        CancellationToken cancellationToken);

    Task<TicketAvailabilityDto> GetAvailabilityAsync(
        int ticketId,
        int technicianId,
        DateTimeOffset begin,
        DateTimeOffset end,
        int userId,
        AppRole role,
        CancellationToken cancellationToken);
}
