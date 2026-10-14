using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Channels;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Application.Services;
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

        return Results.Ok(new ChannelDto[] 
        { 
            new ChannelDto(1, "Helpdesk"), 
            new ChannelDto(2, "E-Mail"), 
            new ChannelDto(3, "Phone"), 
            new ChannelDto(4, "Direct"), 
            new ChannelDto(5, "Written"), 
            new ChannelDto(6, "Other") 
        });
    }
}