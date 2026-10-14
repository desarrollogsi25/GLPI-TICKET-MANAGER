namespace GlpiTicketManager.Domain.Entities;

public sealed class UserPreference
{
    public int UserId { get; init; }
    public string Prefs { get; init; } = "{}";
    public DateTime UpdatedAt { get; init; }
}
