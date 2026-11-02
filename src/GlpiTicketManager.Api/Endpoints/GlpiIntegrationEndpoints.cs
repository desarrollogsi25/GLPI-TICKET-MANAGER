using System.Security.Cryptography;
using System.Text;
using System.Globalization;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Integrations;
using Microsoft.AspNetCore.Mvc;

namespace GlpiTicketManager.Api.Endpoints;

public static class GlpiIntegrationEndpoints
{
    private const int MaxWebhookBodyBytes = 64 * 1024;
    // GLPI 11 signs body + Unix timestamp. Keep this in sync with the GLPI webhook expiration.
    private const long MaxTimestampSkewSeconds = 10 * 60;

    public static RouteGroupBuilder MapGlpiIntegrationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/integrations/glpi")
            .WithTags("Integrations");

        // POST /api/integrations/glpi/ticket-created -> webhook para nuevos tickets de GLPI (H-35)
        group.MapPost("/ticket-created", HandleTicketCreated)
            .WithName("GlpiTicketCreatedWebhook")
            .WithSummary("Webhook receptor de eventos de creación de tickets en GLPI (H-35)")
            .AllowAnonymous()
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        return group;
    }

    private static async Task<IResult> HandleTicketCreated(
        HttpContext httpContext,
        IConfiguration configuration,
        IDashboardRepository dashboardRepository,
        ITicketRepository ticketRepository,
        INotificationService notificationService,
        ITicketNotificationService ticketNotificationService,
        ILogger<Program> logger,
        CancellationToken cancellationToken)
    {
        // Fail closed: a public, hardcoded fallback is never an authentication secret.
        var configuredSecret = configuration["GlpiWebhook:Secret"];
        if (string.IsNullOrWhiteSpace(configuredSecret) || configuredSecret.Length < 32)
        {
            logger.LogError("GLPI webhook secret is not configured; refusing webhook authentication.");
            return Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Integración no configurada");
        }

        if (httpContext.Request.ContentLength > MaxWebhookBodyBytes)
        {
            return Results.Problem(statusCode: StatusCodes.Status413PayloadTooLarge,
                title: "Payload demasiado grande");
        }

        // Read the exact bytes GLPI signed; never log the body or a shared secret.
        using var payloadStream = new MemoryStream();
        var readBuffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = await httpContext.Request.Body.ReadAsync(readBuffer, cancellationToken)) > 0)
        {
            if (payloadStream.Length + bytesRead > MaxWebhookBodyBytes)
            {
                return Results.Problem(statusCode: StatusCodes.Status413PayloadTooLarge,
                    title: "Payload demasiado grande");
            }
            payloadStream.Write(readBuffer, 0, bytesRead);
        }
        var rawBody = payloadStream.ToArray();

        if (!ValidateSignature(httpContext.Request.Headers, configuredSecret, rawBody))
        {
            logger.LogWarning("GLPI webhook rejected: missing, expired or invalid HMAC signature.");
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Firma o secreto inválido",
                detail: "El header de autenticación del webhook no es válido o está ausente.");
        }

        GlpiTicketCreatedWebhookPayload? payload;
        try
        {
            payload = System.Text.Json.JsonSerializer.Deserialize<GlpiTicketCreatedWebhookPayload>(rawBody);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to deserialize GLPI webhook payload.");
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Payload inválido",
                detail: "No se pudo deserializar el JSON del webhook.");
        }

        var ticketId = payload?.ResolvedTicketId ?? 0;
        if (ticketId <= 0)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Payload inválido",
                detail: "El ticketId es requerido y debe ser un entero positivo.");
        }

        // Buscar grupo asignado y datos del ticket en MariaDB
        var groupInfo = await dashboardRepository.GetTicketGroupAssignmentAsync(ticketId, cancellationToken);
        int? groupId = groupInfo?.GroupId;
        string ticketTitle = groupInfo?.TicketName ?? string.Empty;

        if (groupId is null || groupId <= 0)
        {
            var fallbackGroups = await ticketRepository.GetGroupIdsForTicketAsync(ticketId, cancellationToken);
            groupId = fallbackGroups.FirstOrDefault();
            var ticket = await ticketRepository.GetByIdAsync(ticketId, cancellationToken);
            if (string.IsNullOrEmpty(ticketTitle))
            {
                ticketTitle = ticket?.Name ?? $"Ticket #{ticketId}";
            }

            if ((groupId is null || groupId <= 0) && ticket?.CategoryId is > 0)
            {
                groupId = await ticketRepository.GetAssignmentGroupForCategoryAsync(ticket.CategoryId.Value, cancellationToken);
                if (groupId is > 0)
                {
                    await ticketRepository.EnsureTicketGroupAssignedAsync(ticketId, groupId.Value, cancellationToken);
                }
            }
        }

        if (groupId is null || groupId <= 0)
        {
            logger.LogInformation("GLPI webhook: Ticket {TicketId} has no assigned group. Notification skipped.", ticketId);
            return Results.Ok(new { success = true, ticketId, notified = 0, message = "Ticket sin grupo asignado." });
        }

        // Buscar técnicos del grupo
        var techIds = await dashboardRepository.GetTechnicianUserIdsInGroupAsync(groupId.Value, cancellationToken);

        // H-02/H-14: PostgreSQL atomically reserves (userId,ticketId) and inserts
        // the notification. A paginated look-up before CreateAsync is NOT safe:
        // older notices fall outside the first page, and replicas can race.
        var newlyNotified = 0;
        var failedNotifications = 0;
        foreach (var techId in techIds)
        {
            try
            {
                if (await notificationService.CreateTicketCreatedOnceAsync(
                    techId, ticketId, $"Nuevo ticket #{ticketId}",
                    $"Se ha asignado el ticket '{ticketTitle}' a tu grupo.", cancellationToken))
                {
                    newlyNotified++;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to create persistent notification for technician {TechId}", techId);
                failedNotifications++;
            }
        }

        if (failedNotifications > 0)
        {
            // At least one user still needs a delivery. A non-2xx response asks
            // GLPI to retry, while successfully delivered users remain deduped.
            return Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Notificación incompleta",
                detail: "Se requiere reintento del webhook para completar las notificaciones.");
        }

        // Do not send an extra group event for a pure replay. The per-user
        // notification is durable; SignalR remains best-effort and transient.
        if (newlyNotified > 0)
        {
            try
            {
                await ticketNotificationService.NotifyTicketCreatedAsync(ticketId, groupId.Value, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to emit TicketCreated SignalR event for ticket {TicketId}", ticketId);
            }
        }

        return Results.Ok(new
        {
            success = true,
            ticketId,
            groupId = groupId.Value,
            notifiedCount = newlyNotified
        });
    }

    private static bool ValidateSignature(IHeaderDictionary headers, string expectedSecret, byte[] rawBody)
    {
        if (!headers.TryGetValue("X-GLPI-signature", out var signatureHeader) ||
            !headers.TryGetValue("X-GLPI-timestamp", out var timestampHeader))
        {
            return false;
        }
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (!long.TryParse(timestampHeader.ToString(), NumberStyles.None, CultureInfo.InvariantCulture,
                out var timestamp) ||
            timestamp < now - MaxTimestampSkewSeconds || timestamp > now + MaxTimestampSkewSeconds)
        {
            return false;
        }

        var signature = signatureHeader.ToString().Trim();
        if (signature.Length != 64)
        {
            return false;
        }

        byte[] receivedHash;
        try
        {
            receivedHash = Convert.FromHexString(signature);
        }
        catch (FormatException)
        {
            return false;
        }

        var timestampBytes = Encoding.UTF8.GetBytes(timestampHeader.ToString());
        var message = new byte[rawBody.Length + timestampBytes.Length];
        rawBody.CopyTo(message, 0);
        timestampBytes.CopyTo(message, rawBody.Length);
        var computedHash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(expectedSecret), message);
        return CryptographicOperations.FixedTimeEquals(receivedHash, computedHash);
    }
}
