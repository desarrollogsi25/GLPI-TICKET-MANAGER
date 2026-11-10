namespace GlpiTicketManager.Application.Dtos.Tickets;

// Busy periods deliberately omit ticket IDs, titles, task content and privacy flags.
public sealed record BusyPeriodDto(DateTime StartAt, DateTime EndAt);
public sealed record PlanningAvailabilityDto(bool Available, IReadOnlyList<BusyPeriodDto> Busy,
    DateTimeOffset? SuggestedStart);
