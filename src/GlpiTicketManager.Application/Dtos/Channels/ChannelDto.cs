namespace GlpiTicketManager.Application.Dtos.Channels;

/// <summary>
/// An active entry channel exposed to the frontend (<c>glpi_requesttypes</c>).
/// </summary>
public sealed record ChannelDto(int Id, string Name)
{
    public ChannelDto() : this(0, string.Empty) { }
    public ChannelDto(uint id, string name) : this((int)id, name) { }
}
