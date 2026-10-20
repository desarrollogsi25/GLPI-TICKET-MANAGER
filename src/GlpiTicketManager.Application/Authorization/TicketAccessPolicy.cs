using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Application.Authorization;

public interface ITicketAccessPolicy
{
    Task<bool> CanViewAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default);
    Task<bool> CanModifyStatusAsync(int userId, AppRole role, int ticketId, int newStatus, CancellationToken ct = default);
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
        if (role == AppRole.Admin) return true;

        if (role == AppRole.Supervisor)
        {
            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return userGroups.Intersect(ticketGroups).Any();
        }

        if (role == AppRole.Technician)
        {
            // El cierre definitivo (6) queda restringido al Admin o Supervisor
            if (newStatus == 6)
            {
                return false;
            }

            // El técnico asignado al ticket tiene permiso para cambiar el estado a "En Progreso" (2), "Pendiente" (4) y "Resuelto" (5)
            return await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct);
        }

        return false;
    }

    public Task<bool> CanModifyStatusAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default) =>
        CanModifyStatusAsync(userId, role, ticketId, 0, ct);

    public async Task<bool> CanClaimAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return true;

        var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
        var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
        return userGroups.Intersect(ticketGroups).Any();
    }

    public async Task<bool> CanAddSolutionAsync(int userId, AppRole role, int ticketId, CancellationToken ct = default)
    {
        if (role == AppRole.Admin) return true;

        if (role == AppRole.Supervisor)
        {
            var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return userGroups.Intersect(ticketGroups).Any();
        }

        // Technician: solo si asignado a él
        return await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct);
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

        if (role == AppRole.Supervisor)
        {
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
