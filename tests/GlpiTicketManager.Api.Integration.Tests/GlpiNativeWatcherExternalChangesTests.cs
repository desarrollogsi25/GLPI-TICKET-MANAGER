using FluentAssertions;
using GlpiTicketManager.Api.Notifications;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// External GLPI edits never reach our API, so the watcher diffs GLPI's status
/// column and broadcasts a scoped update. These tests pin that contract.
/// </summary>
public class GlpiNativeWatcherExternalChangesTests
{
    private readonly Mock<ITicketRepository> _tickets = new();
    private readonly Mock<IDashboardRepository> _dashboard = new();
    private readonly Mock<ITicketNotificationService> _notifications = new();
    private readonly GlpiNativeTicketWatcher _watcher;

    public GlpiNativeWatcherExternalChangesTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton(_tickets.Object);
        services.AddSingleton(_dashboard.Object);
        services.AddSingleton(_notifications.Object);
        var provider = services.BuildServiceProvider();

        _watcher = new GlpiNativeTicketWatcher(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Mock.Of<IDbConnectionFactory>(),
            NullLogger<GlpiNativeTicketWatcher>.Instance);
    }

    private void Baseline(params (int TicketId, int Status)[] statuses)
    {
        _tickets.Setup(t => t.GetTicketStatusSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(statuses.ToDictionary(s => s.TicketId, s => s.Status));
    }

    private void Changes(params TicketChange[] changes)
    {
        _tickets.Setup(t => t.GetChangedTicketsSinceAsync(It.IsAny<DateTime>(), It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(changes);
    }

    private void GroupIs(int ticketId, int groupId)
    {
        _dashboard.Setup(d => d.GetTicketGroupAssignmentAsync(ticketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketGroupInfo(ticketId, "Ticket", groupId));
    }

    [Fact]
    public async Task BaselineScan_NeverBroadcastsHistoricalTickets()
    {
        Baseline((42, 2));

        await _watcher.PollExternalStatusChangesAsync(default);

        _notifications.Verify(n => n.NotifyExternalTicketStatusChangedAsync(
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GlpiClose_IsPropagatedOnce_WithAssigneeAndGroup()
    {
        Baseline((42, 2));
        await _watcher.PollExternalStatusChangesAsync(default);
        GroupIs(42, 3);
        Changes(new TicketChange(42, 6, 7, DateTime.UtcNow));

        await _watcher.PollExternalStatusChangesAsync(default);
        // The 2s overlap window re-reads the same row; it must not duplicate the event.
        await _watcher.PollExternalStatusChangesAsync(default);

        _notifications.Verify(n => n.NotifyExternalTicketStatusChangedAsync(
            42, 6, 7, 3, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CommentWithoutStatusChange_IsNotBroadcast()
    {
        Baseline((42, 2));
        await _watcher.PollExternalStatusChangesAsync(default);
        Changes(new TicketChange(42, 2, null, DateTime.UtcNow));

        await _watcher.PollExternalStatusChangesAsync(default);

        _notifications.Verify(n => n.NotifyExternalTicketStatusChangedAsync(
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UngroupedTicket_IsNeverBroadcastToAnUnscopedAudience()
    {
        Baseline((42, 2));
        await _watcher.PollExternalStatusChangesAsync(default);
        _dashboard.Setup(d => d.GetTicketGroupAssignmentAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GlpiTicketGroupInfo?)null);
        Changes(new TicketChange(42, 6, 7, DateTime.UtcNow));

        await _watcher.PollExternalStatusChangesAsync(default);

        _notifications.Verify(n => n.NotifyExternalTicketStatusChangedAsync(
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }
}
