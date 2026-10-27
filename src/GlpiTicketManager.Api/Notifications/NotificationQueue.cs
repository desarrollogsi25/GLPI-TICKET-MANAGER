using System.Threading.Channels;

namespace GlpiTicketManager.Api.Notifications;

public enum NotificationTaskType
{
    TicketClaimed,
    TicketStatusChanged,
    SolutionAdded,
    TicketCreated,
    PersistentNotificationToUser,
    WebPushToUser,
    WebPushToGroup
}

public sealed record NotificationTask(
    NotificationTaskType Type,
    int? TicketId = null,
    int? UserId = null,
    int? GroupId = null,
    int? NewStatus = null,
    int? AssigneeId = null,
    int? AuthorUserId = null,
    string? Title = null,
    string? Message = null,
    string? Url = null,
    object? Payload = null
);

public interface INotificationQueue
{
    void Enqueue(NotificationTask task);
    ValueTask<NotificationTask> ReadAsync(CancellationToken cancellationToken);
}

public sealed class NotificationQueue : INotificationQueue
{
    private readonly Channel<NotificationTask> _channel;

    public NotificationQueue()
    {
        // Unbounded channel with single reader to ensure zero contention and zero latency on enqueue
        _channel = Channel.CreateUnbounded<NotificationTask>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
    }

    public void Enqueue(NotificationTask task)
    {
        _channel.Writer.TryWrite(task);
    }

    public ValueTask<NotificationTask> ReadAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAsync(cancellationToken);
    }
}
