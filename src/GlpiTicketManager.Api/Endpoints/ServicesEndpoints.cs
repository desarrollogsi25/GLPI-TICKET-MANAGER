using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Services;

namespace GlpiTicketManager.Api.Endpoints;

public static class ServicesEndpoints
{
    public static IEndpointRouteBuilder MapServicesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/services")
            .WithTags("Services")
            .RequireAuthorization();

        group.MapGet(string.Empty, Get)
            .WithName("GetServices")
            .WithSummary("Retrieve all ITIL service categories (flattened)")
            .Produces<IReadOnlyList<ServiceDto>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return group;
    }

    private static async Task<IResult> Get(
        IServiceRepository repo,
        CancellationToken ct)
    {
        var services = await repo.GetAllAsync(ct);
        return Results.Ok(services);
    }
}
