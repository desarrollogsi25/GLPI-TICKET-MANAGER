namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Full ticket representation, including description and follow-ups.
/// </summary>
public sealed record TicketDetailDto(
    int Id,
    string Title,
    string? Content,
    int Status,
    string StatusLabel,
    int Type,
    string TypeLabel,
    int Priority,
    string PriorityLabel,
    int Urgency,
    int Impact,
    int? CategoryId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? SolvedAt,
    DateTime? ClosedAt,
    IReadOnlyList<int> AssigneeIds,
    IReadOnlyList<int> RequesterIds,
    IReadOnlyList<TicketFollowupDto> Followups,
    IReadOnlyList<TicketSolutionDto> Solutions,
    DateTime? NextPlannedAt = null,
    int? NextPlannedTechnicianId = null,
    int? NextPlannedDuration = null,
    string? NextPlannedComment = null,
    int? GroupId = null,
    string? GroupName = null);
