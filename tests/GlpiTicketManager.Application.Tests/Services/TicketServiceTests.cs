using System.Threading;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Services;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Moq;
using FluentAssertions;
using Xunit;

using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Application.Tests.Services;

public class TicketServiceTests
{
    private readonly Mock<ITicketRepository> _repo = new();
    private readonly Mock<IGlpiApiClient> _glpi = new();
    private readonly Mock<IAuditRepository> _audit = new();
    private readonly Mock<ITicketAccessPolicy> _accessPolicy = new();
    private readonly Mock<ITicketNotificationService> _notifications = new();
    private readonly Mock<ILogger<TicketService>> _logger = new();
    private readonly TicketService _svc;

    public TicketServiceTests()
    {
        _svc = new TicketService(_repo.Object, _glpi.Object, _audit.Object, _accessPolicy.Object, _notifications.Object, _logger.Object);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenTicketIdInvalid_Throws()
    {
        var act = async () => await _svc.UpdateStatusAsync(0, 2, 7, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusInvalid_Throws400()
    {
        var act = async () => await _svc.UpdateStatusAsync(1, 99, 7, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusSolvedAndNoSolution_Throws422()
    {
        _accessPolicy.Setup(a => a.CanModifyStatusAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _repo.Setup(r => r.SolutionExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var act = async () => await _svc.UpdateStatusAsync(10, (int)TicketStatus.Solved, 7, CancellationToken.None);

        await act.Should().ThrowAsync<UnprocessableEntityException>();
        _glpi.Verify(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _audit.Verify(a => a.LogAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusSolvedAndHasSolution_Succeeds()
    {
        _accessPolicy.Setup(a => a.CanModifyStatusAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _repo.Setup(r => r.SolutionExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _glpi.Setup(g => g.UpdateTicketStatusAsync(10, (int)TicketStatus.Solved, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svc.UpdateStatusAsync(10, (int)TicketStatus.Solved, 7, CancellationToken.None);

        result.Should().BeTrue();
        _glpi.Verify(g => g.UpdateTicketStatusAsync(10, (int)TicketStatus.Solved, It.IsAny<CancellationToken>()), Times.Once);
        _audit.Verify(a => a.LogAsync(7, "resolve", 10, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusNotSolved_DoesNotCheckSolution()
    {
        _accessPolicy.Setup(a => a.CanModifyStatusAsync(7, It.IsAny<AppRole>(), 5, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _glpi.Setup(g => g.UpdateTicketStatusAsync(5, 2, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svc.UpdateStatusAsync(5, 2, 7, CancellationToken.None);

        result.Should().BeTrue();
        _repo.Verify(r => r.SolutionExistsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _glpi.Verify(g => g.UpdateTicketStatusAsync(5, 2, It.IsAny<CancellationToken>()), Times.Once);
        _audit.Verify(a => a.LogAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ClaimAsync_WhenTicketNotFound_Throws404()
    {
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync((Ticket?)null);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task ClaimAsync_WhenStatusIsNotNew_Throws409()
    {
        var ticket = new Ticket { Id = 10, Status = (int)TicketStatus.Assigned };
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(ticket);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("El ticket debe estar en estado 'Nuevo' (1) y sin asignar.");
    }

    [Fact]
    public async Task ClaimAsync_WhenAlreadyAssigned_Throws409()
    {
        var ticket = new Ticket { Id = 10, Status = (int)TicketStatus.New };
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(ticket);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { new TicketUser { TicketId = 10, UserId = 99, Type = (int)TicketUserType.Assigned } });

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("El ticket ya está asignado a un técnico.");
    }

    [Fact]
    public async Task ClaimAsync_WhenUserNotInGroup_ThrowsForbidden()
    {
        var ticket = new Ticket { Id = 10, Status = (int)TicketStatus.New };
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(ticket);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketUser>());
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task ClaimAsync_WhenAllValid_ReturnsUpdatedTicket()
    {
        var ticketBefore = new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.New };
        var ticketAfter = new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.Assigned };

        _repo.SetupSequence(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ticketBefore)
            .ReturnsAsync(ticketAfter);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketUser>());
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _repo.Setup(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _svc.ClaimAsync(10, 7, CancellationToken.None);

        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        result.Status.Should().Be((int)TicketStatus.Assigned);
        _repo.Verify(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>()), Times.Once);
        _audit.Verify(a => a.LogAsync(7, "claim", 10, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ClaimAsync_WhenAuditFails_StillSucceeds()
    {
        var ticketBefore = new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.New };
        var ticketAfter = new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.Assigned };

        _repo.SetupSequence(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ticketBefore)
            .ReturnsAsync(ticketAfter);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketUser>());
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _repo.Setup(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _audit.Setup(a => a.LogAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _svc.ClaimAsync(10, 7, CancellationToken.None);

        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        result.Status.Should().Be((int)TicketStatus.Assigned);
        _repo.Verify(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task IsUserInTicketGroupAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.IsUserInTicketGroupAsync(10, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _svc.IsUserInTicketGroupAsync(10, 7, CancellationToken.None);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task SolutionExistsAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.SolutionExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _svc.SolutionExistsAsync(10, CancellationToken.None);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task SolutionInsertAsync_DelegatesToGlpiApiClient()
    {
        const string validSolution = "solucion valida para prueba";
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new Ticket { Id = 10 });
        _accessPolicy.Setup(a => a.CanAddSolutionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _glpi.Setup(g => g.CreateSolutionAsync(10, validSolution, It.IsAny<CancellationToken>())).ReturnsAsync(99);

        var result = await _svc.SolutionInsertAsync(10, validSolution, 7, CancellationToken.None);

        result.Should().Be(99);
        _glpi.Verify(g => g.CreateSolutionAsync(10, validSolution, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetGroupIdsForUserAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.GetGroupIdsForUserAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { 1 });

        var result = await _svc.GetGroupIdsForUserAsync(7, CancellationToken.None);

        result.Should().Equal(1);
    }

    [Fact]
    public async Task GetUnassignedByGroupAsync_WhenGroupIdIsZero_ReturnsEmptyPageWithoutAuthorizationCheck()
    {
        var result = await _svc.GetUnassignedByGroupAsync(0, 7, AppRole.Technician, 20, 0, CancellationToken.None);

        result.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
        result.Limit.Should().Be(20);
        _accessPolicy.Verify(
            a => a.CanViewGroupQueueAsync(It.IsAny<int>(), It.IsAny<AppRole>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _repo.Verify(r => r.GetUnassignedByGroupAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetUnassignedByGroupAsync_WhenUserHasNoGroups_ReturnsEmptyPageInsteadOfForbidden()
    {
        _accessPolicy.Setup(a => a.CanViewGroupQueueAsync(7, It.IsAny<AppRole>(), 3, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.GetGroupIdsForUserAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(Array.Empty<int>());

        var result = await _svc.GetUnassignedByGroupAsync(3, 7, AppRole.Technician, 20, 0, CancellationToken.None);

        result.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    [Fact]
    public async Task GetUnassignedByGroupAsync_WhenUserBelongsToAnotherGroup_StillThrowsForbidden()
    {
        _accessPolicy.Setup(a => a.CanViewGroupQueueAsync(7, It.IsAny<AppRole>(), 2, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.GetGroupIdsForUserAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { 1 });

        var act = async () => await _svc.GetUnassignedByGroupAsync(2, 7, AppRole.Technician, 20, 0, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("User 7 cannot view queue for group 2");
    }
}
