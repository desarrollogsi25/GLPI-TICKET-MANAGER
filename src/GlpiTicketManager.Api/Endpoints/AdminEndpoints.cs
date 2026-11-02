using System.Security.Claims;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Api.Endpoints;

public static class AdminEndpoints
{
    public static RouteGroupBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin")
            .WithTags("Admin")
            .RequireAuthorization();

        // GET /api/admin/dashboard -> resumen global por grupo (H-35)
        group.MapGet("/dashboard", GetAdminDashboard)
            .WithName("GetAdminDashboard")
            .WithSummary("Resumen global por grupo para administración (H-35)")
            .Produces<IReadOnlyList<GroupSummaryDto>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // GET /api/admin/groups-summary -> alias consumido por AdminDashboard.tsx
        group.MapGet("/groups-summary", GetAdminDashboard)
            .WithName("GetAdminGroupsSummary")
            .WithSummary("Alias de resumen de grupos para el frontend (H-35)")
            .Produces<IReadOnlyList<GroupSummaryDto>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // GET /api/admin/watcher-status -> estado operativo y alertas del watcher GLPI
        group.MapGet("/watcher-status", GetAdminWatcherStatus)
            .WithName("GetAdminWatcherStatus")
            .WithSummary("Estado operativo del watcher GLPI y tickets en fallo permanente")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // POST /api/admin/watcher/recover/{ticketId:int} -> recuperación explícita de ticket en fallo permanente
        group.MapPost("/watcher/recover/{ticketId:int}", RecoverAdminWatcherTicket)
            .WithName("RecoverAdminWatcherTicket")
            .WithSummary("Recupera explícitamente un ticket del watcher en estado PermanentlyFailed")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return group;
    }

    private static async Task<IResult> GetAdminDashboard(
        IDashboardRepository dashboardRepository,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var authError = ValidateAdminPrincipal(principal);
        if (authError is not null)
        {
            return authError;
        }

        var summaries = await dashboardRepository.GetAdminGroupSummariesAsync(cancellationToken);
        return Results.Ok(summaries);
    }

    private static async Task<IResult> GetAdminWatcherStatus(
        IGlpiWatcherStateRepository watcherStateRepository,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var authError = ValidateAdminPrincipal(principal);
        if (authError is not null)
        {
            return authError;
        }

        var checkpoint = await watcherStateRepository.GetLastSeenTicketIdAsync(cancellationToken);
        var pending = await watcherStateRepository.GetPendingTicketsAsync(100, cancellationToken);
        var permanentlyFailed = await watcherStateRepository.GetPermanentlyFailedTicketsAsync(100, cancellationToken);

        return Results.Ok(new
        {
            lastSeenTicketId = checkpoint,
            pendingCount = pending.Count,
            permanentlyFailedCount = permanentlyFailed.Count,
            hasOperationalAlert = permanentlyFailed.Count > 0,
            permanentlyFailedTickets = permanentlyFailed
        });
    }

    private static async Task<IResult> RecoverAdminWatcherTicket(
        int ticketId,
        IGlpiWatcherStateRepository watcherStateRepository,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var authError = ValidateAdminPrincipal(principal);
        if (authError is not null)
        {
            return authError;
        }

        var recovered = await watcherStateRepository.RecoverPendingTicketAsync(ticketId, cancellationToken);
        if (!recovered)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Ticket no encontrado en cola del watcher",
                detail: $"No existe registro pendiente o en fallo permanente para el ticket #{ticketId}.");
        }

        return Results.Ok(new
        {
            recovered = true,
            ticketId
        });
    }

    private static IResult? ValidateAdminPrincipal(ClaimsPrincipal principal)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Usuario no autenticado",
                detail: "No se encontro el userId en el token JWT.");
        }

        var role = principal.GetRole();
        if (role != AppRole.Admin)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Acceso denegado",
                detail: "Solo administradores pueden acceder a este dashboard.");
        }

        return null;
    }
}
