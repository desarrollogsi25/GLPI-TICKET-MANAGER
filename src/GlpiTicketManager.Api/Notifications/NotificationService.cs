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

        try
        {
            await _hubContext.Clients.Group($"user-{userId}")
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
            _logger.LogWarning(ex, "Failed to emit SignalR NotificationReceived for user {UserId}", userId);
        }

        return dto;
    }

    public async Task<IReadOnlyList<NotificationDto>> GetByUserAsync(
        int userId,
        int limit = 50,
        int offset = 0,
        CancellationToken ct = default)
    {
        var list = await _repository.GetByUserAsync(userId, limit, offset, ct);
        return list.Select(e => new NotificationDto(
            e.Id,
            e.UserId,
            e.Type,
            e.TicketId,
            e.Title,
            e.Message,
            e.IsRead,
            e.CreatedAt)).ToList();
    }

    public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
    {
        return await _repository.GetUnreadCountAsync(userId, ct);
    }

    public async Task<bool> MarkAsReadAsync(long id, int userId, CancellationToken ct = default)
    {
        return await _repository.MarkAsReadAsync(id, userId, ct);
    }
}
