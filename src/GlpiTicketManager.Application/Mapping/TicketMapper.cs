using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Mapping;

/// <summary>
/// Maps domain entities to API DTOs.
/// </summary>
public static class TicketMapper
{
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
        ticket.CreatedAt,
        ticket.UpdatedAt,
        ticket.SolvedAt,
        ticket.HasSolution,
        ticket.AssigneeIds,
        ticket.RequesterIds);

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
        ticket.CreatedAt,
        ticket.UpdatedAt,
        ticket.SolvedAt,
        ticket.ClosedAt,
        ticket.AssigneeIds,
        ticket.RequesterIds,
        ticket.Followups.Select(ToDto).ToArray());

    public static TicketFollowupDto ToDto(this TicketFollowup followup) => new(
        followup.Id,
        followup.UserId,
        followup.Content,
        followup.CreatedAt,
        followup.IsPrivate);
}