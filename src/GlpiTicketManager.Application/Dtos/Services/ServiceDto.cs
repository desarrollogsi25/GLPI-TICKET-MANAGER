namespace GlpiTicketManager.Application.Dtos.Services;

public sealed class ServiceDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int? ParentId { get; init; }
    public string CompleteName { get; init; } = string.Empty;
    public int Level { get; init; }
}
