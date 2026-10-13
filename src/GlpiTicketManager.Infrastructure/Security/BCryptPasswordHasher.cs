using GlpiTicketManager.Application.Abstractions;

namespace GlpiTicketManager.Infrastructure.Security;

/// <summary>
/// Verifies GLPI password hashes. GLPI uses bcrypt (<c>$2y$</c>, the PHP variant of <c>$2a$</c>).
/// </summary>
public sealed class BCryptPasswordHasher : IPasswordHasher
{
    public bool Verify(string password, string passwordHash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(passwordHash))
        {
            return false;
        }

        // $2y$ and $2a$ are the same algorithm; normalize so any bcrypt implementation accepts it.
        var normalized = passwordHash.StartsWith("$2y$", StringComparison.Ordinal)
            ? string.Concat("$2a$", passwordHash.AsSpan(4))
            : passwordHash;

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, normalized);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}
