using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Integrations;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace GlpiTicketManager.Api.Notifications;

/// <summary>
/// H-41 / H-02: Lightweight background monitor that detects tickets created directly in
/// GLPI's native UI (which would otherwise wait up to 60s for GLPI's `QueuedWebhook`
/// cron task) and immediately routes them to their group and broadcasts `TicketCreated`
/// via SignalR so the technician's queue updates in &lt; 2 seconds without F5.
///
/// Features:
/// - Durable checkpoint in PostgreSQL (survives instance restarts and prevents re-skipping tickets).
/// - Captures tickets created without a group and reconciles them when a group is assigned later.
/// - Configurable exclusion range (no hardcoded skip in production; tickets 11-950 are processed).
/// - Safe multi-node concurrency using idempotent PostgreSQL reservations.
/// </summary>
public sealed class GlpiNativeTicketWatcher : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IDbConnectionFactory _dbFactory;
    private readonly ILogger<GlpiNativeTicketWatcher> _logger;
    private readonly IConfiguration? _configuration;

    internal int LastSeenTicketId { get; private set; } = -1;

    public GlpiNativeTicketWatcher(
        IServiceScopeFactory scopeFactory,
        IDbConnectionFactory dbFactory,
        ILogger<GlpiNativeTicketWatcher> logger,
        IConfiguration? configuration = null)
    {
        _scopeFactory = scopeFactory;
        _dbFactory = dbFactory;
        _logger = logger;
        _configuration = configuration;
    }

    internal sealed record NewTicketRow(long Id, string Name, long CategoryId);

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

    public async Task PollOnceAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();

        if (LastSeenTicketId < 0)
        {
            var persistedId = await stateRepo.GetLastSeenTicketIdAsync(ct);
            if (persistedId is not null and > 0)
            {
                LastSeenTicketId = persistedId.Value;
                return;
            }

            using var initConn = _dbFactory.CreateConnection();
            if (initConn is MySqlConnection mConn)
            {
                await mConn.OpenAsync(ct);
            }
            else
            {
                initConn.Open();
            }

            var maxId = await initConn.ExecuteScalarAsync<int?>(
                new CommandDefinition(
                    "SELECT COALESCE(MAX(id), 0) FROM glpi_tickets WHERE is_deleted = 0;",
                    cancellationToken: ct));
            LastSeenTicketId = maxId ?? 0;
            await stateRepo.SetLastSeenTicketIdAsync(LastSeenTicketId, ct);
            return;
        }

        using var conn = _dbFactory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
        {
            await mysqlConn.OpenAsync(ct);
        }
        else
        {
            conn.Open();
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
            new CommandDefinition(sql, new { LastId = LastSeenTicketId }, cancellationToken: ct))).ToList();

        if (newTickets.Count > 0)
        {
            await ProcessBatchAsync(newTickets, ct);
        }

        // Reconcile pending tickets (late group assignments or retry tickets)
        await ReconcilePendingAsync(ct);
    }

    internal async Task ProcessBatchAsync(IReadOnlyList<NewTicketRow> newTickets, CancellationToken ct)
    {
        if (newTickets.Count == 0)
        {
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var ticketRepository = scope.ServiceProvider.GetRequiredService<ITicketRepository>();
        var dashboardRepository = scope.ServiceProvider.GetRequiredService<IDashboardRepository>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var ticketNotificationService = scope.ServiceProvider.GetRequiredService<ITicketNotificationService>();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();

        foreach (var row in newTickets)
        {
            var ticketId = (int)row.Id;
            var categoryId = (int)row.CategoryId;

            if (IsExcluded(ticketId))
            {
                LastSeenTicketId = ticketId;
                await stateRepo.SetLastSeenTicketIdAsync(ticketId, ct);
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
                // Ticket created without group. Save to durable pending registry so late group assignments
                // will be picked up by ReconcilePendingAsync!
                await stateRepo.RecordPendingTicketAsync(ticketId, categoryId, row.Name, "AwaitingGroup", null, ct);
                LastSeenTicketId = ticketId;
                await stateRepo.SetLastSeenTicketIdAsync(ticketId, ct);
                continue;
            }

            var techIds = await dashboardRepository.GetTechnicianUserIdsInGroupAsync(groupId.Value, ct);
            if (techIds.Count == 0)
            {
                // Ticket assigned to group with no technicians currently available.
                // Record in durable pending registry as AwaitingTechnician.
                await stateRepo.RecordPendingTicketAsync(
                    ticketId, categoryId, row.Name, "AwaitingTechnician", "No technicians assigned to group", ct);
                LastSeenTicketId = ticketId;
                await stateRepo.SetLastSeenTicketIdAsync(ticketId, ct);
                continue;
            }

            var created = false;
            try
            {
                foreach (var techId in techIds)
                {
                    // Retry the row after a persistence failure. Earlier recipients
                    // already have a durable claim and will not be notified again.
                    created |= await notificationService.CreateTicketCreatedOnceAsync(
                        techId, ticketId, $"Nuevo ticket #{ticketId}",
                        $"Se ha asignado el ticket '{row.Name}' a tu grupo.", ct);
                }

                await stateRepo.RemovePendingTicketAsync(ticketId, ct);
                LastSeenTicketId = ticketId;
                await stateRepo.SetLastSeenTicketIdAsync(ticketId, ct);
            }
            catch (Exception ex)
            {
                // Preserves ticket in durable pending registry as 'Retry' so that even if
                // a concurrent replica advances the global checkpoint past this ticket ID,
                // this ticket will not be skipped or lost.
                try
                {
                    await stateRepo.RecordPendingTicketAsync(ticketId, categoryId, row.Name, "Retry", ex.Message, ct);
                }
                catch
                {
                    // Best effort recording if database unreachable
                }
                throw;
            }

            if (created)
            {
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

    public async Task ReconcilePendingAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var ticketRepository = scope.ServiceProvider.GetRequiredService<ITicketRepository>();
        var dashboardRepository = scope.ServiceProvider.GetRequiredService<IDashboardRepository>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var ticketNotificationService = scope.ServiceProvider.GetRequiredService<ITicketNotificationService>();

        var pending = await stateRepo.GetPendingTicketsAsync(20, ct);
        if (pending.Count == 0) return;

        foreach (var item in pending)
        {
            if (item.Attempts >= 50)
            {
                _logger.LogInformation("Ticket {TicketId} exceeded max reconciliation attempts without completion.", item.TicketId);
                await stateRepo.RemovePendingTicketAsync(item.TicketId, ct);
                continue;
            }

            var groupInfo = await dashboardRepository.GetTicketGroupAssignmentAsync(item.TicketId, ct);
            int? groupId = groupInfo?.GroupId;

            if ((groupId is null || groupId <= 0) && item.CategoryId > 0)
            {
                groupId = await ticketRepository.GetAssignmentGroupForCategoryAsync(item.CategoryId, ct);
                if (groupId is > 0)
                {
                    await ticketRepository.EnsureTicketGroupAssignedAsync(item.TicketId, groupId.Value, ct);
                }
            }

            if (groupId is null || groupId <= 0)
            {
                // Still waiting for group assignment
                await stateRepo.RecordPendingTicketAsync(item.TicketId, item.CategoryId, item.TicketName, "AwaitingGroup", null, ct);
                continue;
            }

            var techIds = await dashboardRepository.GetTechnicianUserIdsInGroupAsync(groupId.Value, ct);
            if (techIds.Count == 0)
            {
                // Still waiting for technicians in group
                await stateRepo.RecordPendingTicketAsync(
                    item.TicketId, item.CategoryId, item.TicketName, "AwaitingTechnician", "No technicians in group", ct);
                continue;
            }

            var created = false;
            try
            {
                foreach (var techId in techIds)
                {
                    created |= await notificationService.CreateTicketCreatedOnceAsync(
                        techId, item.TicketId, $"Nuevo ticket #{item.TicketId}",
                        $"Se ha asignado el ticket '{item.TicketName}' a tu grupo.", ct);
                }

                await stateRepo.RemovePendingTicketAsync(item.TicketId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Reconciliation retry failed for ticket {TicketId}", item.TicketId);
                await stateRepo.RecordPendingTicketAsync(item.TicketId, item.CategoryId, item.TicketName, "Retry", ex.Message, ct);
                continue;
            }

            if (created)
            {
                try
                {
                    await ticketNotificationService.NotifyTicketCreatedAsync(item.TicketId, groupId.Value, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "SignalR emit failed during reconciliation for ticket {TicketId}", item.TicketId);
                }
            }
        }
    }

    private bool IsExcluded(int ticketId)
    {
        var range = _configuration?["GlpiWatcher:ExcludedIdRange"];
        if (string.IsNullOrWhiteSpace(range))
        {
            return false;
        }

        var parts = range.Split('-');
        if (parts.Length == 2 &&
            int.TryParse(parts[0], out var start) &&
            int.TryParse(parts[1], out var end))
        {
            return ticketId >= start && ticketId <= end;
        }

        return false;
    }
}
