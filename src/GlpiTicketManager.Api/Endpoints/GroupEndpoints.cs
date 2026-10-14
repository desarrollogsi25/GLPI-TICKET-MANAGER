using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Application.Services;
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

    private static IResult GetActiveGroups(
        ITicketService ticketService,
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

        return Results.Ok(new GroupDto[] 
        { 
            new GroupDto(1, "Call Center"), 
            new GroupDto(2, "Soporte Nivel 1") 
        });
    }
}