namespace GlpiTicketManager.Application.Abstractions;

public interface ITicketNotificationService
{
    Task NotifyTicketClaimedAsync(int ticketId, int assignedUserId, int groupId, CancellationToken ct = default);
    Task NotifyTicketStatusChangedAsync(int ticketId, int newStatus, int? assigneeId, CancellationToken ct = default);
    Task NotifySolutionAddedAsync(int ticketId, int authorUserId, CancellationToken ct = default);
    Task NotifyTicketCreatedAsync(int ticketId, int? groupId, CancellationToken ct = default);
}
