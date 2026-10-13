namespace GlpiTicketManager.Api.Auth;

/// <summary>
/// Strongly-typed binding for the "Jwt" configuration section.
/// This is the API's own token, fully independent from GLPI sessions.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "GlpiTicketManager.Api";

    public string Audience { get; set; } = "GlpiTicketManager.Frontend";

    /// <summary>HMAC-SHA256 signing key. Must be at least 32 bytes.</summary>
    public string Key { get; set; } = string.Empty;

    public int ExpiryMinutes { get; set; } = 60;
}
