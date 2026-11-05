using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Application.Abstractions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Api.Notifications;

public sealed class TicketNotificationService : ITicketNotificationService
{
    private readonly IHubContext<TicketHub> _hubContext;
    private readonly ITicketRepository _tickets;
    private readonly ILogger<TicketNotificationService> _logger;

    public TicketNotificationService(
        IHubContext<TicketHub> hubContext,
        ITicketRepository tickets,
        ILogger<TicketNotificationService> logger)
    {
        _hubContext = hubContext;
        _tickets = tickets;
        _logger = logger;
    }

    private async Task<int?> GetGroupIdForTicketAsync(int ticketId, CancellationToken ct)
    {
        try
        {
            var groups = await _tickets.GetGroupIdsForTicketAsync(ticketId, ct);
            return groups.Where(id => id > 0).OrderBy(id => id).Select(id => (int?)id).FirstOrDefault();
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve groupId for ticket {TicketId}", ticketId);
            return null;
        }
    }

    public async Task NotifyTicketClaimedAsync(int ticketId, int assignedUserId, int groupId, CancellationToken ct = default)
    {
        if (ticketId <= 0 || assignedUserId <= 0 || groupId <= 0) return;
        var payload = new { ticketId, assignedUserId, groupId, timestamp = DateTime.UtcNow };
        // SignalR deduplicates connections belonging to more than one target group.
        await _hubContext.Clients.Groups(new[] { $"group-{groupId}", $"supervisors-{groupId}", $"user-{assignedUserId}" })
            .SendAsync("TicketClaimed", payload, ct);
    }

    public async Task NotifyTicketStatusChangedAsync(int ticketId, int newStatus, int? assigneeId, CancellationToken ct = default)
    {
        var groupId = await GetGroupIdForTicketAsync(ticketId, ct);
        var payload = new { ticketId, newStatus, assigneeId, groupId, timestamp = DateTime.UtcNow };
        var targets = new List<string>();
        if (assigneeId is > 0) targets.Add($"user-{assigneeId.Value}");
        if (groupId is > 0) targets.Add($"supervisors-{groupId.Value}");
        if (targets.Count == 0)
        {
            _logger.LogWarning("Skipped unscoped status event for ticket {TicketId}", ticketId);
            return;
        }
        // Every status, including Pending/Solved/Closed, refreshes the assignee's
        // other sessions. A failed group lookup never widens the audience.
        var clients = _hubContext.Clients.Groups(targets);
        await clients.SendAsync("TicketStatusChanged", payload, ct);
        await clients.SendAsync("NotificationReceived", ct);
    }

    public async Task NotifySolutionAddedAsync(int ticketId, int authorUserId, CancellationToken ct = default)
    {
        var groupId = await GetGroupIdForTicketAsync(ticketId, ct);
        var payload = new
        {
            ticketId,
            authorUserId,
            groupId,
            timestamp = DateTime.UtcNow
        };

        var targets = new List<string>();
        if (authorUserId > 0) targets.Add($"user-{authorUserId}");
        if (groupId is > 0) targets.Add($"supervisors-{groupId.Value}");
        if (targets.Count > 0)
            await _hubContext.Clients.Groups(targets).SendAsync("SolutionAdded", payload, ct);
    }

    public async Task NotifyTicketCreatedAsync(int ticketId, int? groupId, CancellationToken ct = default)
    {
        groupId ??= await GetGroupIdForTicketAsync(ticketId, ct);
        var payload = new
        {
            ticketId,
            groupId,
            timestamp = DateTime.UtcNow
        };

        if (groupId is not > 0)
        {
            _logger.LogWarning("Skipped unscoped creation event for ticket {TicketId}", ticketId);
            return;
        }
        var clients = _hubContext.Clients.Groups(new[] { $"group-{groupId.Value}", $"supervisors-{groupId.Value}" });
        await clients.SendAsync("TicketCreated", payload, ct);
        await clients.SendAsync("NotificationReceived", ct);
    }
}
