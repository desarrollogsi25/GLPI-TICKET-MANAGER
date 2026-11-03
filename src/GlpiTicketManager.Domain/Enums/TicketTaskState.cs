namespace GlpiTicketManager.Domain.Enums;

/// <summary>
/// State of a GLPI ticket task (column <c>glpi_tickettasks.state</c>).
/// </summary>
/// <remarks>
/// GLPI only persists two task states (<c>Planning::TODO</c> and <c>Planning::DONE</c>).
/// A task counts as "planned" when <see cref="ToDo"/> and <c>begin</c> is not null; that
/// combination is what makes GLPI move the parent ticket to status 3.
/// </remarks>
public enum TicketTaskState
{
    ToDo = 1,
    Done = 2
}
