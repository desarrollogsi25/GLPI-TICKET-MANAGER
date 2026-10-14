namespace GlpiTicketManager.Domain.Entities;

public sealed class AppSetting
{
    public string Key { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public DateTime UpdatedAt { get; init; }
    public int? UpdatedBy { get; init; }
}
