using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Dtos.Dashboard;
using System.Security.Claims;
using GlpiTicketManager.Api.Auth;

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
        IDashboardAccessPolicy dashboardAccessPolicy,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var role = principal.GetRole();
        var scope = await dashboardAccessPolicy.GetScopeAsync(userId.Value, role, cancellationToken);
        var stats = await ticketService.GetDashboardStatsAsync(scope, cancellationToken);
        return Results.Ok(stats);
    }
}
