using System.Security.Claims;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Api.RateLimiting;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Api.Endpoints;

/// <summary>
/// Endpoints for the native GLPI planning of a ticket.
/// </summary>
/// <remarks>
/// There is deliberately no endpoint that sets the status to 3. Creating, moving,
/// completing or cancelling a <c>TicketTask</c> is what makes GLPI derive
/// "En proceso (planificado)"; every response carries the status GLPI reports after the
/// mutation.
/// </remarks>
public static class TicketPlanningEndpoints
{
    public static RouteGroupBuilder MapTicketPlanningEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tickets")
            .WithTags("Ticket planning")
            .RequireAuthorization()
            .RequireRateLimiting(RateLimitPolicies.PerUser);

        group.MapGet("/{id:int}/planning", GetPlanning)
            .WithName("GetTicketPlanning")
            .WithSummary("Scheduled tasks of a ticket and the status GLPI reports for it")
            .Produces<TicketPlanningDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/{id:int}/planning", Plan)
            .WithName("PlanTicketPlanning")
            .WithSummary("Create the scheduled GLPI task that makes the ticket 'En proceso (planificado)'")
            .Accepts<PlanTicketRequest>("application/json")
            .Produces<TicketPlanningDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:int}/planning/availability", GetAvailability)
            .WithName("GetTicketPlanningAvailability")
            .WithSummary("Check whether a technician can take a time slot")
            .Produces<TicketAvailabilityDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:int}/planning/{taskId:int}", Reschedule)
            .WithName("RescheduleTicketTask")
            .WithSummary("Move or edit an existing scheduled task")
            .Accepts<RescheduleTicketRequest>("application/json")
            .Produces<TicketPlanningDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/{id:int}/planning/{taskId:int}/complete", Complete)
            .WithName("CompleteTicketPlanningTask")
            .WithSummary("Mark the task as done; GLPI recomputes the ticket status")
            .Produces<TicketPlanningDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapDelete("/{id:int}/planning/{taskId:int}", Cancel)
            .WithName("CancelTicketPlanningTask")
            .WithSummary("Delete the scheduled task and reconcile the ticket status")
            .Produces<TicketPlanningDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized);

        return group;
    }

    private static async Task<IResult> GetPlanning(
        int id,
        ITicketPlanningService planning,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (userId, role) = ReadCaller(principal);
        if (userId is null)
        {
            return Unauthorized();
        }

        return await ExecuteAsync(
            () => planning.GetPlanningAsync(id, userId.Value, role, cancellationToken));
    }

    private static async Task<IResult> Plan(
        int id,
        PlanTicketRequest request,
        ITicketPlanningService planning,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (userId, role) = ReadCaller(principal);
        if (userId is null)
        {
            return Unauthorized();
        }

        return await ExecuteAsync(
            () => planning.PlanAsync(id, request, userId.Value, role, cancellationToken));
    }

    private static async Task<IResult> GetAvailability(
        int id,
        int technicianId,
        DateTimeOffset begin,
        DateTimeOffset end,
        ITicketPlanningService planning,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (userId, role) = ReadCaller(principal);
        if (userId is null)
        {
            return Unauthorized();
        }

        return await ExecuteAsync(
            () => planning.GetAvailabilityAsync(id, technicianId, begin, end, userId.Value, role, cancellationToken));
    }

    private static async Task<IResult> Reschedule(
        int id,
        int taskId,
        RescheduleTicketRequest request,
        ITicketPlanningService planning,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (userId, role) = ReadCaller(principal);
        if (userId is null)
        {
            return Unauthorized();
        }

        return await ExecuteAsync(
            () => planning.RescheduleAsync(id, taskId, request, userId.Value, role, cancellationToken));
    }

    private static async Task<IResult> Complete(
        int id,
        int taskId,
        ITicketPlanningService planning,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (userId, role) = ReadCaller(principal);
        if (userId is null)
        {
            return Unauthorized();
        }

        return await ExecuteAsync(
            () => planning.CompleteAsync(id, taskId, userId.Value, role, cancellationToken));
    }

    private static async Task<IResult> Cancel(
        int id,
        int taskId,
        ITicketPlanningService planning,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (userId, role) = ReadCaller(principal);
        if (userId is null)
        {
            return Unauthorized();
        }

        return await ExecuteAsync(
            () => planning.CancelAsync(id, taskId, userId.Value, role, cancellationToken));
    }

    private static (int? UserId, AppRole Role) ReadCaller(ClaimsPrincipal principal) =>
        (principal.GetUserId(), principal.GetRole());

    private static IResult Unauthorized() => Results.Problem(
        statusCode: StatusCodes.Status401Unauthorized,
        title: "Usuario no autenticado",
        detail: "No se encontró el userId en el token JWT.");

    /// <summary>
    /// Maps the application exceptions to the HTTP contract used by the rest of the API.
    /// </summary>
    private static async Task<IResult> ExecuteAsync<T>(Func<Task<T>> action)
    {
        try
        {
            return Results.Ok(await action());
        }
        catch (ForbiddenException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Acceso denegado",
                detail: ex.Message);
        }
        catch (NotFoundException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "No encontrado",
                detail: ex.Message);
        }
        catch (ConflictException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflicto de planificación",
                detail: ex.Message);
        }
        catch (UnprocessableEntityException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status422UnprocessableEntity,
                title: "Operación no válida",
                detail: ex.Message);
        }
        catch (ValidationException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Solicitud inválida",
                detail: ex.Message,
                extensions: new Dictionary<string, object?>
                {
                    ["errors"] = ex.Errors
                });
        }
        catch (GlpiApiException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status502BadGateway,
                title: "Error de GLPI",
                detail: ex.Message);
        }
    }
}
