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

        // GET /api/notifications/push/vapid-public-key
        group.MapGet("/push/vapid-public-key", (IPushNotificationSender pushSender) =>
        {
            var key = pushSender.GetVapidPublicKey();
            return Results.Ok(new VapidPublicKeyDto(key));
        })
        .WithName("GetVapidPublicKey")
        .WithSummary("Get the VAPID public key for WebPush subscriptions")
        .Produces<VapidPublicKeyDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/notifications/push/subscribe
        group.MapPost("/push/subscribe", async (
            PushSubscriptionDto subscription,
            HttpContext httpContext,
            IPushSubscriptionRepository repo,
            ClaimsPrincipal principal,
            CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(subscription.Endpoint) ||
                string.IsNullOrWhiteSpace(subscription.Keys?.P256dh) ||
                string.IsNullOrWhiteSpace(subscription.Keys?.Auth))
            {
                return Results.BadRequest(new { message = "Suscripción push inválida." });
            }

            var userAgent = httpContext.Request.Headers.UserAgent.ToString();
            await repo.UpsertSubscriptionAsync(userId.Value, subscription, userAgent, ct);
            return Results.Ok(new { success = true, message = "Suscripción registrada correctamente." });
        })
        .WithName("SubscribeToWebPush")
        .WithSummary("Register a browser push subscription for OS notifications")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/notifications/push/unsubscribe
        group.MapPost("/push/unsubscribe", async (
            UnsubscribePushRequest request,
            IPushSubscriptionRepository repo,
            ClaimsPrincipal principal,
            CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();
            if (!string.IsNullOrWhiteSpace(request.Endpoint))
            {
                await repo.RemoveSubscriptionAsync(userId.Value, request.Endpoint, ct);
            }
            return Results.Ok(new { success = true });
        })
        .WithName("UnsubscribeFromWebPush")
        .WithSummary("Unregister a browser push subscription")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/notifications/push/test
        group.MapPost("/push/test", async (
            IPushNotificationSender pushSender,
            ClaimsPrincipal principal,
            CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var count = await pushSender.SendPushAsync(
                userId.Value,
                "GLPI Ticket Manager",
                "¡Notificación del sistema operativo verificada correctamente!",
                "/kanban",
                ct);

            return Results.Ok(new { success = true, sentToDevices = count });
        })
        .WithName("TestWebPushNotification")
        .WithSummary("Send a test WebPush notification to all active devices of the caller")
        .Produces(StatusCodes.Status200OK)
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
public sealed record UnsubscribePushRequest(string Endpoint);
