using System.Data.Common;
using Dapper;
using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Api.Notifications;

public sealed class TicketNotificationService : ITicketNotificationService
{
    private readonly IHubContext<TicketHub> _hubContext;
    private readonly IDbConnectionFactory _dbFactory;
    private readonly ILogger<TicketNotificationService> _logger;

    public TicketNotificationService(
        IHubContext<TicketHub> hubContext,
        IDbConnectionFactory dbFactory,
        ILogger<TicketNotificationService> logger)
    {
        _hubContext = hubContext;
        _dbFactory = dbFactory;
        _logger = logger;
    }

    private async Task<int?> GetGroupIdForTicketAsync(int ticketId, CancellationToken ct)
    {
        try
        {
            await using var conn = (DbConnection)_dbFactory.CreateConnection();
            await conn.OpenAsync(ct);
            var gid = await conn.QueryFirstOrDefaultAsync<int?>(
                new CommandDefinition(
                    "SELECT groups_id FROM glpi_groups_tickets WHERE tickets_id = @TicketId AND type = 2 LIMIT 1;",
                    new { TicketId = ticketId },
                    cancellationToken: ct));
            return gid;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve groupId for ticket {TicketId}", ticketId);
            return null;
        }
    }

    public async Task NotifyTicketClaimedAsync(int ticketId, int assignedUserId, int groupId, CancellationToken ct = default)
    {
        var payload = new
        {
            ticketId,
            assignedUserId,
            groupId,
            timestamp = DateTime.UtcNow
        };

        await _hubContext.Clients.Group($"group-{groupId}")
            .SendAsync("TicketClaimed", payload, ct);
        await _hubContext.Clients.Group($"supervisors-{groupId}")
            .SendAsync("TicketClaimed", payload, ct);
    }

    public async Task NotifyTicketStatusChangedAsync(int ticketId, int newStatus, int? assigneeId, CancellationToken ct = default)
    {
        var groupId = await GetGroupIdForTicketAsync(ticketId, ct);
        var payload = new
        {
            ticketId,
            newStatus,
            assigneeId,
            groupId,
            timestamp = DateTime.UtcNow
        };

        if (newStatus == 4) // Pausado (Waiting)
        {
            // Ticket Pausado (Pending): Notificar ÚNICAMENTE a los supervisores (supervisors-{groupId})
            if (groupId.HasValue && groupId.Value > 0)
            {
                await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                    .SendAsync("TicketStatusChanged", payload, ct);
                await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                    .SendAsync("NotificationReceived", ct);
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("TicketStatusChanged", payload, ct);
            }
        }
        else if (newStatus == 5 || newStatus == 6) // Resuelto / Cerrado
        {
            // Ticket Resuelto: Notificar ÚNICAMENTE a los supervisores (supervisors-{groupId})
            if (groupId.HasValue && groupId.Value > 0)
            {
                await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                    .SendAsync("TicketStatusChanged", payload, ct);
                await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                    .SendAsync("NotificationReceived", ct);
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("TicketStatusChanged", payload, ct);
            }
        }
        else if (newStatus == 2) // Reabierto / Asignado
        {
            // Ticket Reabierto: Notificar al técnico asignado y al supervisor
            if (assigneeId.HasValue && assigneeId.Value > 0)
            {
                await _hubContext.Clients.Group($"user-{assigneeId.Value}")
                    .SendAsync("TicketStatusChanged", payload, ct);
                await _hubContext.Clients.Group($"user-{assigneeId.Value}")
                    .SendAsync("NotificationReceived", ct);
            }

            if (groupId.HasValue && groupId.Value > 0)
            {
                await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                    .SendAsync("TicketStatusChanged", payload, ct);
                await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                    .SendAsync("NotificationReceived", ct);
            }
        }
        else
        {
            // Otros estados (ej. 3 En progreso)
            if (assigneeId.HasValue && assigneeId.Value > 0)
            {
                await _hubContext.Clients.Group($"user-{assigneeId.Value}")
                    .SendAsync("TicketStatusChanged", payload, ct);
            }

            if (groupId.HasValue && groupId.Value > 0)
            {
                await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                    .SendAsync("TicketStatusChanged", payload, ct);
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("TicketStatusChanged", payload, ct);
            }
        }
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

        if (groupId.HasValue && groupId.Value > 0)
        {
            await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                .SendAsync("SolutionAdded", payload, ct);
        }
        else
        {
            await _hubContext.Clients.All.SendAsync("SolutionAdded", payload, ct);
        }
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

        if (groupId.HasValue && groupId.Value > 0)
        {
            // Ticket Creado: Notificar a TODO el grupo (group-{groupId} y supervisors-{groupId})
            await _hubContext.Clients.Group($"group-{groupId.Value}")
                .SendAsync("TicketCreated", payload, ct);
            await _hubContext.Clients.Group($"group-{groupId.Value}")
                .SendAsync("NotificationReceived", ct);

            await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                .SendAsync("TicketCreated", payload, ct);
            await _hubContext.Clients.Group($"supervisors-{groupId.Value}")
                .SendAsync("NotificationReceived", ct);
        }
        else
        {
            await _hubContext.Clients.All.SendAsync("TicketCreated", payload, ct);
            await _hubContext.Clients.All.SendAsync("NotificationReceived", ct);
        }
    }
}
