using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Domain.Entities;

/// <summary>
/// A GLPI ticket task read directly from the database (<c>glpi_tickettasks</c>).
/// </summary>
/// <remarks>
/// Reads only. Every mutation goes through the GLPI REST API so that GLPI keeps
/// ownership of the workflow, the notifications and the timeline.
/// </remarks>
public sealed class TicketTask
{
    public int Id { get; init; }

    /// <summary>
    /// Client-supplied idempotency key. GLPI stores it in <c>glpi_tickettasks.uuid</c>
    /// and keeps it unique per task, which is what lets a retried request find the
    /// task it already created instead of duplicating it.
    /// </summary>
    public string? Uuid { get; init; }

    public int TicketId { get; init; }

    public string Content { get; init; } = string.Empty;

    public int State { get; init; }

    public DateTime? Begin { get; init; }

    public DateTime? End { get; init; }

    /// <summary>Duration in seconds, as GLPI stores it.</summary>
    public int ActionTime { get; init; }

    public int TechnicianId { get; init; }

    public int GroupId { get; init; }

    public bool IsPrivate { get; init; }

    public DateTime? CreatedAt { get; init; }

    public DateTime? UpdatedAt { get; init; }

    /// <summary>
    /// True when GLPI counts this task as scheduled: still to do and with a start
    /// date. This mirrors <c>CommonITILTask::countPlannedTasks()</c>, the query GLPI
    /// itself uses to decide whether the ticket is "En proceso (planificado)".
    /// </summary>
    public bool IsPlanned => State == (int)TicketTaskState.ToDo && Begin.HasValue;
}
