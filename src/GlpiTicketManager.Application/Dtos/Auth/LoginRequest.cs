namespace GlpiTicketManager.Application.Dtos.Auth;

/// <summary>
/// Credentials sent by the frontend to obtain a JWT issued by this API.
/// </summary>
public sealed record LoginRequest
{
    public string Username { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;
}
