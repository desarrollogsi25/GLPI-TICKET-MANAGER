using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    public static int? GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(value, out var userId) ? userId : null;
    }

    public static string? GetUsername(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.Name)
        ?? principal.FindFirstValue(JwtRegisteredClaimNames.UniqueName);

    public static int? GetProfileId(this ClaimsPrincipal principal) =>
        int.TryParse(principal.FindFirstValue(JwtClaimNames.ProfileId), out var profileId)
            ? profileId
            : null;

    public static int? GetEntityId(this ClaimsPrincipal principal) =>
        int.TryParse(principal.FindFirstValue(JwtClaimNames.EntityId), out var entityId)
            ? entityId
            : null;

    public static AppRole GetRole(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirst("role")?.Value
            ?? principal.FindFirstValue(ClaimTypes.Role);
        return AppRoleExtensions.FromClaimValue(value) ?? AppRole.Technician;
    }

    public static UserProfileDto ToUserProfile(this ClaimsPrincipal principal) => new(
        principal.GetUserId() ?? 0,
        principal.GetUsername() ?? string.Empty,
        principal.FindFirstValue(JwtClaimNames.DisplayName) ?? string.Empty,
        principal.GetProfileId(),
        principal.GetEntityId(),
        principal.GetRole().ToClaimValue());
}
