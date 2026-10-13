namespace GlpiTicketManager.Application.Models;

/// <summary>
/// Identity resolved during login, before a JWT is minted.
/// </summary>
public sealed record AuthenticatedUser(
    int UserId,
    string Username,
    string DisplayName,
    int? ProfileId,
    int? DefaultEntityId);
