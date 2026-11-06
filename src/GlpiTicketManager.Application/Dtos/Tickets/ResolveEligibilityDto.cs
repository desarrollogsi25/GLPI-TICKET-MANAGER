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
    /// A ticket can be resolved from Assigned (2) or Planned (3) only when GLPI holds real
    /// work for it: an open (to-do) TicketTask or a completed one. A completed task is
    /// evidence of work done, not "no task": GLPI drops the ticket back to Assigned (2) when
    /// the last task is completed, and that must not block the resolution.
    /// <paramref name="tasks"/> null means the task list could not be determined by the caller
    /// (unit seams); the rule then defers to the status checks only.
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

        if (tasks is null)
        {
            return new(true, "ok", null);
        }

        var open = tasks.Count(t => t.State == TaskTodo);
        var done = tasks.Count(t => t.State == TaskDone);
        if (open > 0) return new(true, "open_task", null);
        if (done > 0) return new(true, "completed_task", null);
        return new(false, "no_task",
            "Programa y realiza al menos una tarea GLPI antes de resolver el ticket.");
    }
}
