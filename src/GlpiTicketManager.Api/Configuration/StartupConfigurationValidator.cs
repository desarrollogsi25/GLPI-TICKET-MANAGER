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
        if ((configuration[$"{JwtOptions.SectionName}:{nameof(JwtOptions.Key)}"] ?? string.Empty)
            .Length < MinimumSecretLength)
        {
            invalid.Add($"{JwtOptions.SectionName}:Key (mínimo {MinimumSecretLength} caracteres)");
        }

        if (invalid.Count > 0)
        {
            throw new InvalidOperationException(
                $"Configuración inválida: {string.Join("; ", invalid)}. {HelpMessage}");
        }
    }
}
