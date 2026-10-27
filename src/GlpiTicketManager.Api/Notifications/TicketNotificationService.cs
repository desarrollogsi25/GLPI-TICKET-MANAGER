using GlpiTicketManager.Application.Abstractions;

namespace GlpiTicketManager.Api.Notifications;

public sealed class TicketNotificationService : ITicketNotificationService
{
    private readonly INotificationQueue _queue;

    public TicketNotificationService(INotificationQueue queue)
    {
        _queue = queue;
    }

    public Task NotifyTicketClaimedAsync(int ticketId, int assignedUserId, int groupId, CancellationToken ct = default)
    {
        _queue.Enqueue(new NotificationTask(
            Type: NotificationTaskType.TicketClaimed,
            TicketId: ticketId,
            AssigneeId: assignedUserId,
            GroupId: groupId,
            Title: $"Ticket #{ticketId} asignado",
            Message: $"El ticket #{ticketId} ha sido asignado al técnico.",
            Url: $"/tickets/{ticketId}"
        ));
        return Task.CompletedTask;
    }

    public Task NotifyTicketStatusChangedAsync(int ticketId, int newStatus, int? assigneeId, CancellationToken ct = default)
    {
        _queue.Enqueue(new NotificationTask(
            Type: NotificationTaskType.TicketStatusChanged,
            TicketId: ticketId,
            NewStatus: newStatus,
            AssigneeId: assigneeId,
            Title: $"Ticket #{ticketId} actualizado",
            Message: $"El ticket #{ticketId} cambió de estado.",
            Url: $"/tickets/{ticketId}"
        ));
        return Task.CompletedTask;
    }

    public Task NotifySolutionAddedAsync(int ticketId, int authorUserId, CancellationToken ct = default)
    {
        _queue.Enqueue(new NotificationTask(
            Type: NotificationTaskType.SolutionAdded,
            TicketId: ticketId,
            AuthorUserId: authorUserId,
            Title: $"Solución propuesta #{ticketId}",
            Message: $"Se ha propuesto una solución para el ticket #{ticketId}.",
            Url: $"/tickets/{ticketId}"
        ));
        return Task.CompletedTask;
    }

    public Task NotifyTicketCreatedAsync(int ticketId, int? groupId, CancellationToken ct = default)
    {
        _queue.Enqueue(new NotificationTask(
            Type: NotificationTaskType.TicketCreated,
            TicketId: ticketId,
            GroupId: groupId,
            Title: $"Nuevo ticket #{ticketId}",
            Message: "Se ha recibido un nuevo ticket en la cola de tu grupo.",
            Url: $"/tickets/{ticketId}"
        ));
        return Task.CompletedTask;
    }
}
