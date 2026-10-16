using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Dtos.Auth;

namespace GlpiTicketManager.Application.Services;

/// <summary>
/// Validates frontend credentials against GLPI's user table.
/// The API only ever mints its own JWT; it never returns a GLPI session token.
/// </summary>
public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUserRoleResolver _roleResolver;

    public AuthService(
        IUserRepository users,
        IPasswordHasher passwordHasher,
        IUserRoleResolver roleResolver)
    {
        _users = users;
        _passwordHasher = passwordHasher;
        _roleResolver = roleResolver;
    }

    public async Task<Models.AuthenticatedUser?> AuthenticateAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return null;
        }

        var user = await _users.GetByNameAsync(request.Username.Trim(), cancellationToken);

        if (user is null || !user.IsActive || user.IsDeleted)
        {
            return null;
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        var displayName = string.IsNullOrWhiteSpace(user.DisplayName) ? user.Name : user.DisplayName;
        var role = await _roleResolver.ResolveAsync(user.Id, cancellationToken);

        return new Models.AuthenticatedUser(
            user.Id,
            user.Name,
            displayName,
            user.ProfileId,
            user.DefaultEntityId,
            role);
    }
}
