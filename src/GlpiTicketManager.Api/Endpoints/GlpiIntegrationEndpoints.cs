using System.Security.Cryptography;
using System.Text;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Integrations;
using Microsoft.AspNetCore.Mvc;

namespace GlpiTicketManager.Api.Endpoints;

public static class GlpiIntegrationEndpoints
{
    public const string DefaultWebhookSecret = "glpi-webhook-secret-token-32-chars-minimum!!";

    public static RouteGroupBuilder MapGlpiIntegrationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/integrations/glpi")
            .WithTags("Integrations");

        // POST /api/integrations/glpi/ticket-created -> webhook para nuevos tickets de GLPI (H-35)
        group.MapPost("/ticket-created", HandleTicketCreated)
            .WithName("GlpiTicketCreatedWebhook")
            .WithSummary("Webhook receptor de eventos de creación de tickets en GLPI (H-35)")
            .AllowAnonymous()
            .Accepts<GlpiTicketCreatedWebhookPayload>("application/json")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        return group;
    }

    private static async Task<IResult> HandleTicketCreated(
        [FromBody] GlpiTicketCreatedWebhookPayload? payload,
        HttpContext httpContext,
        IConfiguration configuration,
        IDashboardRepository dashboardRepository,
        ITicketRepository ticketRepository,
        INotificationService notificationService,
        ITicketNotificationService ticketNotificationService,
        ILogger<Program> logger,
        CancellationToken cancellationToken)
    {
        var configuredSecret = configuration["GlpiWebhook:Secret"] ?? DefaultWebhookSecret;

        // Validar firma o secreto en los headers
        if (!ValidateSignature(httpContext, configuredSecret))
        {
            logger.LogWarning("GLPI webhook rejected: missing or invalid signature header.");
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Firma o secreto inválido",
                detail: "El header de autenticación del webhook no es válido o está ausente.");
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
            if (string.IsNullOrEmpty(ticketTitle))
            {
                var ticket = await ticketRepository.GetByIdAsync(ticketId, cancellationToken);
                ticketTitle = ticket?.Name ?? $"Ticket #{ticketId}";
            }
        }

        if (groupId is null || groupId <= 0)
        {
            logger.LogInformation("GLPI webhook: Ticket {TicketId} has no assigned group. Notification skipped.", ticketId);
            return Results.Ok(new { success = true, ticketId, notified = 0, message = "Ticket sin grupo asignado." });
        }

        // Buscar técnicos del grupo
        var techIds = await dashboardRepository.GetTechnicianUserIdsInGroupAsync(groupId.Value, cancellationToken);

        // Emitir notificación persistente a cada técnico del grupo
        foreach (var techId in techIds)
        {
            try
            {
                await notificationService.CreateAsync(
                    techId,
                    "TicketCreated",
                    ticketId,
                    $"Nuevo ticket #{ticketId}",
                    $"Se ha asignado el ticket '{ticketTitle}' a tu grupo.",
                    cancellationToken);
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

        return Results.Ok(new
        {
            success = true,
            ticketId,
            groupId = groupId.Value,
            notifiedCount = techIds.Count
        });
    }

    private static bool ValidateSignature(HttpContext context, string expectedSecret)
    {
        // 1. Cabeceras directas de secreto
        var directHeaders = new[] { "X-Webhook-Secret", "X-Glpi-Secret", "X-Glpi-Signature" };
        foreach (var header in directHeaders)
        {
            if (context.Request.Headers.TryGetValue(header, out var val))
            {
                var headerVal = val.ToString().Trim();
                if (CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(headerVal),
                    Encoding.UTF8.GetBytes(expectedSecret)))
                {
                    return true;
                }

                // Si viene como "sha256=<hex>", verificar prefijo
                if (headerVal.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
                {
                    var tokenOnly = headerVal["sha256=".Length..].Trim();
                    if (CryptographicOperations.FixedTimeEquals(
                        Encoding.UTF8.GetBytes(tokenOnly),
                        Encoding.UTF8.GetBytes(expectedSecret)))
                    {
                        return true;
                    }
                }
            }
        }

        // 2. Authorization: Bearer <secret>
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

        return false;
    }
}
