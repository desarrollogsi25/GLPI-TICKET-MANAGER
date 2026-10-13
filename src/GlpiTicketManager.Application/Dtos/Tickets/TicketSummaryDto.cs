namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Compact ticket representation used in lists and kanban columns.
/// </summary>
public sealed record TicketSummaryDto(
    int Id,
    string Title,
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
    IReadOnlyList<int> AssigneeIds,
    IReadOnlyList<int> RequesterIds);
