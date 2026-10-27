using System.Data.Common;
using Dapper;
using GlpiTicketManager.Api.Endpoints;
using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;

namespace GlpiTicketManager.Api.Notifications;

public sealed class NotificationDispatcherService : BackgroundService
{
    private readonly INotificationQueue _queue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationDispatcherService> _logger;

    public NotificationDispatcherService(
        INotificationQueue queue,
        IServiceProvider serviceProvider,
        ILogger<NotificationDispatcherService> logger)
    {
        _queue = queue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationDispatcherService background worker started.");

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                NotificationTask task;
                try
                {
                    task = await _queue.ReadAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                try
                {
                    await ProcessTaskAsync(task, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing notification task {Type}", task.Type);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Graceful shutdown
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error in NotificationDispatcherService");
        }
        finally
        {
            _logger.LogInformation("NotificationDispatcherService background worker stopped.");
        }
    }

    private async Task ProcessTaskAsync(NotificationTask task, CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<TicketHub>>();
        var mariadbFactory = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
        var appDbFactory = scope.ServiceProvider.GetRequiredService<IAppDbConnectionFactory>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        switch (task.Type)
        {
            case NotificationTaskType.TicketClaimed:
            {
                var targetGroups = new HashSet<string> { $"group-{task.GroupId}", "admins" };
                if (task.AssigneeId.HasValue && task.AssigneeId.Value > 0)
                {
                    targetGroups.Add($"user-{task.AssigneeId.Value}");
                }

                await hubContext.Clients.Groups(targetGroups.ToList())
                    .SendAsync("TicketClaimed", new
                    {
                        ticketId = task.TicketId,
                        assignedUserId = task.AssigneeId,
                        groupId = task.GroupId,
                        timestamp = DateTime.UtcNow
                    }, ct);

                if (task.GroupId.HasValue && task.GroupId.Value > 0)
                {
                    await PushEndpoints.SendNotificationToGroupAsync(
                        mariadbFactory,
                        appDbFactory,
                        config,
                        task.GroupId.Value,
                        task.Title ?? $"Ticket #{task.TicketId} asignado",
                        task.Message ?? $"El ticket #{task.TicketId} ha sido asignado al técnico.",
                        task.Url ?? $"/tickets/{task.TicketId}",
                        _logger,
                        ct);
                }
                break;
            }

            case NotificationTaskType.TicketStatusChanged:
            {
                int? groupId = task.GroupId;
                if (!groupId.HasValue || groupId.Value <= 0)
                {
                    if (task.TicketId.HasValue)
                    {
                        groupId = await ResolveTicketGroupIdAsync(mariadbFactory, task.TicketId.Value, ct);
                    }
                }

                var targetGroups = new HashSet<string> { "admins" };
                if (groupId.HasValue && groupId.Value > 0)
                {
                    targetGroups.Add($"group-{groupId.Value}");
                }
                if (task.AssigneeId.HasValue && task.AssigneeId.Value > 0)
                {
                    targetGroups.Add($"user-{task.AssigneeId.Value}");
                }

                await hubContext.Clients.Groups(targetGroups.ToList())
                    .SendAsync("TicketStatusChanged", new
                    {
                        ticketId = task.TicketId,
                        newStatus = task.NewStatus,
                        assigneeId = task.AssigneeId,
                        timestamp = DateTime.UtcNow
                    }, ct);

                if (groupId.HasValue && groupId.Value > 0)
                {
                    await PushEndpoints.SendNotificationToGroupAsync(
                        mariadbFactory,
                        appDbFactory,
                        config,
                        groupId.Value,
                        task.Title ?? $"Ticket #{task.TicketId} actualizado",
                        task.Message ?? $"El ticket #{task.TicketId} cambió de estado.",
                        task.Url ?? $"/tickets/{task.TicketId}",
                        _logger,
                        ct);
                }
                break;
            }

            case NotificationTaskType.SolutionAdded:
            {
                int? groupId = task.GroupId;
                if (!groupId.HasValue || groupId.Value <= 0)
                {
                    if (task.TicketId.HasValue)
                    {
                        groupId = await ResolveTicketGroupIdAsync(mariadbFactory, task.TicketId.Value, ct);
                    }
                }

                var targetGroups = new HashSet<string> { "admins" };
                if (groupId.HasValue && groupId.Value > 0)
                {
                    targetGroups.Add($"group-{groupId.Value}");
                }
                if (task.AuthorUserId.HasValue && task.AuthorUserId.Value > 0)
                {
                    targetGroups.Add($"user-{task.AuthorUserId.Value}");
                }

                await hubContext.Clients.Groups(targetGroups.ToList())
                    .SendAsync("SolutionAdded", new
                    {
                        ticketId = task.TicketId,
                        authorUserId = task.AuthorUserId,
                        timestamp = DateTime.UtcNow
                    }, ct);

                if (groupId.HasValue && groupId.Value > 0)
                {
                    await PushEndpoints.SendNotificationToGroupAsync(
                        mariadbFactory,
                        appDbFactory,
                        config,
                        groupId.Value,
                        task.Title ?? $"Solución propuesta #{task.TicketId}",
                        task.Message ?? $"Se ha propuesto una solución para el ticket #{task.TicketId}.",
                        task.Url ?? $"/tickets/{task.TicketId}",
                        _logger,
                        ct);
                }
                break;
            }

            case NotificationTaskType.TicketCreated:
            {
                int? groupId = task.GroupId;
                if (!groupId.HasValue || groupId.Value <= 0)
                {
                    if (task.TicketId.HasValue)
                    {
                        groupId = await ResolveTicketGroupIdAsync(mariadbFactory, task.TicketId.Value, ct);
                    }
                }

                var targetGroups = new HashSet<string> { "admins" };
                if (groupId.HasValue && groupId.Value > 0)
                {
                    targetGroups.Add($"group-{groupId.Value}");
                }

                await hubContext.Clients.Groups(targetGroups.ToList())
                    .SendAsync("TicketCreated", new
                    {
                        ticketId = task.TicketId,
                        groupId,
                        timestamp = DateTime.UtcNow
                    }, ct);

                if (groupId.HasValue && groupId.Value > 0)
                {
                    await PushEndpoints.SendNotificationToGroupAsync(
                        mariadbFactory,
                        appDbFactory,
                        config,
                        groupId.Value,
                        task.Title ?? $"Nuevo ticket #{task.TicketId}",
                        task.Message ?? "Se ha recibido un nuevo ticket en la cola de tu grupo.",
                        task.Url ?? $"/tickets/{task.TicketId}",
                        _logger,
                        ct);
                }
                break;
            }

            case NotificationTaskType.PersistentNotificationToUser:
            {
                if (task.UserId.HasValue && task.UserId.Value > 0)
                {
                    var uid = task.UserId.Value;
                    await hubContext.Clients.Group($"user-{uid}")
                        .SendAsync("NotificationReceived", task.Payload, ct);

                    await PushEndpoints.SendNotificationToUserAsync(
                        appDbFactory,
                        config,
                        uid,
                        task.Title ?? "Nueva notificación",
                        task.Message ?? string.Empty,
                        task.Url ?? "/kanban",
                        _logger,
                        ct);
                }
                break;
            }

            case NotificationTaskType.WebPushToUser:
            {
                if (task.UserId.HasValue && task.UserId.Value > 0)
                {
                    await PushEndpoints.SendNotificationToUserAsync(
                        appDbFactory,
                        config,
                        task.UserId.Value,
                        task.Title ?? "GLPI Ticket Manager",
                        task.Message ?? string.Empty,
                        task.Url ?? "/kanban",
                        _logger,
                        ct);
                }
                break;
            }

            case NotificationTaskType.WebPushToGroup:
            {
                if (task.GroupId.HasValue && task.GroupId.Value > 0)
                {
                    await PushEndpoints.SendNotificationToGroupAsync(
                        mariadbFactory,
                        appDbFactory,
                        config,
                        task.GroupId.Value,
                        task.Title ?? "GLPI Ticket Manager",
                        task.Message ?? string.Empty,
                        task.Url ?? "/kanban",
                        _logger,
                        ct);
                }
                break;
            }
        }
    }

    private static async Task<int?> ResolveTicketGroupIdAsync(
        IDbConnectionFactory mariadbFactory,
        int ticketId,
        CancellationToken ct)
    {
        try
        {
            await using var conn = (DbConnection)mariadbFactory.CreateConnection();
            await conn.OpenAsync(ct);
            const string sql = "SELECT groups_id FROM glpi_groups_tickets WHERE tickets_id = @TicketId LIMIT 1;";
            var gid = await conn.QueryFirstOrDefaultAsync<int?>(new CommandDefinition(sql, new { TicketId = ticketId }, cancellationToken: ct));
            return gid > 0 ? gid : null;
        }
        catch
        {
            return null;
        }
    }
}
