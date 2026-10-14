using System.Threading;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Services;
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
    public async Task UpdateStatusAsync_WhenStatusInvalid_Throws()
    {
        var act = async () => await _svc.UpdateStatusAsync(1, 99, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_OnSuccess_DelegatesToGlpiAndReturnsTrue()
    {
        _repo.Setup(r => r.SolutionExistsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _glpi.Setup(g => g.UpdateTicketStatusAsync(5, 2, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svc.UpdateStatusAsync(5, 2, CancellationToken.None);

        result.Should().BeTrue();
        _glpi.Verify(g => g.UpdateTicketStatusAsync(5, 2, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ClaimAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _svc.ClaimAsync(10, 7, 7, CancellationToken.None);

        result.Should().BeTrue();
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
