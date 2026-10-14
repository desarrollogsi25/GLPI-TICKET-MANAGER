namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// A technician group read from the GLPI schema (<c>glpi_groups</c>).
/// Groups are data-driven: names are never hardcoded (ADR-004).
/// </summary>
public sealed class Group
{
    public int Id { get; init; }

    public string Name { get; init; } = string.Empty;
}
