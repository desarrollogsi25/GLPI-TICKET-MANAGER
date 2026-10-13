namespace GlpiTicketManager.Infrastructure.Glpi;

/// <summary>
/// Strongly-typed binding for the "GlpiApi" configuration section.
/// </summary>
public sealed class GlpiOptions
{
    public const string SectionName = "GlpiApi";

    /// <summary>Base address including <c>apirest.php</c>, e.g. http://glpi/apirest.php/</summary>
    public string BaseUrl { get; set; } = "http://localhost:8081/apirest.php/";

    /// <summary>Application token (Setup &gt; General &gt; API).</summary>
    public string AppToken { get; set; } = string.Empty;

    /// <summary>User token of a dedicated API account.</summary>
    public string UserToken { get; set; } = string.Empty;

    public int TimeoutSeconds { get; set; } = 30;
}
