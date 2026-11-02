using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using GlpiTicketManager.Api.Notifications;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Integrations;
using GlpiTicketManager.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Phase 3 comprehensive tests for GLPI Native Watcher reconciliation, persistent checkpointing,
/// multi-node concurrency, and fault tolerance across the 10 critical operational scenarios.
/// </summary>
public class GlpiWatcherReconciliationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly string ExpectedSecret = TestCredentials.WebhookSecret;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public GlpiWatcherReconciliationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.ResetState();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Scenario01_RestartBeforeProcessing_ResumesFromCheckpoint_DoesNotReprocessPastTickets()
    {
        // 1. Arrange: simulated previous run established a persistent checkpoint at ticket 1500
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        await stateRepo.SetLastSeenTicketIdAsync(1500, default);

        // 2. Act: new watcher instance starts cold (simulating application restart)
        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        watcher.LastSeenTicketId.Should().Be(-1);

        // Poll once to load checkpoint
        await watcher.PollOnceAsync(default);

        // 3. Assert: watcher loaded checkpoint 1500 without reprocessing past tickets
        watcher.LastSeenTicketId.Should().Be(1500);
        (await stateRepo.GetLastSeenTicketIdAsync(default)).Should().Be(1500);
    }

    [Fact]
    public async Task Scenario02_RestartAfterPartialProcessing_ResumesPendingTicketsWithoutDuplicateNotifications()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var notifRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<INotificationRepository>());

        const int ticketId = 1601;

        // Simulate partial processing: tech1 already received notification before crash
        await notifService.CreateTicketCreatedOnceAsync(
            CustomWebApplicationFactory.Tech1Id, ticketId, "Test Ticket", "Body", default);
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticketId));

        // Ticket is left in durable pending registry
        await stateRepo.RecordPendingTicketAsync(
            ticketId, 0, "Partial Ticket", "PendingRetry", "Crash after first tech", default);

        // New watcher instance starts after reboot and reconciles
        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        await watcher.ReconcilePendingAsync(default);

        // Tech2 receives notification now; Tech1 was NOT duplicated
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech2Id, ticketId));
        _factory.TicketCreatedKeys.Count(k => k == (CustomWebApplicationFactory.Tech1Id, ticketId)).Should().Be(1);

        // Pending record is removed upon successful completion
        var pending = await stateRepo.GetPendingTicketsAsync(10, default);
        pending.Should().NotContain(p => p.TicketId == ticketId);
    }

    [Fact]
    public async Task Scenario03_TicketCreatedWithoutGroup_CapturedAndRecordedInPendingRegistry()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var dashboardRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<IDashboardRepository>());

        const int ticketId = 1701;

        // Configure dashboard repo: ticket 1701 has NO group assigned in GLPI
        dashboardRepo.Setup(d => d.GetTicketGroupAssignmentAsync(ticketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GlpiTicketGroupInfo?)null);

        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        GlpiNativeTicketWatcher.NewTicketRow[] batch = [new(ticketId, "Unassigned Ticket", 0)];

        await watcher.ProcessBatchAsync(batch, default);

        // Ticket checkpoint advances so the watcher is not blocked
        watcher.LastSeenTicketId.Should().Be(ticketId);

        // Ticket is saved to pending tickets with status 'AwaitingGroup'
        var pending = await stateRepo.GetPendingTicketsAsync(10, default);
        var entry = pending.FirstOrDefault(p => p.TicketId == ticketId);
        entry.Should().NotBeNull();
        entry!.Status.Should().Be("AwaitingGroup");

        // No technician notifications sent yet
        _factory.TicketCreatedKeys.Should().NotContain(k => k.TicketId == ticketId);
    }

    [Fact]
    public async Task Scenario04_LateGroupAssignment_ReconciledAndNotified()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var dashboardRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<IDashboardRepository>());

        const int ticketId = 1801;

        // Step 1: Ticket is in pending registry awaiting group
        await stateRepo.RecordPendingTicketAsync(ticketId, 0, "Late Assigned Ticket", "AwaitingGroup", null, default);

        // Step 2: GLPI assigns group 1 later
        dashboardRepo.Setup(d => d.GetTicketGroupAssignmentAsync(ticketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketGroupInfo(ticketId, "Late Assigned Ticket", CustomWebApplicationFactory.Group1Id));

        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);

        // Step 3: Reconciliation runs
        await watcher.ReconcilePendingAsync(default);

        // Step 4: Technicians in Group 1 are notified
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticketId));
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech2Id, ticketId));
        _factory.NotificationMock.Verify(n => n.NotifyTicketCreatedAsync(
            ticketId, CustomWebApplicationFactory.Group1Id, It.IsAny<CancellationToken>()), Times.AtLeastOnce);

        // Step 5: Pending registry cleared
        var pending = await stateRepo.GetPendingTicketsAsync(10, default);
        pending.Should().NotContain(p => p.TicketId == ticketId);
    }

    [Fact]
    public async Task Scenario05_TwoReplicasSimultaneous_EnsuresIdempotencyAndMonotonicCheckpoint()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();

        const int ticketId = 1901;
        GlpiNativeTicketWatcher.NewTicketRow[] batch = [new(ticketId, "Concurrent Ticket", 0)];

        var replicaA = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        var replicaB = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);

        // Both replicas process the identical batch concurrently
        await Task.WhenAll(
            replicaA.ProcessBatchAsync(batch, default),
            replicaB.ProcessBatchAsync(batch, default));

        // Deduplication ensures exactly 1 key per technician
        _factory.TicketCreatedKeys.Count(k => k == (CustomWebApplicationFactory.Tech1Id, ticketId)).Should().Be(1);
        _factory.TicketCreatedKeys.Count(k => k == (CustomWebApplicationFactory.Tech2Id, ticketId)).Should().Be(1);

        // Checkpoint is at 1901
        (await stateRepo.GetLastSeenTicketIdAsync(default)).Should().Be(ticketId);
    }

    [Fact]
    public async Task Scenario06_TransientPostgresFailure_HaltsBatchSafelyAndRetriesNextPoll()
    {
        using var scope = _factory.Services.CreateScope();
        var notifRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<INotificationRepository>());

        const int ticket1 = 2001;
        const int ticket2 = 2002;

        var fail = true;
        notifRepo.Setup(r => r.TryCreateTicketCreatedAsync(
                It.Is<Notification>(n => fail && n.TicketId == ticket1 && n.UserId == CustomWebApplicationFactory.Tech2Id),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                fail = false;
                throw new TimeoutException("Transient connection error");
            });

        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        GlpiNativeTicketWatcher.NewTicketRow[] batch = [new(ticket1, "Transient Fail", 0), new(ticket2, "Second", 0)];

        // Initial attempt throws transient exception
        await Assert.ThrowsAsync<TimeoutException>(() => watcher.ProcessBatchAsync(batch, default));

        // Watcher cursor did NOT skip ahead to 2002
        watcher.LastSeenTicketId.Should().NotBe(ticket2);

        // Retry succeeding pass
        await watcher.ProcessBatchAsync(batch, default);

        // Now both tickets are fully processed
        watcher.LastSeenTicketId.Should().Be(ticket2);
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticket1));
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech2Id, ticket1));
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticket2));
    }

    [Fact]
    public async Task Scenario07_PersistentFailure_ExceedsMaxAttemptsHandledSafely()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var dashboardRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<IDashboardRepository>());

        const int unresolvableTicket = 2101;

        // Seed with attempts = 50 (max threshold)
        await stateRepo.RecordPendingTicketAsync(unresolvableTicket, 0, "Zombie Ticket", "AwaitingGroup", null, default);
        _factory.WatcherPendingTickets[unresolvableTicket] = new GlpiWatcherPendingTicket(
            unresolvableTicket, 0, "Zombie Ticket", "AwaitingGroup", 50, DateTime.UtcNow, null);

        dashboardRepo.Setup(d => d.GetTicketGroupAssignmentAsync(unresolvableTicket, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GlpiTicketGroupInfo?)null);

        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);

        // Reconcile pending tickets
        await watcher.ReconcilePendingAsync(default);

        // Dropped safely to prevent infinite blocking
        _factory.WatcherPendingTickets.Should().NotContainKey(unresolvableTicket);
    }

    [Fact]
    public async Task Scenario08_LegitimateTicketsInExcludedRange_ProcessedWhenExclusionNotConfigured()
    {
        // Create watcher with empty configuration (no ExcludedIdRange, production mode)
        var emptyConfig = new ConfigurationBuilder().Build();
        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services, emptyConfig);

        const int legitimateTicketId = 150; // Between 11 and 950
        GlpiNativeTicketWatcher.NewTicketRow[] batch = [new(legitimateTicketId, "Legitimate Prod Ticket", 0)];

        await watcher.ProcessBatchAsync(batch, default);

        // In production without exclusion, ticket 150 is processed, not skipped!
        watcher.LastSeenTicketId.Should().Be(legitimateTicketId);
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, legitimateTicketId));
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech2Id, legitimateTicketId));
    }

    [Fact]
    public async Task Scenario09_WebhookReplay_RepeatedDeliveries_DedupedIdempotently()
    {
        const int ticketId = 2201;
        var payload = $"{{\"ticketId\": {ticketId}}}";

        using var request1 = CreateSignedRequest("/api/integrations/glpi/ticket-created", payload);
        var response1 = await _client.SendAsync(request1);
        response1.EnsureSuccessStatusCode();

        // Immediate replay of same webhook delivery
        using var request2 = CreateSignedRequest("/api/integrations/glpi/ticket-created", payload);
        var response2 = await _client.SendAsync(request2);
        response2.EnsureSuccessStatusCode();

        // Exactly one notification key exists per tech, no duplicates
        _factory.TicketCreatedKeys.Count(k => k == (CustomWebApplicationFactory.Tech1Id, ticketId)).Should().Be(1);
        _factory.TicketCreatedKeys.Count(k => k == (CustomWebApplicationFactory.Tech2Id, ticketId)).Should().Be(1);
    }

    [Fact]
    public async Task Scenario10_HistoricalNotifications_PreservedAcrossNewTicketCreations()
    {
        using var scope = _factory.Services.CreateScope();
        var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var notifRepo = scope.ServiceProvider.GetRequiredService<INotificationRepository>();

        // Pre-populate historical notifications for Tech1
        for (int i = 1; i <= 5; i++)
        {
            await notifService.CreateAsync(
                CustomWebApplicationFactory.Tech1Id, "TicketUpdated", 500 + i, $"Update #{i}", "Historical message");
        }

        // New ticket arrives through watcher
        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        const int newTicketId = 2301;
        await watcher.ProcessBatchAsync([new(newTicketId, "Brand New Ticket", 0)], default);

        // Verify historical notifications are preserved intact
        var allNotifs = await notifRepo.GetByUserAsync(CustomWebApplicationFactory.Tech1Id, 50, 0, default);
        allNotifs.Count(n => n.Type == "TicketUpdated").Should().Be(5);
        allNotifs.Should().Contain(n => n.Type == "TicketCreated" && n.TicketId == newTicketId);
    }

    [Fact]
    public async Task Scenario11_TicketWithNoAvailableTechnicians_RecordedAsAwaitingTechnician_AndReconciledWhenTechAssigned()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var dashboardRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<IDashboardRepository>());

        const int ticketId = 2401;
        const int emptyGroupId = 99;

        // Group 99 has no technicians assigned
        dashboardRepo.Setup(d => d.GetTicketGroupAssignmentAsync(ticketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketGroupInfo(ticketId, "Ticket for empty group", emptyGroupId));
        dashboardRepo.Setup(d => d.GetTechnicianUserIdsInGroupAsync(emptyGroupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int>());

        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        await watcher.ProcessBatchAsync([new(ticketId, "Ticket for empty group", 0)], default);

        // Ticket cursor advanced so batch is not stuck, but ticket is recorded in pending as AwaitingTechnician
        watcher.LastSeenTicketId.Should().Be(ticketId);
        var pending = await stateRepo.GetPendingTicketsAsync(10, default);
        var entry = pending.FirstOrDefault(p => p.TicketId == ticketId);
        entry.Should().NotBeNull();
        entry!.Status.Should().Be("AwaitingTechnician");

        // Later, a technician is assigned to Group 99
        dashboardRepo.Setup(d => d.GetTechnicianUserIdsInGroupAsync(emptyGroupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int> { CustomWebApplicationFactory.Tech1Id });

        // Reconciliation picks it up and delivers notification
        await watcher.ReconcilePendingAsync(default);

        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticketId));
        (await stateRepo.GetPendingTicketsAsync(10, default)).Should().NotContain(p => p.TicketId == ticketId);
    }

    [Fact]
    public async Task Scenario12_OutOfOrderFailure_PreviousFailsWhileLaterAdvances_PreservedInPendingAndRecovered()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var notifRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<INotificationRepository>());

        const int ticketEarlier = 2501;
        const int ticketLater = 2502;

        // Simulate earlier ticket failure (e.g. transient timeout)
        var fail = true;
        notifRepo.Setup(r => r.TryCreateTicketCreatedAsync(
                It.Is<Notification>(n => fail && n.TicketId == ticketEarlier),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                fail = false;
                throw new TimeoutException("Transient error on earlier ticket");
            });

        var replicaA = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        var replicaB = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);

        // Replica A attempts ticketEarlier and throws, recording it into pending as Retry
        await Assert.ThrowsAsync<TimeoutException>(() =>
            replicaA.ProcessBatchAsync([new(ticketEarlier, "Earlier", 0)], default));

        var pendingAfterFail = await stateRepo.GetPendingTicketsAsync(10, default);
        pendingAfterFail.Should().Contain(p => p.TicketId == ticketEarlier && p.Status == "Retry");

        // Replica B concurrently processes ticketLater and advances global checkpoint to 2502
        await replicaB.ProcessBatchAsync([new(ticketLater, "Later", 0)], default);
        (await stateRepo.GetLastSeenTicketIdAsync(default)).Should().Be(ticketLater);

        // Later, database is healthy again: reconciliation runs and successfully completes ticketEarlier
        await replicaA.ReconcilePendingAsync(default);

        // Both tickets have received notifications without losing earlier ticket!
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticketEarlier));
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticketLater));
        (await stateRepo.GetPendingTicketsAsync(10, default)).Should().NotContain(p => p.TicketId == ticketEarlier);
    }

    private static HttpRequestMessage CreateSignedRequest(string uri, string rawBody)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, uri);
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(System.Globalization.CultureInfo.InvariantCulture);
        var signature = HMACSHA256.HashData(Encoding.UTF8.GetBytes(ExpectedSecret),
            Encoding.UTF8.GetBytes(rawBody + timestamp));
        request.Headers.Add("X-GLPI-timestamp", timestamp);
        request.Headers.Add("X-GLPI-signature", Convert.ToHexString(signature).ToLowerInvariant());
        request.Content = new StringContent(rawBody, Encoding.UTF8, "application/json");
        return request;
    }
}
