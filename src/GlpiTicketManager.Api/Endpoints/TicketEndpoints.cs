using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Channels;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Application.Services;
using System.Security.Claims;
using GlpiTicketManager.Api.Auth;

namespace GlpiTicketManager.Api.Endpoints;

public static class TicketEndpoints
{
    public static RouteGroupBuilder MapTicketEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tickets")
            .WithTags("Tickets")
            .RequireAuthorization();

        // GET /api/tickets (lista por assignee, con filtros opcionales)
        group.MapGet(string.Empty, GetByAssignee)
            .WithName("GetTicketsByAssignee")
            .WithSummary("Tickets assigned to a technician (glpi_tickets_users.type = 2)")
            .Produces<PagedResult<TicketSummaryDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized);

        // GET /api/tickets?groupId=X&unassigned=true -> cola del grupo (sin asignar)
        group.MapGet("by-group", GetUnassignedByGroup)
            .WithName("GetUnassignedByGroup")
            .WithSummary("Tickets sin asignar de un grupo concreto")
            .Produces<PagedResult<TicketSummaryDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:int}", GetById)
            .WithName("GetTicketById")
            .WithSummary("Full ticket detail, including follow-ups")
            .Produces<TicketDetailDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost(string.Empty, Create)
            .WithName("CreateTicket")
            .WithSummary("Create a ticket through the GLPI REST API")
            .Accepts<CreateTicketRequest>("application/json")
            .Produces<CreatedTicketResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPatch("/{id:int}/status", UpdateStatus)
            .WithName("UpdateTicketStatus")
            .WithSummary("Change the status of a ticket through the GLPI REST API")
            .Accepts<UpdateTicketStatusRequest>("application/json")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .Produces(StatusCodes.Status401Unauthorized);

        // POST /api/tickets/{id}/claim -> self-assign (tech claims ticket)
        group.MapPost("/{id:int}/claim", Claim)
            .WithName("ClaimTicket")
            .WithSummary("Technician claims a New ticket (status 1) from his group")
            .Produces<TicketSummaryDto>(StatusCodes.Status200OK)
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
            .Produces(StatusCodes.Status401Unauthorized);

        return group;
    }

    private static async Task<IResult> GetByAssignee(
        int assigneeId,
        ITicketService ticketService,
        CancellationToken cancellationToken,
        int? limit = null,
        int? offset = null)
    {
        var result = await ticketService.GetByAssigneeAsync(
            assigneeId,
            limit ?? 0,
            offset ?? 0,
            cancellationToken);

        return Results.Ok(result);
    }

    private static async Task<IResult> GetUnassignedByGroup(
        int groupId,
        ITicketService ticketService,
        CancellationToken cancellationToken,
        int? limit = null,
        int? offset = null)
    {
        var result = await ticketService.GetUnassignedByGroupAsync(
            groupId,
            limit ?? 20,
            offset ?? 0,
            cancellationToken);

        return Results.Ok(result);
    }

    private static async Task<IResult> GetById(
        int id,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        var ticket = await ticketService.GetByIdAsync(id, cancellationToken);
        return ticket is null ? Results.NotFound() : Results.Ok(ticket);
    }

    private static async Task<IResult> Create(
        CreateTicketRequest request,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        var id = await ticketService.CreateAsync(request, cancellationToken);
        return Results.Created($"/api/tickets/{id}", new CreatedTicketResponse(id));
    }

    private static async Task<IResult> UpdateStatus(
        int id,
        UpdateTicketStatusRequest request,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        // Validacion ADR-006: si se quiere Solved (5), verificar que existe solucion escrita
        if (request.Status == 5)
        {
            var solutionExists = await ticketService.SolutionExistsAsync(
                id, cancellationToken);

            if (!solutionExists)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status422UnprocessableEntity,
                    title: "Ticket no puede marcarse como resuelto sin solucion escrita.",
                    detail: "No hay ninguna entrada en glpi_itilsolutions para este ticket.");
            }
        }

        var updated = await ticketService.UpdateStatusAsync(id, request.Status, cancellationToken);
        return updated ? Results.NoContent() : Results.NotFound();
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

        // Validar que el usuario pertenece al grupo del ticket
        var ticket = await ticketService.GetByIdAsync(id, cancellationToken);
        if (ticket is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Ticket no encontrado",
                detail: "El ticket solicitado no existe.");
        }

        // El ticket debe estar en estado New (1) y sin assignee
        if (ticket.Status != 1)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "No se puede reclamar el ticket",
                detail: "El ticket debe estar en estado 'Nuevo' (1) y sin asignar.");
        }

        // Verificar membresia en el grupo del ticket
        // El ticket's group se obtiene de glpi_groups_tickets (type=2)
        // El usuario debe estar en glpi_groups_users del mismo groupId
        bool isMember = await ticketService.IsUserInTicketGroupAsync(
            id, userId.Value, cancellationToken);

        if (!isMember)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "No pertenece al grupo del ticket",
                detail: "El usuario autenticado no es miembro del grupo al que pertenece este ticket.");
        }

        // Ejecutar claim (INSERT glpi_tickets_users + UPDATE status)
        bool claimed = await ticketService.ClaimAsync(
            id, userId.Value, userId.Value, cancellationToken);

        if (!claimed)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "No se pudo reclamar el ticket",
                detail: "Ocurrio un error al reclamar el ticket. Intentelo de nuevo.");
        }

        // Devolver el ticket actualizado
        var result = await ticketService.GetByIdAsync(id, cancellationToken);
        return result is not null ? Results.Ok(result) : Results.NotFound();
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

        // Cargar el ticket para verificar que existe
        var ticket = await ticketService.GetByIdAsync(id, cancellationToken);
        if (ticket is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Ticket no encontrado",
                detail: "El ticket solicitado no existe.");
        }

        // Ejecutar INSERT INTO glpi_itilsolutions
        var solutionId = await ticketService.SolutionInsertAsync(
            id, request.Content, userId.Value, cancellationToken);

        return Results.Created($"/api/tickets/{id}/solutions/{solutionId}", new SolutionResponse(solutionId));
    }
}

/// <summary>Minimal response returned after creating a ticket.</summary>
public sealed record CreatedTicketResponse(int Id);