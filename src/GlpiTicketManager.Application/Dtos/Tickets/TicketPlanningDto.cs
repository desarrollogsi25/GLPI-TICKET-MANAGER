namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// One scheduled task of a ticket, as GLPI reports it.
/// </summary>
public sealed record TicketPlanningTaskDto(
    int Id,
    string? Uuid,
    int TicketId,
    string Content,
    int State,
    string StateLabel,
    DateTime? Begin,
    DateTime? End,
    int ActionTime,
    int TechnicianId,
    int GroupId,
    bool IsPrivate,
    bool IsPlanned);

/// <summary>
/// Planning of a ticket plus the authoritative status GLPI reports for it.
/// </summary>
/// <remarks>
/// <see cref="Status"/> is read back from GLPI after every mutation; it is never the
/// status the client asked for. That is what proves the scheduled task really drove the
/// ticket to "En proceso (planificado)".
/// </remarks>
public sealed record TicketPlanningDto(
    int TicketId,
    int Status,
    string StatusLabel,
    DateTime? NextPlannedAt,
    int? NextPlannedTechnicianId,
    IReadOnlyList<TicketPlanningTaskDto> Tasks);

/// <summary>A scheduled task that already occupies the requested slot.</summary>
public sealed record TicketTaskConflictDto(
    int TaskId,
    int TicketId,
    int TechnicianId,
    DateTime? Begin,
    DateTime? End);

/// <summary>
/// Result of asking whether a technician can take a given slot.
/// </summary>
public sealed record TicketAvailabilityDto(
    bool Available,
    bool InsideWorkingHours,
    string? Message,
    IReadOnlyList<TicketTaskConflictDto> Conflicts);
