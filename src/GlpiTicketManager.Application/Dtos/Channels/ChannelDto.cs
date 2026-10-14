namespace GlpiTicketManager.Application.Dtos.Channels;

/// <summary>
/// An active entry channel exposed to the frontend (<c>glpi_requesttypes</c>).
/// </summary>
public sealed record ChannelDto(int Id, string Name);
