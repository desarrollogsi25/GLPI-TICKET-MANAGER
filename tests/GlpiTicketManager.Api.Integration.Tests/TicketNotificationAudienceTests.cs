using FluentAssertions;
using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Api.Notifications;
using GlpiTicketManager.Application.Abstractions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class TicketNotificationAudienceTests
{
    private readonly Mock<ITicketRepository> _tickets = new();
    private readonly Mock<IHubClients> _clients = new(MockBehavior.Strict);
    private readonly Mock<IClientProxy> _proxy = new();
    private readonly List<string[]> _targets = [];
    private readonly TicketNotificationService _service;

    public TicketNotificationAudienceTests()
    {
        var hub = new Mock<IHubContext<TicketHub>>();
        hub.SetupGet(h => h.Clients).Returns(_clients.Object);
        _clients.Setup(c => c.Groups(It.IsAny<IReadOnlyList<string>>()))
            .Callback<IReadOnlyList<string>>(groups => _targets.Add(groups.ToArray()))
            .Returns(_proxy.Object);
        _tickets.Setup(t => t.GetGroupIdsForTicketAsync(11, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { 1 });
        _service = new TicketNotificationService(hub.Object, _tickets.Object,
            NullLogger<TicketNotificationService>.Instance);
    }

    [Theory]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    public async Task EveryStatus_RefreshesAssigneeAndScopedSupervisors(int status)
    {
        await _service.NotifyTicketStatusChangedAsync(11, status, 7);
        _targets.Should().ContainSingle().Which.Should().BeEquivalentTo("user-7", "supervisors-1");
        _proxy.Verify(p => p.SendCoreAsync("TicketStatusChanged", It.IsAny<object?[]>(),
            It.IsAny<CancellationToken>()), Times.Once);
        _clients.VerifyGet(c => c.All, Times.Never);
    }

    [Fact]
    public async Task FailedGroupLookup_NeverBroadcastsToUnrelatedSessions()
    {
        _tickets.Setup(t => t.GetGroupIdsForTicketAsync(11, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Fixture DB failure"));
        await _service.NotifyTicketCreatedAsync(11, null);
        await _service.NotifyTicketStatusChangedAsync(11, 5, null);
        await _service.NotifySolutionAddedAsync(11, 0);
        _targets.Should().BeEmpty();
        _proxy.VerifyNoOtherCalls();
        _clients.VerifyGet(c => c.All, Times.Never);
    }

    [Fact]
    public async Task FailedGroupLookup_CanStillNotifyKnownAssigneeOnly()
    {
        _tickets.Setup(t => t.GetGroupIdsForTicketAsync(11, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Fixture DB failure"));
        await _service.NotifyTicketStatusChangedAsync(11, 4, 7);
        _targets.Should().ContainSingle().Which.Should().Equal("user-7");
        _clients.VerifyGet(c => c.All, Times.Never);
    }

    [Fact]
    public async Task Creation_UsesOneSendAcrossOverlappingAuthorizedGroups()
    {
        await _service.NotifyTicketCreatedAsync(11, 1);
        _targets.Should().ContainSingle().Which.Should().BeEquivalentTo("group-1", "supervisors-1");
        _proxy.Verify(p => p.SendCoreAsync("TicketCreated", It.IsAny<object?[]>(),
            It.IsAny<CancellationToken>()), Times.Once);
        _clients.VerifyGet(c => c.All, Times.Never);
    }
}
