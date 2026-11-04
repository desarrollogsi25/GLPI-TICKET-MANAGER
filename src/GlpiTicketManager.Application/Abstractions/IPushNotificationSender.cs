namespace GlpiTicketManager.Application.Abstractions;

public interface IPushNotificationSender
{
    string GetVapidPublicKey();
    Task<int> SendPushAsync(int userId, string title, string body, string? url = null, CancellationToken ct = default);
}
