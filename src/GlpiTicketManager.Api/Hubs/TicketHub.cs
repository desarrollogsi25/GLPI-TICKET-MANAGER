using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GlpiTicketManager.Api.Hubs;

[Authorize]
public sealed class TicketHub : Hub
{
    private readonly ITicketAccessPolicy _accessPolicy;
    private readonly ILogger<TicketHub> _logger;

    public TicketHub(ITicketAccessPolicy accessPolicy, ILogger<TicketHub> logger)
    {
        _accessPolicy = accessPolicy;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation("SignalR: user {UserId} connected", userId);

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation("SignalR: user {UserId} disconnected", userId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeToGroup(int groupId)
    {
        var user = Context.User;
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var uid))
        {
            return;
        }

        var role = user?.GetRole() ?? AppRole.Technician;
        if (!await _accessPolicy.CanViewGroupQueueAsync(uid, role, groupId))
        {
            _logger.LogWarning("User {UserId} unauthorized to subscribe to group {GroupId}", uid, groupId);
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"group-{groupId}");
    }

    public async Task UnsubscribeFromGroup(int groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"group-{groupId}");
    }
}
