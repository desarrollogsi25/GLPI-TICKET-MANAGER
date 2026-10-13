using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GlpiTicketManager.Application.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace GlpiTicketManager.Api.Auth;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateToken(AuthenticatedUser user);
}

/// <summary>
/// Mints the API's own JWT for the frontend.
/// </summary>
public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;
    private readonly SigningCredentials _signingCredentials;
    private readonly JwtSecurityTokenHandler _handler = new();

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        _signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
    }

    public (string Token, DateTime ExpiresAtUtc) CreateToken(AuthenticatedUser user)
    {
        var issuedAt = DateTime.UtcNow;
        var expiresAt = issuedAt.AddMinutes(_options.ExpiryMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(ClaimTypes.Name, user.Username),
            new(JwtClaimNames.DisplayName, user.DisplayName)
        };

        if (user.ProfileId is int profileId)
        {
            claims.Add(new Claim(JwtClaimNames.ProfileId, profileId.ToString()));
        }

        if (user.DefaultEntityId is int entityId)
        {
            claims.Add(new Claim(JwtClaimNames.EntityId, entityId.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: issuedAt,
            expires: expiresAt,
            signingCredentials: _signingCredentials);

        return (_handler.WriteToken(token), expiresAt);
    }
}

/// <summary>Custom claim names used by the API.</summary>
public static class JwtClaimNames
{
    public const string DisplayName = "display_name";
    public const string ProfileId = "profile_id";
    public const string EntityId = "entity_id";
}
