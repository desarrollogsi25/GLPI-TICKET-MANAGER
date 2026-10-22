using System.Text.Json.Serialization;

namespace GlpiTicketManager.Application.Dtos.Auth;

/// <summary>
/// Credentials sent by the frontend to obtain a JWT issued by this API.
/// </summary>
public sealed record LoginRequest
{
    [JsonPropertyName("username")]
    public string Username { get; init; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; init; } = string.Empty;
}
