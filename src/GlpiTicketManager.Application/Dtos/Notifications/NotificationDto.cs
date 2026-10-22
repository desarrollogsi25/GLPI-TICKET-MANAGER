namespace GlpiTicketManager.Application.Dtos.Notifications;

/// <summary>
/// DTO representing a persistent notification (H-34).
/// Provides aliases (Body, Read) to seamlessly serve both backend conventions
/// and frontend UI components (NotificationBell).
/// </summary>
public sealed record NotificationDto(
    long Id,
    int UserId,
    string Type,
    int? TicketId,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAt)
{
    public string Body => Message;
    public bool Read => IsRead;
}

public sealed record UnreadCountResponse(int Count);
