using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Mapping;

/// <summary>
/// Maps domain entities to API DTOs.
/// </summary>
public static class TicketMapper
{
    private static DateTime AsUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    private static DateTime? AsUtc(DateTime? dt) =>
        dt.HasValue ? AsUtc(dt.Value) : null;

    public static TicketSummaryDto ToSummary(this Ticket ticket) => new(
        ticket.Id,
        ticket.Name,
        ticket.Status,
        TicketLabels.Status(ticket.Status),
        ticket.Type,
        TicketLabels.Type(ticket.Type),
        ticket.Priority,
        TicketLabels.Priority(ticket.Priority),
        ticket.Urgency,
        ticket.Impact,
        ticket.CategoryId,
        AsUtc(ticket.CreatedAt),
        AsUtc(ticket.UpdatedAt),
        AsUtc(ticket.SolvedAt),
        ticket.HasSolution,
        ticket.AssigneeIds,
        ticket.RequesterIds,
        AsUtc(ticket.NextPlannedAt),
        ticket.NextPlannedTechnicianId,
        ticket.NextPlannedDuration,
        ticket.NextPlannedComment,
        ticket.GroupId,
        ticket.GroupName);

    public static TicketDetailDto ToDetail(this Ticket ticket) => new(
        ticket.Id,
        ticket.Name,
        ticket.Content,
        ticket.Status,
        TicketLabels.Status(ticket.Status),
        ticket.Type,
        TicketLabels.Type(ticket.Type),
        ticket.Priority,
        TicketLabels.Priority(ticket.Priority),
        ticket.Urgency,
        ticket.Impact,
        ticket.CategoryId,
        AsUtc(ticket.CreatedAt),
        AsUtc(ticket.UpdatedAt),
        AsUtc(ticket.SolvedAt),
        AsUtc(ticket.ClosedAt),
        ticket.AssigneeIds,
        ticket.RequesterIds,
        ticket.Followups.Select(ToDto).ToArray(),
        ticket.Solutions.Select(ToDto).ToArray(),
        AsUtc(ticket.NextPlannedAt),
        ticket.NextPlannedTechnicianId,
        ticket.NextPlannedDuration,
        ticket.NextPlannedComment,
        ticket.GroupId,
        ticket.GroupName);

    public static TicketFollowupDto ToDto(this TicketFollowup followup) => new(
        followup.Id,
        followup.UserId,
        followup.Content,
        AsUtc(followup.CreatedAt),
        followup.IsPrivate);

    public static TicketSolutionDto ToDto(this TicketSolution solution) => new(
        solution.Id,
        solution.UserId,
        solution.Content,
        AsUtc(solution.CreatedAt));
}
