using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Channels;
using System.Security.Claims;
using GlpiTicketManager.Api.Auth;

namespace GlpiTicketManager.Api.Endpoints;

public static class ChannelEndpoints
{
    public static RouteGroupBuilder MapChannelEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/channels")
            .WithTags("Channels")
            .RequireAuthorization();

        group.MapGet("/", GetChannels)
            .WithName("GetChannels")
            .WithSummary("Lista requesttypes activos (canales de entrada)")
            .Produces<ChannelDto[]>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        return group;
    }

    private static async Task<IResult> GetChannels(
        IChannelRepository repository,
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

        var channels = await repository.GetAllActiveAsync(cancellationToken);
        return Results.Ok(channels);
    }
}