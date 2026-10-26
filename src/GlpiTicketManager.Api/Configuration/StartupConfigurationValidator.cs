using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Infrastructure.Glpi;
using GlpiTicketManager.Infrastructure.Persistence;

namespace GlpiTicketManager.Api.Configuration;

/// <summary>
/// Fail-fast validation of the secrets/configuration required to boot the API.
/// If any check fails the API must NOT start (ISO 27001: no silent fallback to
/// weak or placeholder credentials).
/// </summary>
public static class StartupConfigurationValidator
{
    private const int MinimumSecretLength = 32;

    private const string HelpMessage = "Revisa docs/12-security/secrets.md para los pasos.";

    /// <summary>Default/placeholder DB passwords that must never reach production.</summary>
    private static readonly string[] ForbiddenDbPasswords = { "Password=glpi", "Password=changeme" };

    private static readonly string[] ForbiddenAppDbPasswords = { "Password=placeholder", "Password=changeme" };

    private static readonly string[] ForbiddenJwtKeys =
    {
        "dev-only-change-me-in-production-32chars-min",
        "dev-only-signing-key-change-me-32bytes-min!!",
        "dev-only-",
        "changeme",
        "12345678901234567890123456789012",
        "secret",
        "placeholder"
    };

    private static readonly string[] ForbiddenWebhookSecrets =
    {
        "glpi-webhook-secret-token-32-chars-minimum!!",
        "changeme",
        "12345678901234567890123456789012",
        "secret",
        "placeholder",
        "default-webhook-secret"
    };

    public static void Validate(IConfiguration configuration)
    {
        var invalid = new List<string>();

        // (a) Database connection string must exist and not use a placeholder password.
        var connectionString =
            configuration[$"{DatabaseOptions.SectionName}:{nameof(DatabaseOptions.ConnectionString)}"]
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            invalid.Add($"{DatabaseOptions.SectionName}:ConnectionString (vacío)");
        }
        else if (ForbiddenDbPasswords.Any(p => connectionString.Contains(p, StringComparison.OrdinalIgnoreCase)))
        {
            invalid.Add($"{DatabaseOptions.SectionName}:ConnectionString (contraseña por defecto)");
        }

        // (a2) AppDb (PostgreSQL) connection string validation.
        var appDbConnectionString =
            configuration[$"{AppDbOptions.SectionName}:{nameof(AppDbOptions.ConnectionString)}"]
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(appDbConnectionString))
        {
            invalid.Add($"{AppDbOptions.SectionName}:ConnectionString (vacío)");
        }
        else
        {
            if (ForbiddenAppDbPasswords.Any(p => appDbConnectionString.Contains(p, StringComparison.OrdinalIgnoreCase)))
            {
                invalid.Add($"{AppDbOptions.SectionName}:ConnectionString (contraseña placeholder)");
            }

            if (!appDbConnectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase))
            {
                invalid.Add($"{AppDbOptions.SectionName}:ConnectionString (formato inválido, falta Host=)");
            }
        }

        // (b) GLPI application token.
        if ((configuration[$"{GlpiOptions.SectionName}:{nameof(GlpiOptions.AppToken)}"] ?? string.Empty)
            .Length < MinimumSecretLength)
        {
            invalid.Add($"{GlpiOptions.SectionName}:AppToken (mínimo {MinimumSecretLength} caracteres)");
        }

        // (c) GLPI user token.
        if ((configuration[$"{GlpiOptions.SectionName}:{nameof(GlpiOptions.UserToken)}"] ?? string.Empty)
            .Length < MinimumSecretLength)
        {
            invalid.Add($"{GlpiOptions.SectionName}:UserToken (mínimo {MinimumSecretLength} caracteres)");
        }

        // (d) JWT signing key.
        var jwtKey = configuration[$"{JwtOptions.SectionName}:{nameof(JwtOptions.Key)}"] ?? string.Empty;
        if (jwtKey.Length < MinimumSecretLength)
        {
            invalid.Add($"{JwtOptions.SectionName}:Key (mínimo {MinimumSecretLength} caracteres)");
        }
        else if (ForbiddenJwtKeys.Any(k => jwtKey.StartsWith(k, StringComparison.OrdinalIgnoreCase) || jwtKey.Equals(k, StringComparison.OrdinalIgnoreCase)))
        {
            invalid.Add($"{JwtOptions.SectionName}:Key (uses a known development value. Generate a new random key)");
        }
        else if (jwtKey.Distinct().Count() < 16)
        {
            invalid.Add($"{JwtOptions.SectionName}:Key (baja entropía: requiere al menos 16 caracteres distintos)");
        }

        // (e) GLPI Webhook secret.
        var webhookSecret = configuration["GlpiWebhook:Secret"] ?? string.Empty;
        if (webhookSecret.Length < MinimumSecretLength)
        {
            invalid.Add($"GlpiWebhook:Secret (mínimo {MinimumSecretLength} caracteres)");
        }
        else if (ForbiddenWebhookSecrets.Any(s => webhookSecret.Equals(s, StringComparison.OrdinalIgnoreCase)))
        {
            invalid.Add("GlpiWebhook:Secret (valor por defecto o inseguro)");
        }

        if (invalid.Count > 0)
        {
            throw new InvalidOperationException(
                $"Configuración inválida: {string.Join("; ", invalid)}. {HelpMessage}");
        }
    }
}
