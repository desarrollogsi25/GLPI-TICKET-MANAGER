namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// An entry channel read from the GLPI schema (<c>glpi_requesttypes</c>).
/// Channels are data-driven: the active set is whatever GLPI exposes (ADR-004).
/// </summary>
public sealed class Channel
{
    public int Id { get; init; }

    public string Name { get; init; } = string.Empty;
}
