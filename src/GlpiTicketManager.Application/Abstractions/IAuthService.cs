using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Models;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Authenticates users of the frontend. Issues no GLPI session: the API mints its own JWT.
/// </summary>
public interface IAuthService
{
    Task<AuthenticatedUser?> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken);
}
