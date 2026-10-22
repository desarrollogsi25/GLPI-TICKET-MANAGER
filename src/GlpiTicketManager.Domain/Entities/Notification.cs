namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// Persistent notification for a user (H-34).
/// Stored in PostgreSQL glpi_ticket_manager database.
/// </summary>
public sealed class Notification
{
    public long Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public int? TicketId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
