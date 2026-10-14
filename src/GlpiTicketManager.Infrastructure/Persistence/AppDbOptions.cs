namespace GlpiTicketManager.Infrastructure.Persistence;

public sealed class AppDbOptions
{
    public const string SectionName = "AppDb";
    public string ConnectionString { get; set; } = string.Empty;
    public int CommandTimeoutSeconds { get; set; } = 30;
}
