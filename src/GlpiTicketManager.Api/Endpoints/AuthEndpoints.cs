using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Api.RateLimiting;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Api.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("Exchange credentials for a JWT issued by this API")
            .AllowAnonymous()
            .RequireRateLimiting(RateLimitPolicies.Login)
            .Produces<LoginResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status429TooManyRequests);

        group.MapGet("/me", Me)
            .WithName("GetCurrentUser")
            .WithSummary("Return the profile encoded in the current JWT")
            .RequireAuthorization()
            .Produces<UserProfileDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/logout", Logout)
            .WithName("Logout")
            .WithSummary("Revoke the current JWT token")
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized);

        return group;
    }

    private static async Task<IResult> Login(
        LoginRequest request,
        IAuthService authService,
        IJwtTokenService tokenService,
        CancellationToken cancellationToken)
    {
        var user = await authService.AuthenticateAsync(request, cancellationToken);

        if (user is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Invalid credentials",
                detail: "The username or password is incorrect.");
        }

        var (token, expiresAt) = tokenService.CreateToken(user);

        var profile = new UserProfileDto(
            user.UserId,
            user.Username,
            user.DisplayName,
            user.ProfileId,
            user.DefaultEntityId,
            user.Role.ToClaimValue());

        return Results.Ok(new LoginResponse(token, "Bearer", expiresAt, profile));
    }

    private static IResult Me(ClaimsPrincipal principal) => Results.Ok(principal.ToUserProfile());

    private static async Task<IResult> Logout(
        IRevokedTokenRepository revokedRepo,
        ClaimsPrincipal principal,
        ILogger<Program> logger,
        CancellationToken ct)
    {
        // Extraer jti del JWT
        var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value
               ?? principal.FindFirst("jti")?.Value;
        if (string.IsNullOrEmpty(jti))
        {
            logger.LogWarning("Logout: token has no jti claim");
            return Results.Unauthorized();
        }

        // Extraer sub (userId)
        var userId = principal.GetUserId();
        if (userId is null)
        {
            logger.LogWarning("Logout: invalid sub claim");
            return Results.Unauthorized();
        }

        // Extraer exp
        var expStr = principal.FindFirst(JwtRegisteredClaimNames.Exp)?.Value
                  ?? principal.FindFirst("exp")?.Value;
        if (!long.TryParse(expStr, out var expUnix))
        {
            logger.LogWarning("Logout: invalid exp claim");
            return Results.Unauthorized();
        }

        var expiresAt = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;

        await revokedRepo.RevokeAsync(jti, userId.Value, expiresAt, ct);
        logger.LogInformation("Token revoked. jti={Jti}, userId={UserId}", jti, userId);

        return Results.NoContent();
    }
}

