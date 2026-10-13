namespace GlpiTicketManager.Api.RateLimiting;

/// <summary>Names of the rate-limiting policies registered by the API.</summary>
public static class RateLimitPolicies
{
    /// <summary>Strict policy applied to credential endpoints.</summary>
    public const string Login = "login";
}
