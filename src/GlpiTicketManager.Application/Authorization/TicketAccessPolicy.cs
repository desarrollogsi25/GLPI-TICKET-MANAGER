using GlpiTicketManager.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Application.Authorization;

public interface ITicketAccessPolicy
{
    Task<bool> CanViewAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanModifyStatusAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanClaimAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanAddSolutionAsync(int userId, int ticketId, CancellationToken ct = default);
    Task<bool> CanViewGroupQueueAsync(int userId, int groupId, CancellationToken ct = default);
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

    public async Task<bool> CanViewAsync(int userId, int ticketId, CancellationToken ct = default)
    {
        var ticket = await _tickets.GetByIdAsync(ticketId, ct);
        if (ticket is null) return false;

        // Regla: puede ver si
        // (a) es el asignado, o
        // (b) el ticket está en un grupo del usuario, o
        // (c) es el creador (requester)
        var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
        var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
        var isAssigned = await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct);

        if (isAssigned) return true;
        if (userGroups.Intersect(ticketGroups).Any()) return true;
        if (ticket.RequesterIds.Contains(userId)) return true;

        return false;
    }

    public async Task<bool> CanModifyStatusAsync(int userId, int ticketId, CancellationToken ct = default)
    {
        // Solo el asignado puede cambiar estado
        return await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct);
    }

    public async Task<bool> CanClaimAsync(int userId, int ticketId, CancellationToken ct = default)
    {
        // Puede reclamar si:
        // - está en un grupo del usuario
        // - no tiene asignado
        // - status == 1
        var ticket = await _tickets.GetByIdAsync(ticketId, ct);
        if (ticket is null) return false;
        if (ticket.Status != 1) return false;

        var assigned = await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct);
        if (assigned) return false;

        if (ticket.AssigneeIds.Count > 0) return false;

        var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
        var ticketGroups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
        return userGroups.Intersect(ticketGroups).Any();
    }

    public async Task<bool> CanAddSolutionAsync(int userId, int ticketId, CancellationToken ct = default)
    {
        // Solo el asignado puede añadir solución
        return await _tickets.IsUserAssignedToTicketAsync(userId, ticketId, ct);
    }

    public async Task<bool> CanViewGroupQueueAsync(int userId, int groupId, CancellationToken ct = default)
    {
        var userGroups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
        return userGroups.Contains(groupId);
    }
}
