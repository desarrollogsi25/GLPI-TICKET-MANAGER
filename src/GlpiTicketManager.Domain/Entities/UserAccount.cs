namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// A GLPI user read from the database (<c>glpi_users</c>) and used for authentication.
/// </summary>
public sealed class UserAccount
{
    public int Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string? RealName { get; init; }

    public string? FirstName { get; init; }

    /// <summary>BCrypt hash stored in <c>glpi_users.password</c>.</summary>
    public string PasswordHash { get; init; } = string.Empty;

    public bool IsActive { get; init; }

    public bool IsDeleted { get; init; }

    public int? ProfileId { get; init; }

    public int? DefaultEntityId { get; init; }

    /// <summary>GLPI authentication backend (1 = local, others = external).</summary>
    public int Auth { get; init; }

    public string DisplayName =>
        string.Join(' ', new[] { FirstName, RealName }.Where(p => !string.IsNullOrWhiteSpace(p)));
}
