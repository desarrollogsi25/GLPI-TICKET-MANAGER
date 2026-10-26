using System.Security.Claims;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Notifications;

namespace GlpiTicketManager.Api.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications")
            .WithTags("Notifications")
            .RequireAuthorization();

        // GET /api/notifications
        group.MapGet("/", GetNotifications)
            .WithName("GetNotifications")
            .WithSummary("Get recent notifications for the authenticated user")
            .Produces<IReadOnlyList<NotificationDto>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        // GET /api/notifications/unread-count
        group.MapGet("/unread-count", GetUnreadCount)
            .WithName("GetUnreadNotificationCount")
            .WithSummary("Get count of unread notifications for the authenticated user")
            .Produces<UnreadCountResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        // PUT /api/notifications/{id}/read
        group.MapPut("/{id:long}/read", MarkAsRead)
            .WithName("MarkNotificationAsRead")
            .WithSummary("Mark a notification as read")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // PATCH /api/notifications/{id}/read (alias for resilience)
        group.MapPatch("/{id:long}/read", MarkAsRead)
            .WithName("PatchNotificationAsRead")
            .WithSummary("Mark a notification as read (PATCH alias)")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // PUT /api/notifications/read-all
        group.MapPut("/read-all", MarkAllAsRead)
            .WithName("MarkAllNotificationsAsRead")
            .WithSummary("Mark all notifications as read for the authenticated user")
            .Produces<MarkAllReadResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static async Task<IResult> GetNotifications(
        int? limit,
        int? offset,
        INotificationService notificationService,
        ClaimsPrincipal principal,
        CancellationToken ct)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var results = await notificationService.GetByUserAsync(
            userId.Value,
            limit: limit ?? 50,
            offset: offset ?? 0,
            ct);

        return Results.Ok(results);
    }

    private static async Task<IResult> GetUnreadCount(
        INotificationService notificationService,
        ClaimsPrincipal principal,
        CancellationToken ct)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var count = await notificationService.GetUnreadCountAsync(userId.Value, ct);
        return Results.Ok(new UnreadCountResponse(count));
    }

    private static async Task<IResult> MarkAsRead(
        long id,
        INotificationService notificationService,
        ClaimsPrincipal principal,
        CancellationToken ct)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var updated = await notificationService.MarkAsReadAsync(id, userId.Value, ct);
        if (!updated)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Notificación no encontrada",
                detail: $"No se encontró la notificación {id} para este usuario.");
        }

        return Results.Ok(new { id, isRead = true });
    }

    private static async Task<IResult> MarkAllAsRead(
        INotificationService notificationService,
        ClaimsPrincipal principal,
        CancellationToken ct)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var count = await notificationService.MarkAllAsReadAsync(userId.Value, ct);
        return Results.Ok(new MarkAllReadResponse(count));
    }
}

internal sealed record MarkAllReadResponse(int Count);
