using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Domain.Enums;
using System.Security.Claims;
using GlpiTicketManager.Api.Auth;

namespace GlpiTicketManager.Api.Endpoints;

public static class GroupEndpoints
{
    public static RouteGroupBuilder MapGroupEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/groups")
            .WithTags("Groups")
            .RequireAuthorization();

        // GET /api/groups -> grupos de la entidad del usuario autenticado
        group.MapGet("/", GetActiveGroups)
            .WithName("GetActiveGroups")
            .WithSummary("Lista grupos de la entidad del usuario autenticado")
            .Produces<GroupDto[]>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // GET /api/groups/{groupId:int}/dashboard -> supervisor del grupo o admin (H-35 / H-40)
        group.MapGet("/{groupId:int}/dashboard", GetGroupDashboard)
            .WithName("GetGroupDashboard")
            .WithSummary("Resumen de estados del grupo y lista de técnicos con carga activa (H-35 / H-40)")
            .Produces<GroupDashboardDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        return group;
    }

    private static async Task<IResult> GetActiveGroups(
        IGroupRepository repository,
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
        if (role == AppRole.Admin)
        {
            var allGroups = await repository.GetByEntityAsync(0, cancellationToken);
            return Results.Ok(allGroups);
        }

        var groups = await repository.GetByUserAsync(userId.Value, cancellationToken);
        return Results.Ok(groups);
    }

    private static async Task<IResult> GetGroupDashboard(
        int groupId,
        IDashboardRepository dashboardRepository,
        ITicketRepository ticketRepository,
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
        if (role == AppRole.Admin)
        {
            // Admin siempre tiene acceso
        }
        else if (role == AppRole.Supervisor)
        {
            var userGroups = await ticketRepository.GetGroupIdsForUserAsync(userId.Value, cancellationToken);
            if (!userGroups.Contains(groupId))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Acceso denegado",
                    detail: "Solo los supervisores asignados a este grupo pueden ver su dashboard.");
            }
        }
        else
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Acceso denegado",
                detail: "Solo supervisores o administradores pueden acceder a este dashboard.");
        }

        var dashboard = await dashboardRepository.GetGroupDashboardAsync(groupId, cancellationToken);
        return Results.Ok(dashboard);
    }
}