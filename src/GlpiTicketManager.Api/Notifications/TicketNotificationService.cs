using System.Data.Common;
using Dapper;
using GlpiTicketManager.Api.Endpoints;
using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;

namespace GlpiTicketManager.Api.Notifications;

public sealed class TicketNotificationService : ITicketNotificationService
{
    private readonly IHubContext<TicketHub> _hubContext;
    private readonly IDbConnectionFactory _dbConnectionFactory;
    private readonly IAppDbConnectionFactory _appDbConnectionFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<TicketNotificationService> _logger;

    public TicketNotificationService(
        IHubContext<TicketHub> hubContext,
        IDbConnectionFactory dbConnectionFactory,
        IAppDbConnectionFactory appDbConnectionFactory,
        IConfiguration config,
        ILogger<TicketNotificationService> logger)
    {
        _hubContext = hubContext;
        _dbConnectionFactory = dbConnectionFactory;
        _appDbConnectionFactory = appDbConnectionFactory;
        _config = config;
        _logger = logger;
    }

    public async Task NotifyTicketClaimedAsync(int ticketId, int assignedUserId, int groupId, CancellationToken ct = default)
    {
        var targetGroups = new HashSet<string> { $"group-{groupId}", "admins" };
        if (assignedUserId > 0)
        {
            targetGroups.Add($"user-{assignedUserId}");
        }

        await _hubContext.Clients.Groups(targetGroups.ToList())
            .SendAsync("TicketClaimed", new
            {
                ticketId,
                assignedUserId,
                groupId,
                timestamp = DateTime.UtcNow
            }, ct);

        // Web Push notification in background
        _ = Task.Run(async () =>
        {
            try
            {
                await PushEndpoints.SendNotificationToGroupAsync(
                    _dbConnectionFactory,
                    _appDbConnectionFactory,
                    _config,
                    groupId,
                    $"Ticket #{ticketId} asignado",
                    $"El ticket #{ticketId} ha sido asignado al técnico.",
                    $"/tickets/{ticketId}",
                    _logger,
                    CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send Web Push for TicketClaimed on ticket {TicketId}", ticketId);
            }
        });
    }

    public async Task NotifyTicketStatusChangedAsync(int ticketId, int newStatus, int? assigneeId, CancellationToken ct = default)
    {
        var groupId = await GetTicketGroupIdAsync(ticketId, ct);

        var targetGroups = new HashSet<string> { "admins" };
        if (groupId.HasValue && groupId.Value > 0)
        {
            targetGroups.Add($"group-{groupId.Value}");
        }
        if (assigneeId.HasValue && assigneeId.Value > 0)
        {
            targetGroups.Add($"user-{assigneeId.Value}");
        }

        await _hubContext.Clients.Groups(targetGroups.ToList())
            .SendAsync("TicketStatusChanged", new
            {
                ticketId,
                newStatus,
                assigneeId,
                timestamp = DateTime.UtcNow
            }, ct);

        if (groupId.HasValue && groupId.Value > 0)
        {
            var gid = groupId.Value;
            _ = Task.Run(async () =>
            {
                try
                {
                    await PushEndpoints.SendNotificationToGroupAsync(
                        _dbConnectionFactory,
                        _appDbConnectionFactory,
                        _config,
                        gid,
                        $"Ticket #{ticketId} actualizado",
                        $"El ticket #{ticketId} cambió de estado.",
                        $"/tickets/{ticketId}",
                        _logger,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send Web Push for TicketStatusChanged on ticket {TicketId}", ticketId);
                }
            });
        }
    }

    public async Task NotifySolutionAddedAsync(int ticketId, int authorUserId, CancellationToken ct = default)
    {
        var groupId = await GetTicketGroupIdAsync(ticketId, ct);

        var targetGroups = new HashSet<string> { "admins" };
        if (groupId.HasValue && groupId.Value > 0)
        {
            targetGroups.Add($"group-{groupId.Value}");
        }
        if (authorUserId > 0)
        {
            targetGroups.Add($"user-{authorUserId}");
        }

        await _hubContext.Clients.Groups(targetGroups.ToList())
            .SendAsync("SolutionAdded", new
            {
                ticketId,
                authorUserId,
                timestamp = DateTime.UtcNow
            }, ct);

        if (groupId.HasValue && groupId.Value > 0)
        {
            var gid = groupId.Value;
            _ = Task.Run(async () =>
            {
                try
                {
                    await PushEndpoints.SendNotificationToGroupAsync(
                        _dbConnectionFactory,
                        _appDbConnectionFactory,
                        _config,
                        gid,
                        $"Solución propuesta #{ticketId}",
                        $"Se ha propuesto una solución para el ticket #{ticketId}.",
                        $"/tickets/{ticketId}",
                        _logger,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send Web Push for SolutionAdded on ticket {TicketId}", ticketId);
                }
            });
        }
    }

    public async Task NotifyTicketCreatedAsync(int ticketId, int? groupId, CancellationToken ct = default)
    {
        if (!groupId.HasValue || groupId.Value <= 0)
        {
            groupId = await GetTicketGroupIdAsync(ticketId, ct);
        }

        var targetGroups = new HashSet<string> { "admins" };
        if (groupId.HasValue && groupId.Value > 0)
        {
            targetGroups.Add($"group-{groupId.Value}");
        }

        await _hubContext.Clients.Groups(targetGroups.ToList())
            .SendAsync("TicketCreated", new
            {
                ticketId,
                groupId,
                timestamp = DateTime.UtcNow
            }, ct);

        if (groupId.HasValue && groupId.Value > 0)
        {
            var gid = groupId.Value;
            _ = Task.Run(async () =>
            {
                try
                {
                    await PushEndpoints.SendNotificationToGroupAsync(
                        _dbConnectionFactory,
                        _appDbConnectionFactory,
                        _config,
                        gid,
                        $"Nuevo ticket #{ticketId}",
                        $"Se ha recibido un nuevo ticket en la cola de tu grupo.",
                        $"/tickets/{ticketId}",
                        _logger,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send Web Push for TicketCreated on ticket {TicketId}", ticketId);
                }
            });
        }
    }

    private async Task<int?> GetTicketGroupIdAsync(int ticketId, CancellationToken ct)
    {
        try
        {
            await using var conn = (DbConnection)_dbConnectionFactory.CreateConnection();
            await conn.OpenAsync(ct);
            const string sql = "SELECT groups_id FROM glpi_groups_tickets WHERE tickets_id = @TicketId LIMIT 1;";
            var gid = await conn.QueryFirstOrDefaultAsync<int?>(new CommandDefinition(sql, new { TicketId = ticketId }, cancellationToken: ct));
            return gid > 0 ? gid : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query group for ticket {TicketId}", ticketId);
            return null;
        }
    }
}
