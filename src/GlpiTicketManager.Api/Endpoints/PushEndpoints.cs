using System.Security.Claims;
using System.Text.Json;
using Dapper;
using GlpiTicketManager.Infrastructure.Persistence;
using Npgsql;
using WebPush;

namespace GlpiTicketManager.Api.Endpoints;

public record PushSubscriptionKeys(string? P256dh, string? Auth);
public record PushSubscriptionRequest(string? Endpoint, PushSubscriptionKeys? Keys);
public record SendPushTestRequest(string? Title, string? Message);

public static class PushEndpoints
{
    public static IEndpointRouteBuilder MapPushEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/push")
            .WithTags("PushNotifications");

        // GET /api/push/vapid-public-key
        group.MapGet("/vapid-public-key", (IConfiguration config) =>
        {
            var key = config["WebPush:VapidPublicKey"] ?? "";
            return Results.Ok(new { publicKey = key });
        })
        .WithName("GetVapidPublicKey")
        .WithSummary("Get the VAPID public key for Web Push subscription")
        .AllowAnonymous();

        // POST /api/push/subscribe
        group.MapPost("/subscribe", async (
            PushSubscriptionRequest req,
            ClaimsPrincipal user,
            IAppDbConnectionFactory dbFactory,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Endpoint) || req.Keys is null ||
                string.IsNullOrWhiteSpace(req.Keys.P256dh) || string.IsNullOrWhiteSpace(req.Keys.Auth))
            {
                return Results.BadRequest(new { message = "Suscripción Push inválida (faltan endpoint o claves p256dh/auth)." });
            }

            var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var userId) || userId <= 0)
            {
                return Results.Unauthorized();
            }

            try
            {
                await using var conn = (NpgsqlConnection)await dbFactory.CreateAsync(ct);
                const string sql = """
                    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
                    VALUES (@UserId, @Endpoint, @P256dh, @Auth, NOW())
                    ON CONFLICT (endpoint) DO UPDATE
                    SET user_id = EXCLUDED.user_id,
                        p256dh = EXCLUDED.p256dh,
                        auth = EXCLUDED.auth,
                        created_at = NOW();
                    """;

                await conn.ExecuteAsync(new CommandDefinition(sql, new
                {
                    UserId = userId,
                    Endpoint = req.Endpoint,
                    P256dh = req.Keys.P256dh,
                    Auth = req.Keys.Auth
                }, cancellationToken: ct));

                logger.LogInformation("Push subscription registered for user {UserId}", userId);
                return Results.Ok(new { message = "Suscripción registrada correctamente." });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error registering push subscription for user {UserId}", userId);
                return Results.StatusCode(StatusCodes.Status500InternalServerError);
            }
        })
        .WithName("SubscribePush")
        .WithSummary("Register or update a Web Push subscription")
        .RequireAuthorization();

        // POST /api/push/test
        group.MapPost("/test", async (
            SendPushTestRequest? req,
            ClaimsPrincipal user,
            IAppDbConnectionFactory dbFactory,
            IConfiguration config,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var userId) || userId <= 0)
            {
                return Results.Unauthorized();
            }

            var title = req?.Title ?? "GLPI Ticket Manager";
            var message = req?.Message ?? "¡Notificaciones push nativas configuradas con éxito!";

            var sent = await SendNotificationToUserAsync(dbFactory, config, userId, title, message, "/kanban", logger, ct);
            return Results.Ok(new { message = $"Notificación enviada a {sent} dispositivos.", sentCount = sent });
        })
        .WithName("SendTestPush")
        .WithSummary("Send a test Web Push notification to current user")
        .RequireAuthorization();

        return app;
    }

    public static async Task<int> SendNotificationToUserAsync(
        IAppDbConnectionFactory dbFactory,
        IConfiguration config,
        int userId,
        string title,
        string message,
        string? url,
        ILogger logger,
        CancellationToken ct = default)
    {
        var subject = config["WebPush:VapidSubject"] ?? "mailto:admin@glpimanager.local";
        var pubKey = config["WebPush:VapidPublicKey"];
        var privKey = config["WebPush:VapidPrivateKey"];

        if (string.IsNullOrWhiteSpace(pubKey) || string.IsNullOrWhiteSpace(privKey))
        {
            logger.LogWarning("VAPID keys not configured. Skipping Web Push notification.");
            return 0;
        }

        await using var conn = (NpgsqlConnection)await dbFactory.CreateAsync(ct);
        const string querySql = "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = @UserId";
        var subscriptions = (await conn.QueryAsync<(string Endpoint, string P256dh, string Auth)>(
            new CommandDefinition(querySql, new { UserId = userId }, cancellationToken: ct))).ToList();

        if (subscriptions.Count == 0) return 0;

        var client = new WebPushClient();
        var vapidDetails = new VapidDetails(subject, pubKey, privKey);

        var payload = JsonSerializer.Serialize(new
        {
            title,
            body = message,
            url = url ?? "/kanban",
            icon = "/icons/icon-192x192.png",
            badge = "/icons/icon-192x192.png"
        });

        int sentCount = 0;
        foreach (var sub in subscriptions)
        {
            try
            {
                var pushSubscription = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                await client.SendNotificationAsync(pushSubscription, payload, vapidDetails, ct);
                sentCount++;
            }
            catch (WebPushException ex) when ((int)ex.StatusCode == 404 || (int)ex.StatusCode == 410)
            {
                // Expired or unregistered subscription; prune from database
                await conn.ExecuteAsync("DELETE FROM push_subscriptions WHERE endpoint = @Endpoint", new { sub.Endpoint });
                logger.LogInformation("Pruned expired push subscription {Endpoint}", sub.Endpoint);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to deliver Web Push to endpoint {Endpoint}", sub.Endpoint);
            }
        }

        return sentCount;
    }
}
