using System.Data.Common;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Domain.Enums;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GlpiTicketManager.Api.Hubs;

[Authorize]
public sealed class TicketHub : Hub
{
    private readonly ITicketAccessPolicy _accessPolicy;
    private readonly IDbConnectionFactory _dbConnectionFactory;
    private readonly ILogger<TicketHub> _logger;

    public TicketHub(
        ITicketAccessPolicy accessPolicy,
        IDbConnectionFactory dbConnectionFactory,
        ILogger<TicketHub> logger)
    {
        _accessPolicy = accessPolicy;
        _dbConnectionFactory = dbConnectionFactory;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var user = Context.User;
        var userId = user?.GetUserId()?.ToString() ?? Context.UserIdentifier;
        _logger.LogInformation("SignalR: user {UserId} connected", userId);

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");

            if (int.TryParse(userId, out var uid))
            {
                try
                {
                    await using var connection = (DbConnection)_dbConnectionFactory.CreateConnection();
                    await connection.OpenAsync();
                    await using var cmd = connection.CreateCommand();
                    cmd.CommandText = "SELECT groups_id FROM glpi_groups_users WHERE users_id = @userId";
                    var p = cmd.CreateParameter();
                    p.ParameterName = "@userId";
                    p.Value = uid;
                    cmd.Parameters.Add(p);

                    await using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var gid = reader.GetInt32(0);
                        await Groups.AddToGroupAsync(Context.ConnectionId, $"group-{gid}");
                        _logger.LogInformation("SignalR: user {UserId} auto-subscribed to group-{GroupId}", uid, gid);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to auto-subscribe user {UserId} to assigned groups", uid);
                }
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var user = Context.User;
        var userId = user?.GetUserId()?.ToString() ?? Context.UserIdentifier;
        _logger.LogInformation("SignalR: user {UserId} disconnected", userId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeToGroup(int groupId)
    {
        var user = Context.User;
        var uid = user?.GetUserId() ?? (int.TryParse(Context.UserIdentifier, out var idVal) ? idVal : 0);
        if (uid <= 0)
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
        _logger.LogInformation("SignalR: user {UserId} explicitly subscribed to group-{GroupId}", uid, groupId);
    }

    public async Task UnsubscribeFromGroup(int groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"group-{groupId}");
    }
}
