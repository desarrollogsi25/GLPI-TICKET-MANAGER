namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Verifies a clear-text password against a stored hash.
/// Implemented in the infrastructure layer (BCrypt, GLPI's default scheme).
/// </summary>
public interface IPasswordHasher
{
    bool Verify(string password, string passwordHash);
}
