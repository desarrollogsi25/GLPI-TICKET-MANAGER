namespace GlpiTicketManager.Domain.Entities;

public sealed class RevokedToken
{
    public string Jti { get; init; } = string.Empty;
    public int UserId { get; init; }
    public DateTime RevokedAt { get; init; }
    public DateTime ExpiresAt { get; init; }
}
