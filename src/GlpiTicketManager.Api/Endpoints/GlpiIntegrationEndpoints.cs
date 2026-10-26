using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Integrations;
using Microsoft.AspNetCore.Mvc;

namespace GlpiTicketManager.Api.Endpoints;

public static class GlpiIntegrationEndpoints
{
    private static readonly ConcurrentDictionary<string, DateTimeOffset> ProcessedSignatures = new();

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
        var configuredSecret = configuration["GlpiWebhook:Secret"];
        if (string.IsNullOrWhiteSpace(configuredSecret))
        {
            logger.LogWarning("GLPI webhook rejected: GlpiWebhook:Secret is not configured.");
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Webhook no configurado",
                detail: "El secreto del webhook no está configurado en el servidor.");
        }

        // 1. Validar timestamp si está presente
        if (httpContext.Request.Headers.TryGetValue("X-GLPI-timestamp", out var tsHeader) ||
            httpContext.Request.Headers.TryGetValue("X-Webhook-Timestamp", out tsHeader))
        {
            if (long.TryParse(tsHeader.ToString().Trim(), out var parsedTimestamp))
            {
                var driftSeconds = Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - parsedTimestamp);
                if (driftSeconds >= 300)
                {
                    logger.LogWarning("GLPI webhook rejected: timestamp {Timestamp} differs by {Drift}s (limit 300s).", tsHeader, driftSeconds);
                    return Results.Problem(
                        statusCode: StatusCodes.Status401Unauthorized,
                        title: "Timestamp expirado",
                        detail: "El timestamp del webhook difiere en más de 5 minutos.");
                }
            }
        }

        // 2. Validar firma o secreto en los headers
        if (!ValidateSignature(httpContext, configuredSecret, logger, out var signatureKey))
        {
            logger.LogWarning("GLPI webhook rejected: missing or invalid signature header.");
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Firma o secreto inválido",
                detail: "El header de autenticación del webhook no es válido o está ausente.");
        }

        // 3. Idempotencia: Si la firma ya fue procesada dentro de la ventana de tiempo, responder 200 sin reprocesar
        if (!string.IsNullOrEmpty(signatureKey) &&
            ProcessedSignatures.TryGetValue(signatureKey, out var processedAt) &&
            DateTimeOffset.UtcNow - processedAt < TimeSpan.FromMinutes(10))
        {
            logger.LogInformation("GLPI webhook signature {Signature} was already processed at {ProcessedAt}. Skipping duplicate execution.", signatureKey, processedAt);
            return Results.Ok(new
            {
                success = true,
                duplicate = true,
                message = "Webhook ya procesado previamente (idempotente)."
            });
        }

        // Leer el body crudo como string y luego deserializar
        string requestBody;
        using (var reader = new StreamReader(httpContext.Request.Body))
        {
            requestBody = await reader.ReadToEndAsync(cancellationToken);
        }

        logger.LogInformation("Raw request body: {RequestBody}", requestBody);

        GlpiTicketCreatedWebhookPayload? payload;
        try
        {
            payload = System.Text.Json.JsonSerializer.Deserialize<GlpiTicketCreatedWebhookPayload>(requestBody);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to deserialize GLPI webhook payload from raw body: {RequestBody}", requestBody);
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

        // Emitir notificación persistente a cada técnico del grupo (idempotente por ticketId)
        foreach (var techId in techIds)
        {
            try
            {
                var existing = await notificationService.GetByUserAsync(techId, 10, 0, cancellationToken);
                if (!existing.Any(n => n.TicketId == ticketId && n.Type == "TicketCreated"))
                {
                    await notificationService.CreateAsync(
                        techId,
                        "TicketCreated",
                        ticketId,
                        $"Nuevo ticket #{ticketId}",
                        $"Se ha asignado el ticket '{ticketTitle}' a tu grupo.",
                        cancellationToken);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to create persistent notification for technician {TechId}", techId);
            }
        }

        // Emitir evento SignalR en tiempo real
        try
        {
            await ticketNotificationService.NotifyTicketCreatedAsync(ticketId, groupId.Value, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to emit TicketCreated SignalR event for ticket {TicketId}", ticketId);
        }

        if (!string.IsNullOrEmpty(signatureKey))
        {
            ProcessedSignatures[signatureKey] = DateTimeOffset.UtcNow;
        }

        return Results.Ok(new
        {
            success = true,
            ticketId,
            groupId = groupId.Value,
            notifiedCount = techIds.Count
        });
    }

    private static bool ValidateSignature(
        HttpContext context,
        string expectedSecret,
        ILogger<Program> logger,
        out string? signatureKey)
    {
        signatureKey = null;

        if (context.Request.Headers.TryGetValue("X-GLPI-signature", out var sigH))
        {
            signatureKey = sigH.ToString().Trim();
        }
        else if (context.Request.Headers.TryGetValue("X-Glpi-Signature", out sigH))
        {
            signatureKey = sigH.ToString().Trim();
        }
        else if (context.Request.Headers.TryGetValue("X-Webhook-Signature", out sigH))
        {
            signatureKey = sigH.ToString().Trim();
        }

        // GLPI sends HMAC-SHA256 signature of (body + timestamp) using the secret
        // Headers: X-GLPI-signature and X-GLPI-timestamp
        if (!context.Request.Headers.TryGetValue("X-GLPI-signature", out var signatureHeader) ||
            !context.Request.Headers.TryGetValue("X-GLPI-timestamp", out var timestampHeader))
        {
            // Fallback: Check for direct secret headers (for manual testing)
            var directHeaders = new[] { "X-Webhook-Secret", "X-Glpi-Secret", "X-Glpi-Signature", "X-GLPI-signature" };
            foreach (var header in directHeaders)
            {
                if (context.Request.Headers.TryGetValue(header, out var val))
                {
                    var headerVal = val.ToString().Trim();
                    if (headerVal.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
                    {
                        headerVal = headerVal["sha256=".Length..].Trim();
                    }
                    if (CryptographicOperations.FixedTimeEquals(
                        Encoding.UTF8.GetBytes(headerVal),
                        Encoding.UTF8.GetBytes(expectedSecret)))
                    {
                        return true;
                    }
                }
            }

            // Fallback: Authorization: Bearer <secret>
            if (context.Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var authVal = authHeader.ToString().Trim();
                if (authVal.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    var bearer = authVal["Bearer ".Length..].Trim();
                    if (CryptographicOperations.FixedTimeEquals(
                        Encoding.UTF8.GetBytes(bearer),
                        Encoding.UTF8.GetBytes(expectedSecret)))
                    {
                        return true;
                    }
                }
            }

            logger.LogWarning("GLPI webhook rejected: missing X-GLPI-signature or X-GLPI-timestamp headers.");
            return false;
        }

        var signature = signatureHeader.ToString().Trim();
        var timestamp = timestampHeader.ToString().Trim();
        signatureKey = signature;

        // Read the body to compute the HMAC
        context.Request.EnableBuffering();
        string requestBody;
        using (var reader = new StreamReader(context.Request.Body, leaveOpen: true))
        {
            requestBody = reader.ReadToEndAsync().GetAwaiter().GetResult();
        }
        context.Request.Body.Position = 0;

        // Compute HMAC-SHA256 of (body + timestamp) using the secret
        var keyBytes = Encoding.UTF8.GetBytes(expectedSecret);
        var messageBytes = Encoding.UTF8.GetBytes(requestBody + timestamp);
        var computedHash = HMACSHA256.HashData(keyBytes, messageBytes);
        var computedSignature = Convert.ToHexString(computedHash).ToLowerInvariant();

        // Compare signatures using constant-time comparison
        var signatureBytes = Encoding.UTF8.GetBytes(signature.ToLowerInvariant());
        var computedSignatureBytes = Encoding.UTF8.GetBytes(computedSignature);

        var result = CryptographicOperations.FixedTimeEquals(signatureBytes, computedSignatureBytes);
        if (!result)
        {
            logger.LogWarning("GLPI webhook signature validation failed for timestamp {Timestamp}", timestamp);
        }
        return result;
    }
}