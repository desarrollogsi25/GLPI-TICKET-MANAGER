using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Channels;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Application.Services;
using System.Security.Claims;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Api.RateLimiting;

namespace GlpiTicketManager.Api.Endpoints;

public static class TicketEndpoints
{
    public static RouteGroupBuilder MapTicketEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tickets")
            .WithTags("Tickets")
            .RequireAuthorization()
            .RequireRateLimiting(RateLimitPolicies.PerUser);

        // GET /api/tickets (lista con filtros: assigneeId, serviceId, limit, offset)
        group.MapGet(string.Empty, GetTickets)
            .WithName("GetTickets")
            .WithSummary("Tickets list filtered by assignee and/or service (ITIL category)")
            .Produces<PagedResult<TicketSummaryDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized);

        // GET /api/tickets?groupId=X&unassigned=true -> cola del grupo (sin asignar)
        group.MapGet("by-group", GetUnassignedByGroup)
            .WithName("GetUnassignedByGroup")
            .WithSummary("Tickets sin asignar de un grupo concreto")
            .RequireRateLimiting(RateLimitPolicies.Expensive)
            .Produces<PagedResult<TicketSummaryDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:int}", GetById)
            .WithName("GetTicketById")
            .WithSummary("Full ticket detail, including follow-ups")
            .Produces<TicketDetailDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPatch("/{id:int}/status", UpdateStatus)
            .WithName("UpdateTicketStatus")
            .WithSummary("Change the status of a ticket through the GLPI REST API")
            .Accepts<UpdateTicketStatusRequest>("application/json")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/tickets/{id}/claim -> self-assign (tech claims ticket)
        group.MapPost("/{id:int}/claim", Claim)
            .WithName("ClaimTicket")
            .WithSummary("Technician claims a New ticket (status 1) from his group")
            .Produces<TicketSummaryDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/tickets/{id}/solutions -> inserta solucion escrita (ADR-006)
        group.MapPost("/{id:int}/solutions", CreateSolution)
            .WithName("CreateSolution")
            .WithSummary("Insert a written solution into glpi_itilsolutions")
            .Accepts<SolutionRequest>("application/json")
            .Produces<SolutionResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/tickets/{id}/reopen -> reabre ticket resuelto/cerrado
        group.MapPost("/{id:int}/reopen", Reopen)
            .WithName("ReopenTicket")
            .WithSummary("Reopen a solved or closed ticket back to status 2 (assigned)")
            .Accepts<ReopenTicketRequest>("application/json")
            .Produces<TicketDetailDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .RequireRateLimiting(RateLimitPolicies.PerUser);

        return group;
    }

    private static async Task<IResult> GetTickets(
        int? assigneeId,
        int? serviceId,
        ITicketService ticketService,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken,
        int? limit = null,
        int? offset = null)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // BOLA fix: Client-provided assigneeId is ignored; always filter by authenticated user.
        var effectiveAssigneeId = userId.Value;

        var result = await ticketService.GetFilteredAsync(
            effectiveAssigneeId,
            serviceId,
            limit ?? 0,
            offset ?? 0,
            cancellationToken);

        return Results.Ok(result);
    }

    private static async Task<IResult> GetUnassignedByGroup(
        int? groupId,
        ITicketService ticketService,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken,
        int? limit = null,
        int? offset = null)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var role = principal.GetRole();

        // QA: groupId es opcional. El front envia undefined cuando el usuario no tiene
        // grupo de soporte asignado; antes eso rompia el binding (500). Se normaliza a 0
        // y el servicio responde 200 con la cola vacia.
        var effectiveGroupId = groupId.GetValueOrDefault();

        try
        {
            var result = await ticketService.GetUnassignedByGroupAsync(
                effectiveGroupId,
                userId.Value,
                role,
                limit ?? 20,
                offset ?? 0,
                cancellationToken);

            return Results.Ok(result);
        }
        catch (ForbiddenException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Acceso denegado",
                detail: ex.Message);
        }
    }

    private static async Task<IResult> GetById(
        int id,
        ITicketService ticketService,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var role = principal.GetRole();

        try
        {
            var ticket = await ticketService.GetByIdAsync(id, userId.Value, role, cancellationToken);
            return ticket is null ? Results.NotFound() : Results.Ok(ticket);
        }
        catch (ForbiddenException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Acceso denegado",
                detail: ex.Message);
        }
    }

    private static async Task<IResult> UpdateStatus(
        int id,
        UpdateTicketStatusRequest request,
        ITicketService ticketService,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var role = principal.GetRole();

        try
        {
            var updated = await ticketService.UpdateStatusAsync(id, request.Status, userId.Value, role, cancellationToken);
            return updated ? Results.NoContent() : Results.NotFound();
        }
        catch (ForbiddenException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Acceso denegado",
                detail: ex.Message);
        }
    }

    private static async Task<IResult> Claim(
        int id,
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

        var role = principal.GetRole();

        try
        {
            var result = await ticketService.ClaimAsync(id, userId.Value, role, cancellationToken);
            return Results.Ok(result);
        }
        catch (ForbiddenException ex)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Acceso denegado",
                detail: ex.Message);
        }
    }

    private static async Task<IResult> CreateSolution(
        SolutionRequest request,
        int id,
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

        var role = principal.GetRole();

        try
        {
            var solutionId = await ticketService.SolutionInsertAsync(
                id, request.Content, userId.Value, role, cancellationToken);

            return Results.Created($"/api/tickets/{id}/solutions/{solutionId}", new SolutionResponse(solutionId));
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
                title: "Ticket no encontrado",
                detail: ex.Message);
        }
    }

    private static async Task<IResult> Reopen(
        int id,
        ReopenTicketRequest? request,
        ITicketService ticketService,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var userId = principal.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var role = principal.GetRole();

        var ticket = await ticketService.ReopenAsync(
            id,
            userId.Value,
            role,
            request?.Reason,
            cancellationToken);

        return Results.Ok(ticket);
    }
}