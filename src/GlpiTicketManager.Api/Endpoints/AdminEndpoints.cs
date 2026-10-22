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

        return group;
    }

    private static async Task<IResult> GetAdminDashboard(
        IDashboardRepository dashboardRepository,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
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

        var summaries = await dashboardRepository.GetAdminGroupSummariesAsync(cancellationToken);
        return Results.Ok(summaries);
    }
}
