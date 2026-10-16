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
}
