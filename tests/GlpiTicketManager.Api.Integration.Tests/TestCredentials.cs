using System.Security.Cryptography;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Test-only credentials created afresh for each test process. No credential,
/// token, signing key or database password is checked into source control.
/// </summary>
internal static class TestCredentials
{
    private static string NewValue() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    internal static readonly string Tech1 = NewValue();
    internal static readonly string Tech2 = NewValue();
    internal static readonly string Admin = NewValue();
    internal static readonly string Supervisor = NewValue();
    internal static readonly string Solicitante = NewValue();
    internal static readonly string User1 = NewValue();
    internal static readonly string DbPassword = NewValue();
    internal static readonly string AppToken = NewValue();
    internal static readonly string UserToken = NewValue();
    internal static readonly string JwtKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
    // Base64 has a wider alphabet than hex, satisfying the validator's
    // minimum of 16 distinct characters without probabilistic test failures.
    internal static readonly string WebhookSecret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
}
