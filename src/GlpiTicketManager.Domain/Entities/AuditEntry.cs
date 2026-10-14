namespace GlpiTicketManager.Domain.Entities;

public sealed class AuditEntry
{
    public long Id { get; init; }
    public int UserId { get; init; }
    public string Action { get; init; } = string.Empty;
    public int? TicketId { get; init; }
    public string? Details { get; init; }
    public DateTime CreatedAt { get; init; }
}
