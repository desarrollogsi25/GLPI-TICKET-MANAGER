using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Application.Authorization;

/// <summary>
/// Outcome of evaluating a status transition. <see cref="Allowed"/> is false when the
/// caller cannot perform the change; <see cref="Reason"/> then carries an operator-facing
/// message (in Spanish) that the API surfaces to the UI.
/// </summary>
public readonly record struct StatusTransitionDecision(bool Allowed, string? Reason)
{
    public static StatusTransitionDecision Allow() => new(true, null);

    public static StatusTransitionDecision Deny(string reason) => new(false, reason);
}

public interface ITicketAccessPolicy
{
    Task<bool> CanViewAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default);
    Task<bool> CanModifyStatusAsync(int userId, AppRole role, int ticketId, int newStatus, CancellationToken ct = default);

    /// <summary>
    /// Evaluates a status transition for the given role and returns a decision with a
    /// clear reason when the transition is rejected (business rules: technicians cannot
    /// reopen resolved/closed tickets nor move work backwards to New).
    /// </summary>
    Task<StatusTransitionDecision> EvaluateStatusTransitionAsync(int userId, AppRole role, int ticketId, int newStatus, CancellationToken ct = default);
    Task<bool> CanModifyStatusAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default);
    Task<bool> CanClaimAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default);
    Task<bool> CanAddSolutionAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default);
    Task<bool> CanViewGroupQueueAsync(int userId, AppRole role, int groupId, CancellationToken ct = default);
    Task<bool> CanSeePrivateFollowupsAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default);
    Task<bool> CanReopenAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default);

    Task<bool> CanViewAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanModifyStatusAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanClaimAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanAddSolutionAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanViewGroupQueueAsync(int userId, int groupId, CancellationToken ct = default);
    Task<bool> CanSeePrivateFollowupsAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanReopenAsync(int userId, int ticketId, CancellationToken ct = default);
}

public sealed class TicketAccessPolicy : ITicketAccessPolicy
{
    private readonly ITicketRepository _tickets;
    private readonly ILogger<TicketAccessPolicy> _logger;

    public TicketAccessPolicy(ITicketRepository tickets, ILogger<TicketAccessPolicy> logger)
    {
        _tickets = tickets;
        _logger = logger;
    }

    public async Task<bool> CanViewAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return true;

