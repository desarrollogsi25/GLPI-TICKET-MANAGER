namespace GlpiTicketManager.Api.RateLimiting;

/// <summary>Names of the rate-limiting policies registered by the API.</summary>
public static class RateLimitPolicies
{
    /// <summary>Strict policy applied to credential endpoints.</summary>
    public const string Login = "login";

    /// <summary>Per-user rate limit for authenticated endpoints (100 req/min).</summary>
    public const string PerUser = "per-user";

    /// <summary>Token bucket rate limit for expensive endpoints (20 tokens/min).</summary>
    public const string Expensive = "expensive";

    /// <summary>Per-source limit for the anonymous GLPI webhook endpoint.</summary>
    public const string GlpiWebhook = "glpi-webhook";
}

public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimiting";

    public int ExpensiveTokenLimit { get; set; } = 20;
    public int ExpensiveTokensPerPeriod { get; set; } = 1;
    public int ExpensiveReplenishmentSeconds { get; set; } = 3;
    public int PerUserRequestLimit { get; set; } = 100;
    public int LoginAttemptLimit { get; set; } = 5;
    public int GlpiWebhookRequestLimit { get; set; } = 120;
}
