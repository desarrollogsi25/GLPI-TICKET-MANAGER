using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Mapping;

/// <summary>
/// Maps domain entities to API DTOs.
/// </summary>
public static class TicketMapper
{
    public static DateTime AsUtc(this DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    public static DateTime? AsUtc(this DateTime? dt) =>
        dt.HasValue ? AsUtc(dt.Value) : null;

    public static (DateTime SlaDeadline, string SlaStatus) CalculateSla(int priority, DateTime createdAt, int status, DateTime? solvedAt)
    {
        var createdUtc = createdAt.AsUtc();
        var hours = priority switch
        {
            >= 4 => 4,   // Alta (4) / Muy alta (5) -> 4 horas
            3 => 24,     // Media (3) -> 24 horas
            _ => 48      // Baja (2) / Muy baja (1) -> 48 horas
        };

        var deadline = createdUtc.AddHours(hours);
        var nowUtc = DateTime.UtcNow;

        if (status is 5 or 6)
        {
            var resolvedTime = solvedAt?.AsUtc() ?? nowUtc;
            var onTime = resolvedTime <= deadline;
            return (deadline, onTime ? "On Time" : "Overdue");
        }

        if (nowUtc > deadline)
        {
            return (deadline, "Overdue");
        }

        var totalDuration = TimeSpan.FromHours(hours);
        var remaining = deadline - nowUtc;
        if (remaining.TotalSeconds <= totalDuration.TotalSeconds * 0.20)
        {
            return (deadline, "At Risk");
        }

        return (deadline, "On Time");
    }

    public static TicketSummaryDto ToSummary(this Ticket ticket)
    {
        var (slaDeadline, slaStatus) = CalculateSla(ticket.Priority, ticket.CreatedAt, ticket.Status, ticket.SolvedAt);
        return new(
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
            ticket.CreatedAt.AsUtc(),
            ticket.UpdatedAt.AsUtc(),
            ticket.SolvedAt.AsUtc(),
            ticket.HasSolution,
            ticket.AssigneeIds,
            ticket.RequesterIds,
            slaDeadline,
            slaStatus);
    }

    public static TicketDetailDto ToDetail(this Ticket ticket)
    {
        var (slaDeadline, slaStatus) = CalculateSla(ticket.Priority, ticket.CreatedAt, ticket.Status, ticket.SolvedAt);
        return new(
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
            ticket.CreatedAt.AsUtc(),
            ticket.UpdatedAt.AsUtc(),
            ticket.SolvedAt.AsUtc(),
            ticket.ClosedAt.AsUtc(),
            ticket.AssigneeIds,
            ticket.RequesterIds,
            ticket.Followups.Select(ToDto).ToArray(),
            ticket.Solutions.Select(ToDto).ToArray(),
            slaDeadline,
            slaStatus);
    }

    public static TicketFollowupDto ToDto(this TicketFollowup followup) => new(
        followup.Id,
        followup.UserId,
        followup.Content,
        followup.CreatedAt.AsUtc(),
        followup.IsPrivate);

    public static TicketSolutionDto ToDto(this TicketSolution solution) => new(
        solution.Id,
        solution.UserId,
        solution.Content,
        solution.CreatedAt.AsUtc());
}