namespace GlpiTicketManager.Infrastructure.Persistence;

/// <summary>
/// Strongly-typed binding for the "Database" configuration section.
/// </summary>
public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    /// <summary>MariaDB connection string (read-only account is enough for the read side).</summary>
    public string ConnectionString { get; set; } = string.Empty;

    public int CommandTimeoutSeconds { get; set; } = 30;
}
