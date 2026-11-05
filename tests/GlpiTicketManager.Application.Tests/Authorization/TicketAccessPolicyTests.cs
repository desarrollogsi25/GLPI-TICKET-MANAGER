using FluentAssertions;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace GlpiTicketManager.Application.Tests.Authorization;

public class TicketAccessPolicyTests
{
    private const int TechId = 16;
    private const int GroupId = 3;
    private const int TicketId = 1028;

    private readonly Mock<ITicketRepository> _repo = new();
    private readonly TicketAccessPolicy _policy;

    public TicketAccessPolicyTests()
    {
        _policy = new TicketAccessPolicy(_repo.Object, Mock.Of<ILogger<TicketAccessPolicy>>());
        _repo.Setup(r => r.IsUserAssignedToTicketAsync(TechId, TicketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _repo.Setup(r => r.GetGroupIdsForUserAsync(TechId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int> { GroupId });
        _repo.Setup(r => r.GetGroupIdsForTicketAsync(TicketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int> { GroupId });
    }

    [Theory]
    [InlineData(TicketStatus.New)]
    [InlineData(TicketStatus.Assigned)]
    public async Task Technician_CanViewUnassignedGroupTicket_InQueueStatuses(TicketStatus status)
    {
        // GLPI sets status 2 when a rule assigns the ticket to a group, before any
        // individual technician exists. Both queue statuses must stay viewable.
        _repo.Setup(r => r.GetByIdAsync(TicketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = TicketId, Status = (int)status });
        _repo.Setup(r => r.HasAssigneeAsync(TicketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var allowed = await _policy.CanViewAsync(TechId, AppRole.Technician, TicketId);

        allowed.Should().BeTrue();
    }

    [Fact]
    public async Task Technician_CannotViewGroupTicketAssignedToAnotherTechnician()
    {
        _repo.Setup(r => r.GetByIdAsync(TicketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = TicketId, Status = (int)TicketStatus.Assigned });
        _repo.Setup(r => r.HasAssigneeAsync(TicketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var allowed = await _policy.CanViewAsync(TechId, AppRole.Technician, TicketId);

        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task Technician_CannotViewUnassignedTicketOutsideQueueStatuses()
    {
        _repo.Setup(r => r.GetByIdAsync(TicketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = TicketId, Status = (int)TicketStatus.Planned });
        _repo.Setup(r => r.HasAssigneeAsync(TicketId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var allowed = await _policy.CanViewAsync(TechId, AppRole.Technician, TicketId);

        allowed.Should().BeFalse();
    }
}
