using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using GlpiTicketManager.Api.Notifications;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Integrations;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
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

        // Transitioned durably to PermanentlyFailed instead of being silently deleted
        _factory.WatcherPendingTickets[unresolvableTicket].Status.Should().Be("PermanentlyFailed");
        (await stateRepo.GetPendingTicketsAsync(10, default)).Should().NotContain(p => p.TicketId == unresolvableTicket);
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

    [Fact]
    public async Task Scenario13_ExceededRetries_MarkedPermanentlyFailed_RecoveredOnLateGroupAssignment()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var dashboardRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<IDashboardRepository>());

        const int ticketId = 2601;

        // Arrange: ticket had reached 50 attempts with no group assigned
        for (var i = 0; i < 50; i++)
        {
            await stateRepo.RecordPendingTicketAsync(
                ticketId, 0, "No Group Ticket", "AwaitingGroup", "Waiting for group", default);
        }

        dashboardRepo.Setup(d => d.GetTicketGroupAssignmentAsync(ticketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GlpiTicketGroupInfo?)null);

        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);

        // Act 1: Reconcile runs when attempts >= 50
        await watcher.ReconcilePendingAsync(default);

        // Assert 1: Ticket was NOT deleted, but transitioned to 'PermanentlyFailed'
        var permanentlyFailed = await stateRepo.GetPermanentlyFailedTicketsAsync(10, default);
        permanentlyFailed.Should().Contain(p => p.TicketId == ticketId);
        (await stateRepo.GetPendingTicketsAsync(10, default)).Should().NotContain(p => p.TicketId == ticketId);

        // Act 2: Later, an operator assigns Group 1 to this ticket in GLPI
        dashboardRepo.Setup(d => d.GetTicketGroupAssignmentAsync(ticketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketGroupInfo(ticketId, "No Group Ticket", CustomWebApplicationFactory.Group1Id));

        // Reconcile runs again: detects group assignment and recovers ticket
        await watcher.ReconcilePendingAsync(default);

        // Assert 2: Ticket recovered and active again
        var pendingAfterRecovery = await stateRepo.GetPendingTicketsAsync(10, default);
        pendingAfterRecovery.Should().Contain(p => p.TicketId == ticketId);
        (await stateRepo.GetPermanentlyFailedTicketsAsync(10, default)).Should().NotContain(p => p.TicketId == ticketId);

        // Act 3: Next reconciliation delivers notification to assigned technicians
        await watcher.ReconcilePendingAsync(default);
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticketId));
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech2Id, ticketId));
    }

    [Fact]
    public async Task Scenario14_PostgresFailureDuringProcessAndPendingRecord_CheckpointNotAdvanced_SecondReplicaRecovers()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
        var notifRepo = Mock.Get(scope.ServiceProvider.GetRequiredService<INotificationRepository>());

        const int ticketId = 2701;
        await stateRepo.SetLastSeenTicketIdAsync(2700, default);

        var failDb = true;
        notifRepo.Setup(r => r.TryCreateTicketCreatedAsync(
                It.Is<Notification>(n => failDb && n.TicketId == ticketId),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                if (failDb)
                {
                    throw new TimeoutException("PostgreSQL connection timed out abnormally");
                }
                return Task.FromResult<long?>(999L);
            });

        var failingStateRepo = new Mock<IGlpiWatcherStateRepository>();
        failingStateRepo.Setup(s => s.GetLastSeenTicketIdAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(2700);
        failingStateRepo.Setup(s => s.RecordPendingTicketAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TimeoutException("Database completely unreachable during pending record"));

        var servicesReplicaA = new Mock<IServiceProvider>();
        var scopeReplicaA = new Mock<IServiceScope>();
        scopeReplicaA.Setup(s => s.ServiceProvider).Returns(servicesReplicaA.Object);
        var scopeFactoryA = new Mock<IServiceScopeFactory>();
        scopeFactoryA.Setup(f => f.CreateScope()).Returns(scopeReplicaA.Object);

        servicesReplicaA.Setup(s => s.GetService(typeof(IGlpiWatcherStateRepository))).Returns(failingStateRepo.Object);
        servicesReplicaA.Setup(s => s.GetService(typeof(ITicketRepository))).Returns(scope.ServiceProvider.GetRequiredService<ITicketRepository>());
        servicesReplicaA.Setup(s => s.GetService(typeof(IDashboardRepository))).Returns(scope.ServiceProvider.GetRequiredService<IDashboardRepository>());
        servicesReplicaA.Setup(s => s.GetService(typeof(INotificationService))).Returns(scope.ServiceProvider.GetRequiredService<INotificationService>());
        servicesReplicaA.Setup(s => s.GetService(typeof(ITicketNotificationService))).Returns(scope.ServiceProvider.GetRequiredService<ITicketNotificationService>());

        var replicaA = new GlpiNativeTicketWatcher(
            scopeFactoryA.Object,
            scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>(),
            Mock.Of<ILogger<GlpiNativeTicketWatcher>>());

        await Assert.ThrowsAnyAsync<Exception>(() =>
            replicaA.ProcessBatchAsync([new(ticketId, "Ticket 2701", 0)], default));

        // Checkpoint in persistent database remains at 2700!
        (await stateRepo.GetLastSeenTicketIdAsync(default)).Should().Be(2700);

        // Database recovers: failDb = false
        failDb = false;

        // Replica B starts its poll iteration. It reads checkpoint 2700 from database
        var replicaB = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        await replicaB.ProcessBatchAsync([new(ticketId, "Ticket 2701", 0)], default);

        // Checkpoint is now safely advanced to 2701 and event was not lost
        (await stateRepo.GetLastSeenTicketIdAsync(default)).Should().Be(ticketId);
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticketId));
    }

    [Fact]
    public async Task Scenario15_CursorInitialization_DistinguishesZeroFromNull_DoesNotSkipToMaxId()
    {
        using var scope = _factory.Services.CreateScope();
        var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();

        // Explicitly set checkpoint to 0 (valid checkpoint from migration 010)
        _factory.ResetState();
        _factory.WatcherCheckpoint = 0;

        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(_factory.Services);
        watcher.LastSeenTicketId.Should().Be(-1);

        // Act: Poll once
        await watcher.PollOnceAsync(default);

        // Assert: Cursor was initialized to 0, not jumped to MAX(id)
        watcher.LastSeenTicketId.Should().Be(0);
        (await stateRepo.GetLastSeenTicketIdAsync(default)).Should().Be(0);
    }

    [Fact]
    public async Task Scenario16_ProductionEnvironment_StrictlyIgnoresExcludedIdRange()
    {
        using var scope = _factory.Services.CreateScope();

        const int ticketId = 15; // Within 11-950 range

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GlpiWatcher:ExcludedIdRange"] = "11-950",
                ["GlpiWatcher:AllowTestExclusions"] = "true"
            })
            .Build();

        var prodEnvMock = new Mock<IHostEnvironment>();
        prodEnvMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        var watcher = new GlpiNativeTicketWatcher(
            _factory.Services.GetRequiredService<IServiceScopeFactory>(),
            _factory.Services.GetRequiredService<IDbConnectionFactory>(),
            Mock.Of<ILogger<GlpiNativeTicketWatcher>>(),
            config,
            prodEnvMock.Object);

        // Act: Process batch with ticket 15
        await watcher.ProcessBatchAsync([new(ticketId, "Prod Ticket 15", 0)], default);

        // Assert: Ticket 15 was NOT excluded; notification was created!
        _factory.TicketCreatedKeys.Should().Contain((CustomWebApplicationFactory.Tech1Id, ticketId));
    }

    [Fact]
    public async Task Scenario17_AdminWatcherStatusAndRecoverEndpoint_SurfacesPermanentFailuresAndRecoversForAdminOnly()
    {
        // Arrange: Ticket 4101 is marked PermanentlyFailed in watcher state
        const int ticketId = 4101;
        using (var scope = _factory.Services.CreateScope())
        {
            var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
            await stateRepo.SetLastSeenTicketIdAsync(4105, default);
            await stateRepo.RecordPendingTicketAsync(ticketId, 0, "Operator Alert Ticket", "Pending", "Initial failure", default);
            await stateRepo.MarkPermanentlyFailedAsync(ticketId, "Exceeded 50 retry attempts", default);
        }

        using var client = _factory.CreateClient();

        // 1. Non-admin (tech1) should receive 403 Forbidden
        var techLogin = await client.PostAsJsonAsync("/api/auth/login", new GlpiTicketManager.Application.Dtos.Auth.LoginRequest
        {
            Username = "tech1",
            Password = TestCredentials.Tech1
        });
        techLogin.EnsureSuccessStatusCode();
        var techToken = (await techLogin.Content.ReadFromJsonAsync<GlpiTicketManager.Application.Dtos.Auth.LoginResponse>())!.AccessToken;

        using var forbiddenGet = new HttpRequestMessage(HttpMethod.Get, "/api/admin/watcher-status");
        forbiddenGet.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", techToken);
        var forbiddenGetResp = await client.SendAsync(forbiddenGet);
        forbiddenGetResp.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);

        using var forbiddenPost = new HttpRequestMessage(HttpMethod.Post, $"/api/admin/watcher/recover/{ticketId}");
        forbiddenPost.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", techToken);
        var forbiddenPostResp = await client.SendAsync(forbiddenPost);
        forbiddenPostResp.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);

        // 2. Admin (admin_test) inspects watcher status -> sees operational alert and permanently failed ticket
        var adminLogin = await client.PostAsJsonAsync("/api/auth/login", new GlpiTicketManager.Application.Dtos.Auth.LoginRequest
        {
            Username = "admin_test",
            Password = TestCredentials.Admin
        });
        adminLogin.EnsureSuccessStatusCode();
        var adminToken = (await adminLogin.Content.ReadFromJsonAsync<GlpiTicketManager.Application.Dtos.Auth.LoginResponse>())!.AccessToken;

        using var statusReq = new HttpRequestMessage(HttpMethod.Get, "/api/admin/watcher-status");
        statusReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminToken);
        var statusResp = await client.SendAsync(statusReq);
        statusResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var statusJson = await statusResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        statusJson.GetProperty("lastSeenTicketId").GetInt32().Should().Be(4105);
        statusJson.GetProperty("permanentlyFailedCount").GetInt32().Should().Be(1);
        statusJson.GetProperty("hasOperationalAlert").GetBoolean().Should().BeTrue();

        // 3. Admin triggers explicit recovery via HTTP endpoint
        using var recoverReq = new HttpRequestMessage(HttpMethod.Post, $"/api/admin/watcher/recover/{ticketId}");
        recoverReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminToken);
        var recoverResp = await client.SendAsync(recoverReq);
        recoverResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        // 4. Watcher status now shows 0 permanent failures and 1 pending ticket
        using var statusAfterReq = new HttpRequestMessage(HttpMethod.Get, "/api/admin/watcher-status");
        statusAfterReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminToken);
        var statusAfterResp = await client.SendAsync(statusAfterReq);
        statusAfterResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var statusAfterJson = await statusAfterResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        statusAfterJson.GetProperty("permanentlyFailedCount").GetInt32().Should().Be(0);
        statusAfterJson.GetProperty("pendingCount").GetInt32().Should().Be(1);
        statusAfterJson.GetProperty("hasOperationalAlert").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Scenario18_WatcherCountsExceeding100_ReturnsExactTotalCounts_AndAnonymousHealthReadyDoesNotLeakWatcherCounts()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var stateRepo = scope.ServiceProvider.GetRequiredService<IGlpiWatcherStateRepository>();
            await stateRepo.SetLastSeenTicketIdAsync(6000, default);

            // Seed 105 permanently failed tickets and 112 pending tickets (exceeding the LIMIT 100 list cap)
            for (var i = 1; i <= 105; i++)
            {
                var tid = 5000 + i;
                await stateRepo.RecordPendingTicketAsync(tid, 0, $"Failed #{tid}", "AwaitingGroup", "No group", default);
                await stateRepo.MarkPermanentlyFailedAsync(tid, "Exceeded 50 retry attempts", default);
            }

            for (var i = 1; i <= 112; i++)
            {
                var tid = 5200 + i;
                await stateRepo.RecordPendingTicketAsync(tid, 0, $"Pending #{tid}", "AwaitingGroup", "Retry scheduled", default);
            }
        }

        using var client = _factory.CreateClient();

        var adminLogin = await client.PostAsJsonAsync("/api/auth/login", new GlpiTicketManager.Application.Dtos.Auth.LoginRequest
        {
            Username = "admin_test",
            Password = TestCredentials.Admin
        });
        adminLogin.EnsureSuccessStatusCode();
        var adminToken = (await adminLogin.Content.ReadFromJsonAsync<GlpiTicketManager.Application.Dtos.Auth.LoginResponse>())!.AccessToken;

        using var statusReq = new HttpRequestMessage(HttpMethod.Get, "/api/admin/watcher-status");
        statusReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminToken);
        var statusResp = await client.SendAsync(statusReq);
        statusResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var statusJson = await statusResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        statusJson.GetProperty("pendingCount").GetInt32().Should().Be(112);
        statusJson.GetProperty("permanentlyFailedCount").GetInt32().Should().Be(105);
        statusJson.GetProperty("permanentlyFailedTicketsTruncated").GetBoolean().Should().BeTrue();
        statusJson.GetProperty("permanentlyFailedTickets").GetArrayLength().Should().Be(100);

        // Verify anonymous /health/ready does NOT expose watcherPermanentlyFailedCount or watcherAlert
        var healthResp = await client.GetAsync("/health/ready");
        var healthJson = await healthResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        healthJson.TryGetProperty("watcherPermanentlyFailedCount", out _).Should().BeFalse();
        healthJson.TryGetProperty("watcherAlert", out _).Should().BeFalse();
    }

    [Fact]
    public async Task Scenario19_CreateTicketGroupAssignment_EnforcesMultiLevelAndMultiEntityRules_AndRejectsUnauthorizedFallback()
    {
        using var client = _factory.CreateClient();

        var loginResp = await client.PostAsJsonAsync("/api/auth/login", new GlpiTicketManager.Application.Dtos.Auth.LoginRequest
        {
            Username = "solicitante_test",
            Password = TestCredentials.Solicitante
        });
        loginResp.EnsureSuccessStatusCode();
        var token = (await loginResp.Content.ReadFromJsonAsync<GlpiTicketManager.Application.Dtos.Auth.LoginResponse>())!.AccessToken;

        // 1. Omitting categoryId for external requester with no authorized group -> 400 Bad Request (no fallback to Group 1!)
        using var noCatReq = new HttpRequestMessage(HttpMethod.Post, "/api/tickets")
        {
            Content = JsonContent.Create(new { title = "Sin categoría", description = "No debe asignarse a grupo 1", urgency = 3 })
        };
        noCatReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var noCatResp = await client.SendAsync(noCatReq);
        noCatResp.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

        // 2. Category from another entity (Category 50 in Entity 5 vs requester in Entity 0) -> 400 Bad Request
        using var crossEntityReq = new HttpRequestMessage(HttpMethod.Post, "/api/tickets")
        {
            Content = JsonContent.Create(new { title = "Otra entidad", description = "Categoría entidad 5", urgency = 3, categoryId = 50 })
        };
        crossEntityReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var crossEntityResp = await client.SendAsync(crossEntityReq);
        crossEntityResp.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

        // 3. Multi-level child category (Category 12 inherits from Parent 10 -> Group 1) -> 201 Created with Group 1
        using var multiLevelReq = new HttpRequestMessage(HttpMethod.Post, "/api/tickets")
        {
            Content = JsonContent.Create(new { title = "Subcategoría multinivel", description = "Hereda grupo 1", urgency = 3, categoryId = 12 })
        };
        multiLevelReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var multiLevelResp = await client.SendAsync(multiLevelReq);
        multiLevelResp.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
        _factory.LastCreatedTicketAssignedGroupId.Should().Be(CustomWebApplicationFactory.Group1Id);
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
