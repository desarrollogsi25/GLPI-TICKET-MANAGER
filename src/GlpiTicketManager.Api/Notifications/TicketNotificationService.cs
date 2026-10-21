using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Application.Abstractions;
using Microsoft.AspNetCore.SignalR;

namespace GlpiTicketManager.Api.Notifications;

public sealed class TicketNotificationService : ITicketNotificationService
{
    private readonly IHubContext<TicketHub> _hubContext;

    public TicketNotificationService(IHubContext<TicketHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyTicketClaimedAsync(int ticketId, int assignedUserId, int groupId, CancellationToken ct = default)
    {
        await _hubContext.Clients.Group($"group-{groupId}")
            .SendAsync("TicketClaimed", new
            {
                ticketId,
                assignedUserId,
                groupId,
                timestamp = DateTime.UtcNow
            }, ct);
    }

    public async Task NotifyTicketStatusChangedAsync(int ticketId, int newStatus, int? assigneeId, CancellationToken ct = default)
    {
        await _hubContext.Clients.All
            .SendAsync("TicketStatusChanged", new
            {
                ticketId,
                newStatus,
                assigneeId,
                timestamp = DateTime.UtcNow
            }, ct);
    }

    public async Task NotifySolutionAddedAsync(int ticketId, int authorUserId, CancellationToken ct = default)
    {
        await _hubContext.Clients.All
            .SendAsync("SolutionAdded", new
            {
                ticketId,
                authorUserId,
                timestamp = DateTime.UtcNow
            }, ct);
    }

    public async Task NotifyTicketCreatedAsync(int ticketId, int? groupId, CancellationToken ct = default)
    {
        await _hubContext.Clients.All
            .SendAsync("TicketCreated", new
            {
                ticketId,
                groupId,
                timestamp = DateTime.UtcNow
            }, ct);
    }
}