        if (role == AppRole.Supervisor)
        {
            if (await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
                return true;

            // Supervisor ve todo lo de sus grupos
            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return userGroups.Intersect(ticketGroups).Any();
        }

        if (role == AppRole.Solicitante)
        {
            return await _tickets.IsUserRequesterOfTicketAsync(userId, ticketId, ct);
        }

        // Technician: estricto
        // (a) asignado a él, O
        // (b) sin asignar Y en su grupo (para poder reclamarlo)
        if (await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
            return true;

        var ticket = await _tickets.GetByIdAsync(ticketId, ct);
        if (ticket is null || ticket.Status != 1) return false;
        if (await _tickets.HasAssigneeAsync(ticketId, ct)) return false;

        var userGroups2 = await _tickets.GetGroupIdsForUserAsync(userId, ct);
        var ticketGroups2 = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
        return userGroups2.Intersect(ticketGroups2).Any();
    }

    public async Task<bool> CanModifyStatusAsync(int userId, AppRole role, int ticketId, int newStatus, CancellationToken ct = default)
    {
        var decision = await EvaluateStatusTransitionAsync(userId, role, ticketId, newStatus, ct);
        return decision.Allowed;
    }

    /// <summary>
    /// Business rules for status transitions enforced on the server:
    /// <list type="bullet">
    /// <item>Technicians cannot leave Resolved (5) or Closed (6): only an admin reopens.</item>
    /// <item>Technicians cannot move work backwards: In-Progress (2/3) cannot go to New (1).</item>
    /// <item>Waiting (4) can only be resumed to In-Progress (3): resolving or closing it
    /// directly is rejected (H-39).</item>
    /// </list>
    /// Admins and supervisors bypass the transition graph (supervisors already scoped to
    /// their groups by the underlying assignment checks).
    /// </summary>
    public async Task<StatusTransitionDecision> EvaluateStatusTransitionAsync(
        int userId,
        AppRole role,
        int ticketId,
        int newStatus,
        CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return StatusTransitionDecision.Allow();

        if (role == AppRole.Supervisor)
        {
            if (await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
                return StatusTransitionDecision.Allow();

            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return userGroups.Intersect(ticketGroups).Any()
                ? StatusTransitionDecision.Allow()
                : StatusTransitionDecision.Deny("No tienes acceso a este ticket.");
        }

        if (role != AppRole.Technician)
        {
            return StatusTransitionDecision.Deny("No tienes permisos para cambiar el estado de este ticket.");
        }

        var ticket = await _tickets.GetByIdAsync(ticketId, ct);
        if (ticket is null)
        {
            return StatusTransitionDecision.Deny($"El ticket {ticketId} no existe.");
        }

        var currentStatus = ticket.Status;

        // A transition to the same status is an idempotent no-op and is always allowed
        // for the assignee. This matters in practice because GLPI marks a ticket as
        // Solved (5) as a side effect of adding a solution, so the resolve endpoint then
        // receives a 2->5 that is really a 5->5 confirmation.
        if (newStatus == currentStatus)
        {
            if (role == AppRole.Technician
                && !await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
            {
                return StatusTransitionDecision.Deny("Solo el técnico asignado puede cambiar el estado de este ticket.");
            }

            return StatusTransitionDecision.Allow();
        }

        // 1. Closed (6) is terminal for technicians: only an admin can reopen.
        if (currentStatus == (int)TicketStatus.Closed)
        {
            return StatusTransitionDecision.Deny(
                "Solo un administrador puede reabrir un ticket cerrado.");
        }

        // 2. Technicians cannot rewind progress to a state prior to Assigned (i.e. New = 1).
        if (newStatus < (int)TicketStatus.Assigned)
        {
            return StatusTransitionDecision.Deny(
                "No puedes devolver un ticket a un estado anterior a Asignado (Nuevo).");
        }

        // 3. Waiting (4) is an interrupted state: it can only be resumed to In-Progress
        // (3). Resolving (5) or closing (6) it directly is forbidden (H-39).
        if (currentStatus == (int)TicketStatus.Waiting
            && (newStatus == (int)TicketStatus.Solved || newStatus == (int)TicketStatus.Closed))
        {
            return StatusTransitionDecision.Deny(
                "No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.");
        }

        // 4. Explicit close (6) stays admin-only; resolving (5) is allowed for the assignee.
        if (newStatus == (int)TicketStatus.Closed)
        {
            return StatusTransitionDecision.Deny(
                "Solo un administrador puede cerrar un ticket manualmente.");
        }

        // A technician may only act on tickets assigned to them.
        if (!await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
        {
            return StatusTransitionDecision.Deny("Solo el técnico asignado puede cambiar el estado de este ticket.");
        }

        // Technicians can move tickets between states 2 (Assigned/In Progress), 3 (Planned/In Progress), 4 (Waiting/Pending), and 5 (Solved).
        return StatusTransitionDecision.Allow();
    }

    public Task<bool> CanModifyStatusAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default) =>
        CanModifyStatusAsync(userId, role, ticketId, 0, ct);

    public async Task<bool> CanClaimAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return true;

        if (role == AppRole.Supervisor || role == AppRole.Technician)
        {
            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return userGroups.Intersect(ticketGroups).Any();
        }

        return false;
    }

    public async Task<bool> CanAddSolutionAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return true;

        if (role == AppRole.Supervisor)
        {
            if (await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
                return true;

            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return userGroups.Intersect(ticketGroups).Any();
        }

        // Technician: asignado a él O perteneciente a su grupo
        if (await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
        {
            return true;
        }

        var userGroups2 = await _tickets.GetGroupIdsForUserAsync(userId, ct);
        var ticketGroups2 = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
        return userGroups2.Intersect(ticketGroups2).Any();
    }

    public async Task<bool> CanViewGroupQueueAsync(int userId, AppRole role, int groupId, CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return true;

        var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
        return userGroups.Contains(groupId);
    }

    public async Task<bool> CanSeePrivateFollowupsAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return true;

        if (role == AppRole.Supervisor)
        {
            if (await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
                return true;

            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return userGroups.Intersect(ticketGroups).Any();
        }

        if (role == AppRole.Technician)
        {
            return await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct);
        }

        return false;
    }

    public async Task<bool> CanReopenAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return true;

        var ticket = await _tickets.GetByIdAsync(ticketId, ct);

        // Closed tickets (status 6) are terminal for non-admins: only an admin reopens them.
        if (ticket is not null && ticket.Status == (int)TicketStatus.Closed)
        {
            return false;
        }

        if (role == AppRole.Supervisor)
        {
            if (await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct))
                return true;

            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return userGroups.Intersect(ticketGroups).Any();
        }

        if (role == AppRole.Technician)
        {
            return await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct);
        }

        return false;
    }

    // Default overloads for backward compatibility
    public Task<bool> CanViewAsync(int userId, int ticketId, CancellationToken ct = default) =>
        CanViewAsync(userId, AppRole.Technician, ticketId, ct);

    public Task<bool> CanModifyStatusAsync(int userId, int ticketId, CancellationToken ct = default) =>
        CanModifyStatusAsync(userId, AppRole.Technician, ticketId, ct);

    public Task<bool> CanClaimAsync(int userId, int ticketId, CancellationToken ct = default) =>
        CanClaimAsync(userId, AppRole.Technician, ticketId, ct);

    public Task<bool> CanAddSolutionAsync(int userId, int ticketId, CancellationToken ct = default) =>
        CanAddSolutionAsync(userId, AppRole.Technician, ticketId, ct);

    public Task<bool> CanViewGroupQueueAsync(int userId, int groupId, CancellationToken ct = default) =>
        CanViewGroupQueueAsync(userId, AppRole.Technician, groupId, ct);

    public Task<bool> CanSeePrivateFollowupsAsync(int userId, int ticketId, CancellationToken ct = default) =>
        CanSeePrivateFollowupsAsync(userId, AppRole.Technician, ticketId, ct);

    public Task<bool> CanReopenAsync(int userId, int ticketId, CancellationToken ct = default) =>
        CanReopenAsync(userId, AppRole.Technician, ticketId, ct);
}
