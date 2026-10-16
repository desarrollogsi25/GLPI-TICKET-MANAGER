using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Groups;
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

        var entityId = principal.GetEntityId() ?? 0;
        var groups = await repository.GetByEntityAsync(entityId, cancellationToken);
        return Results.Ok(groups);
    }
}