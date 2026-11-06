using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Answer to "can this ticket be resolved right now?". Produced by one server-side rule
/// (<see cref="ResolveRule"/>) that the detail view, the Kanban and the resolve endpoints
/// all consume; the UI only renders it.
/// </summary>
public sealed record ResolveEligibilityDto(bool CanResolve, string Code, string? Reason);

public static class ResolveRule
{
    public const int TaskInformation = 0;
    public const int TaskTodo = 1;
    public const int TaskDone = 2;

    /// <summary>
    /// Pure domain rule for ticket resolve eligibility based on status and native GLPI tasks.
    /// Caller permissions are evaluated by TicketService before/alongside this rule.
    /// </summary>
    public static ResolveEligibilityDto Evaluate(int status, IReadOnlyList<TicketTaskDto>? tasks)
    {
        switch (status)
        {
            case (int)TicketStatus.Closed:
                return new(false, "closed", "El ticket está cerrado y no admite una nueva solución.");
            case (int)TicketStatus.Solved:
                return new(false, "already_solved", "El ticket ya fue resuelto.");
            case (int)TicketStatus.Waiting:
                return new(false, "pending",
                    "No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.");
            case (int)TicketStatus.New:
                return new(false, "not_assigned", "Asigna el ticket a un técnico antes de resolverlo.");
        }

        // FAIL-CLOSED: if tasks is null (e.g. communication error with GLPI),
        // we MUST NOT assume permission to resolve.
        if (tasks is null)
        {
            return new(false, "glpi_error",
                "No se pudieron verificar las tareas en GLPI debido a un error de comunicación. Intenta nuevamente.");
        }

        // 1. Un ticket no puede finalizar con tareas obligatorias inconclusas.
        // Si existen tareas pendientes ("Por hacer"), deben completarse o cancelarse antes de resolver.
        var open = tasks.Count(t => t.State == TaskTodo);
        if (open > 0)
        {
            return new(false, "pending_tasks",
                $"El ticket tiene {open} tarea(s) pendiente(s) por hacer. Completa o cancela las tareas antes de resolverlo.");
        }

        // 2. Evidencia de trabajo completado: el ticket tuvo tareas y todas fueron finalizadas.
        var done = tasks.Count(t => t.State == TaskDone);
        if (done > 0) return new(true, "completed_task", null);

        // 3. Resolución directa: ticket asignado sin tareas planificadas.
        return new(true, "direct", null);
    }
}
