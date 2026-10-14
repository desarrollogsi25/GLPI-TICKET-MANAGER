using System.Threading;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Services;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Moq;
using FluentAssertions;
using Xunit;

namespace GlpiTicketManager.Application.Tests.Services;

public class TicketServiceTests
{
    private readonly Mock<ITicketRepository> _repo = new();
    private readonly Mock<IGlpiApiClient> _glpi = new();
    private readonly TicketService _svc;

    public TicketServiceTests()
    {
        _svc = new TicketService(_repo.Object, _glpi.Object);
    }

    private static CreateTicketRequest ValidCreate() => new()
    {
        Title = "Prueba",
        Content = "Desc",
        Type = 1,
        Urgency = 3,
        Impact = 3,
    };

    [Fact]
    public async Task CreateAsync_ValidatesTitle()
    {
        var req = new CreateTicketRequest { Title = "   " };
        var act = async () => await _svc.CreateAsync(req, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreateAsync_DelegatesToGlpiClient_AndReturnsId()
    {
        var req = ValidCreate();
        _glpi.Setup(g => g.CreateTicketAsync(req, It.IsAny<CancellationToken>())).ReturnsAsync(42);

        var id = await _svc.CreateAsync(req, CancellationToken.None);

        id.Should().Be(42);
        _glpi.Verify(g => g.CreateTicketAsync(req, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenTicketIdInvalid_Throws()
    {
        var act = async () => await _svc.UpdateStatusAsync(0, 2, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusInvalid_Throws400()
    {
        var act = async () => await _svc.UpdateStatusAsync(1, 99, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusSolvedAndNoSolution_Throws422()
    {
        _repo.Setup(r => r.SolutionExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var act = async () => await _svc.UpdateStatusAsync(10, (int)TicketStatus.Solved, CancellationToken.None);

        await act.Should().ThrowAsync<UnprocessableEntityException>();
        _glpi.Verify(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusSolvedAndHasSolution_Succeeds()
    {
        _repo.Setup(r => r.SolutionExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _glpi.Setup(g => g.UpdateTicketStatusAsync(10, (int)TicketStatus.Solved, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svc.UpdateStatusAsync(10, (int)TicketStatus.Solved, CancellationToken.None);

        result.Should().BeTrue();
        _glpi.Verify(g => g.UpdateTicketStatusAsync(10, (int)TicketStatus.Solved, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusNotSolved_DoesNotCheckSolution()
    {
        _glpi.Setup(g => g.UpdateTicketStatusAsync(5, 2, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svc.UpdateStatusAsync(5, 2, CancellationToken.None);

        result.Should().BeTrue();
        _repo.Verify(r => r.SolutionExistsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _glpi.Verify(g => g.UpdateTicketStatusAsync(5, 2, It.IsAny<CancellationToken>()), Times.Once);
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
    public async Task ClaimAsync_WhenUserNotInGroup_Throws409()
    {
        var ticket = new Ticket { Id = 10, Status = (int)TicketStatus.New };
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(ticket);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketUser>());
        _repo.Setup(r => r.IsUserInTicketGroupAsync(10, 7, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("El usuario no pertenece al grupo del ticket.");
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
        _repo.Setup(r => r.IsUserInTicketGroupAsync(10, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _repo.Setup(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);

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
    public async Task SolutionInsertAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.SolutionInsertAsync(10, "sol", 7, It.IsAny<CancellationToken>())).ReturnsAsync(99);

        var result = await _svc.SolutionInsertAsync(10, "sol", 7, CancellationToken.None);

        result.Should().Be(99);
    }

    [Fact]
    public async Task GetGroupIdsForUserAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.GetGroupIdsForUserAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { 1 });

        var result = await _svc.GetGroupIdsForUserAsync(7, CancellationToken.None);

        result.Should().Equal(1);
    }
}
