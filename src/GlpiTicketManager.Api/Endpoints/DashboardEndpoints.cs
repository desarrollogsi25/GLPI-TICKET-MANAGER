using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Dashboard;

namespace GlpiTicketManager.Api.Endpoints;

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization();

        group.MapGet("/stats", GetStats)
            .WithName("GetDashboardStats")
            .WithSummary("Aggregated ticket metrics for the dashboard")
            .Produces<DashboardStatsDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return group;
    }

    private static async Task<IResult> GetStats(
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        var stats = await ticketService.GetDashboardStatsAsync(cancellationToken);
        return Results.Ok(stats);
    }
}
