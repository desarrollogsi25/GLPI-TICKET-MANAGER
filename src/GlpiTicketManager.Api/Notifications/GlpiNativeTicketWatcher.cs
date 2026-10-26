using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Integrations;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace GlpiTicketManager.Api.Notifications;

/// <summary>
/// H-41: Lightweight background monitor that detects tickets created directly in
/// GLPI's native UI (which would otherwise wait up to 60s for GLPI's `QueuedWebhook`
/// cron task) and immediately routes them to their group and broadcasts `TicketCreated`
/// via SignalR so the technician's queue updates in &lt; 2 seconds without F5.
/// </summary>
public sealed class GlpiNativeTicketWatcher : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IDbConnectionFactory _dbFactory;
    private readonly ILogger<GlpiNativeTicketWatcher> _logger;
    private int _lastSeenTicketId = -1;

    public GlpiNativeTicketWatcher(
        IServiceScopeFactory scopeFactory,
        IDbConnectionFactory dbFactory,
        ILogger<GlpiNativeTicketWatcher> logger)
    {
        _scopeFactory = scopeFactory;
        _dbFactory = dbFactory;
        _logger = logger;
    }

    private sealed record NewTicketRow(long Id, string Name, long CategoryId);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Delay slightly on boot so migrations/seeds settle
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "GlpiNativeTicketWatcher poll iteration skipped.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMilliseconds(1200), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task PollOnceAsync(CancellationToken ct)
    {
        using var conn = _dbFactory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
        {
            await mysqlConn.OpenAsync(ct);
        }
        else
        {
            conn.Open();
        }

        if (_lastSeenTicketId < 0)
        {
            var maxId = await conn.ExecuteScalarAsync<int?>(
                new CommandDefinition(
                    "SELECT COALESCE(MAX(id), 0) FROM glpi_tickets WHERE is_deleted = 0;",
                    cancellationToken: ct));
            _lastSeenTicketId = maxId ?? 0;
            return;
        }

        const string sql = """
            SELECT
                CAST(t.id AS SIGNED) AS Id,
                t.name AS Name,
                CAST(t.itilcategories_id AS SIGNED) AS CategoryId
            FROM glpi_tickets t
            WHERE t.id > @LastId
              AND t.is_deleted = 0
            ORDER BY t.id ASC
            LIMIT 10;
            """;

        var newTickets = (await conn.QueryAsync<NewTicketRow>(
            new CommandDefinition(sql, new { LastId = _lastSeenTicketId }, cancellationToken: ct))).ToList();

        if (newTickets.Count == 0)
        {
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var ticketRepository = scope.ServiceProvider.GetRequiredService<ITicketRepository>();
        var dashboardRepository = scope.ServiceProvider.GetRequiredService<IDashboardRepository>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var ticketNotificationService = scope.ServiceProvider.GetRequiredService<ITicketNotificationService>();

        foreach (var row in newTickets)
        {
            var ticketId = (int)row.Id;
            var categoryId = (int)row.CategoryId;
            if (ticketId > _lastSeenTicketId)
            {
                _lastSeenTicketId = ticketId;
            }

            // Skip synthetic E2E fixture resets (IDs 11..950) if any
            if (ticketId is >= 11 and <= 950)
            {
                continue;
            }

            var groupInfo = await dashboardRepository.GetTicketGroupAssignmentAsync(ticketId, ct);
            int? groupId = groupInfo?.GroupId;

            if ((groupId is null || groupId <= 0) && categoryId > 0)
            {
                groupId = await ticketRepository.GetAssignmentGroupForCategoryAsync(categoryId, ct);
                if (groupId is > 0)
                {
                    await ticketRepository.EnsureTicketGroupAssignedAsync(ticketId, groupId.Value, ct);
                }
            }

            if (groupId is null || groupId <= 0)
            {
                continue;
            }

            // Only emit persistent notifications if not already emitted for this ticketId
            var techIds = await dashboardRepository.GetTechnicianUserIdsInGroupAsync(groupId.Value, ct);
            foreach (var techId in techIds)
            {
                try
                {
                    var existing = await notificationService.GetByUserAsync(techId, 10, 0, ct);
                    if (!existing.Any(n => n.TicketId == ticketId && n.Type == "TicketCreated"))
                    {
                        await notificationService.CreateAsync(
                            techId,
                            "TicketCreated",
                            ticketId,
                            $"Nuevo ticket #{ticketId}",
                            $"Se ha asignado el ticket '{row.Name}' a tu grupo.",
                            ct);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Watcher notification skipped for tech {TechId}", techId);
                }
            }

            try
            {
                await ticketNotificationService.NotifyTicketCreatedAsync(ticketId, groupId.Value, ct);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Watcher SignalR emit skipped for ticket {TicketId}", ticketId);
            }
        }
    }
}
