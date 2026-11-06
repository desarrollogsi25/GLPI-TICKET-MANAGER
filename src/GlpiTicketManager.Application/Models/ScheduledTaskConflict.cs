namespace GlpiTicketManager.Application.Models;

/// <summary>
/// A native GLPI TicketTask that occupies part of a technician's calendar.
/// Read from MariaDB only to report conflicts; never used as a shadow schedule.
/// </summary>
public sealed record ScheduledTaskConflict(
    int TaskId,
    int TicketId,
    DateTime StartUtc,
    DateTime EndUtc);
