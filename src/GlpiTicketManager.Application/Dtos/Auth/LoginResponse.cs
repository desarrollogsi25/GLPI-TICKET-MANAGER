namespace GlpiTicketManager.Application.Dtos.Auth;

/// <summary>
/// A JWT issued by this API (never GLPI's session token) plus its metadata.
/// </summary>
public sealed record LoginResponse(
    string AccessToken,
    string TokenType,
    DateTime ExpiresAtUtc,
    UserProfileDto User);

public sealed record UserProfileDto(
    int UserId,
    string Username,
    string DisplayName,
    int? ProfileId,
    int? DefaultEntityId,
    string Role = "technician");
