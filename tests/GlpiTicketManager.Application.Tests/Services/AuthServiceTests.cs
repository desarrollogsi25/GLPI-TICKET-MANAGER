using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Services;
using GlpiTicketManager.Domain.Entities;
using Moq;
using FluentAssertions;
using Xunit;

namespace GlpiTicketManager.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly AuthService _svc;

    public AuthServiceTests()
    {
        _svc = new AuthService(_users.Object, _hasher.Object);
    }

    private static UserAccount User(string name, bool active, bool deleted, string hash) =>
        new()
        {
            Id = 7,
            Name = name,
            RealName = name,
            FirstName = "Juan",
            PasswordHash = hash,
            IsActive = active,
            IsDeleted = deleted,
            ProfileId = 5,
            DefaultEntityId = 0,
        };

    [Fact]
    public async Task AuthenticateAsync_WhenCredentialsValid_ReturnsUser()
    {
        var user = User("tech1", true, false, "$2y$hash");
        _users.Setup(u => u.GetByNameAsync("tech1", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify("Pass1", "$2y$hash")).Returns(true);

        var result = await _svc.AuthenticateAsync(new LoginRequest { Username = "tech1", Password = "Pass1" }, CancellationToken.None);

        result.Should().NotBeNull();
        result!.UserId.Should().Be(7);
        result.Username.Should().Be("tech1");
    }

    [Fact]
    public async Task AuthenticateAsync_WhenUserNotFound_ReturnsNull()
    {
        _users.Setup(u => u.GetByNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync((UserAccount?)null);

        var result = await _svc.AuthenticateAsync(new LoginRequest { Username = "x", Password = "y" }, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task AuthenticateAsync_WhenPasswordIncorrect_ReturnsNull()
    {
        var user = User("tech1", true, false, "$2y$hash");
        _users.Setup(u => u.GetByNameAsync("tech1", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify("bad", "$2y$hash")).Returns(false);

        var result = await _svc.AuthenticateAsync(new LoginRequest { Username = "tech1", Password = "bad" }, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task AuthenticateAsync_WhenInactive_ReturnsNull()
    {
        var user = User("tech1", false, false, "$2y$hash");
        _users.Setup(u => u.GetByNameAsync("tech1", It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var result = await _svc.AuthenticateAsync(new LoginRequest { Username = "tech1", Password = "Pass1" }, CancellationToken.None);

        result.Should().BeNull();
    }
}
