using System.Security.Claims;
using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Domain.Enums;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class TicketHubAuthorizationTests
{
    private static TicketHub RequesterHub(ITicketAccessPolicy policy,
        Mock<IDbConnectionFactory> database, Mock<IGroupManager> groups)
    {
        var context = new Mock<HubCallerContext>();
        context.SetupGet(c => c.ConnectionId).Returns("requester-connection");
        context.SetupGet(c => c.User).Returns(new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, "19"),
            new Claim("role", "solicitante"),
        ], "test")));
        groups.Setup(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return new TicketHub(policy, database.Object, NullLogger<TicketHub>.Instance)
        {
            Context = context.Object,
            Groups = groups.Object,
        };
    }

    [Fact]
    public async Task RequesterConnectsToPersonalNotificationsWithoutTechnicalGroups()
    {
        var database = new Mock<IDbConnectionFactory>(MockBehavior.Strict);
        var groups = new Mock<IGroupManager>();
        using var hub = RequesterHub(new Mock<ITicketAccessPolicy>().Object, database, groups);

        await hub.OnConnectedAsync();

        groups.Verify(g => g.AddToGroupAsync("requester-connection", "user-19",
            It.IsAny<CancellationToken>()), Times.Once);
        groups.VerifyNoOtherCalls();
        database.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RequesterCannotExplicitlySubscribeEvenWhenTheyBelongToTechnicalGroup()
    {
        var tickets = new Mock<ITicketRepository>();
        tickets.Setup(t => t.GetGroupIdsForUserAsync(19, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { 1 });
        var policy = new TicketAccessPolicy(tickets.Object, NullLogger<TicketAccessPolicy>.Instance);
        var database = new Mock<IDbConnectionFactory>(MockBehavior.Strict);
        var groups = new Mock<IGroupManager>();
        using var hub = RequesterHub(policy, database, groups);

        await hub.SubscribeToGroup(1);

        groups.VerifyNoOtherCalls();
        database.VerifyNoOtherCalls();
        tickets.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(0, AppRole.Admin, 1)]
    [InlineData(19, AppRole.Admin, 0)]
    [InlineData(19, (AppRole)99, 1)]
    public async Task InvalidQueueIdentityOrRoleIsDenied(int userId, AppRole role, int groupId)
    {
        var tickets = new Mock<ITicketRepository>(MockBehavior.Strict);
        var policy = new TicketAccessPolicy(tickets.Object, NullLogger<TicketAccessPolicy>.Instance);

        Assert.False(await policy.CanViewGroupQueueAsync(userId, role, groupId));
        tickets.VerifyNoOtherCalls();
    }
}
