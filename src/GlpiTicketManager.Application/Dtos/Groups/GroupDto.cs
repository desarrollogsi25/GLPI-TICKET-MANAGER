namespace GlpiTicketManager.Application.Dtos.Groups;

/// <summary>
/// A technician group exposed to the frontend (<c>glpi_groups</c>).
/// </summary>
public sealed record GroupDto(int Id, string Name);
