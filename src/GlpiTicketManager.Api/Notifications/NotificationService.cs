using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Notifications;
using GlpiTicketManager.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Api.Notifications;

public sealed class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly IHubContext<TicketHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository repository,
        IHubContext<TicketHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _repository = repository;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<NotificationDto> CreateAsync(
        int userId,
        string type,
        int? ticketId,
        string title,
        string message,
        CancellationToken ct = default)
    {
        var entity = new Notification
        {
            UserId = userId,
            Type = type,
            TicketId = ticketId,
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        var id = await _repository.CreateAsync(entity, ct);
        entity.Id = id;

        var dto = new NotificationDto(
            entity.Id,
            entity.UserId,
            entity.Type,
            entity.TicketId,
            entity.Title,
            entity.Message,
            entity.IsRead,
            entity.CreatedAt);

        await EmitReceivedAsync(dto, ct);
        return dto;
    }

    public async Task<NotificationDto?> CreateIdempotentAsync(
        int userId,
        string type,
        int? ticketId,
        string title,
        string message,
        string idempotencyKey,
        CancellationToken ct = default)
    {
        var entity = new Notification
        {
            UserId = userId,
            Type = type,
            TicketId = ticketId,
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            IdempotencyKey = idempotencyKey
        };

        var id = await _repository.CreateIdempotentAsync(entity, idempotencyKey, ct);
        if (id is null)
        {
            return null;
        }

        entity.Id = id.Value;
        var dto = new NotificationDto(entity.Id, entity.UserId, entity.Type, entity.TicketId,
            entity.Title, entity.Message, entity.IsRead, entity.CreatedAt);

        await EmitReceivedAsync(dto, ct);
        return dto;
    }

    public async Task<bool> CreateTicketCreatedOnceAsync(
        int userId, int ticketId, string title, string message, CancellationToken ct = default)
    {
        var entity = new Notification
        {
            UserId = userId,
            Type = "TicketCreated",
            TicketId = ticketId,
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        var id = await _repository.TryCreateTicketCreatedAsync(entity, ct);
        if (id is null) return false;

        var dto = new NotificationDto(id.Value, userId, entity.Type, ticketId,
            title, message, false, entity.CreatedAt);

        await EmitReceivedAsync(dto, ct);
        return true;
    }

    private async Task EmitReceivedAsync(NotificationDto dto, CancellationToken ct)
    {
        try
        {
            await _hubContext.Clients.Group($"user-{dto.UserId}")
                .SendAsync("NotificationReceived", new
                {
                    id = dto.Id,
                    userId = dto.UserId,
                    type = dto.Type,
                    ticketId = dto.TicketId,
                    title = dto.Title,
                    message = dto.Message,
                    body = dto.Message,
                    isRead = dto.IsRead,
                    read = dto.IsRead,
                    createdAt = dto.CreatedAt
                }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to emit SignalR NotificationReceived for user {UserId}", dto.UserId);
        }
    }

    public async Task<IReadOnlyList<NotificationDto>> GetByUserAsync(
        int userId,
        int limit = 50,
        int offset = 0,
        CancellationToken ct = default)
    {
        var list = await _repository.GetByUserAsync(userId, limit, offset, ct);
        return list.Select(n => new NotificationDto(
            n.Id,
            n.UserId,
            n.Type,
            n.TicketId,
            n.Title,
            n.Message,
            n.IsRead,
            n.CreatedAt
        )).ToList();
    }

    public async Task<int> GetUnreadCountAsync(
        int userId,
        CancellationToken ct = default) =>
        await _repository.GetUnreadCountAsync(userId, ct);

    public async Task<bool> MarkAsReadAsync(
        long id,
        int userId,
        CancellationToken ct = default) =>
        await _repository.MarkAsReadAsync(id, userId, ct);

    public async Task<int> MarkAllAsReadAsync(
        int userId,
        CancellationToken ct = default) =>
        await _repository.MarkAllAsReadAsync(userId, ct);
}