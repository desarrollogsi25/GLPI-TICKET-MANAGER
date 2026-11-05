using System.Text.Json.Serialization;

namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Transition a ticket from state 2 (Asignado) or 4 (Pendiente) to state 3
/// (En proceso / planificado) by scheduling an explicit GLPI TicketTask.
/// </summary>
public sealed record PlanTicketRequest
{
    public Guid RequestId { get; init; }
    public string? Content { get; init; } = string.Empty;

    [JsonConverter(typeof(ExplicitOffsetDateTimeConverter))]
    public DateTimeOffset StartAt { get; init; }

    [JsonConverter(typeof(ExplicitOffsetDateTimeConverter))]
    public DateTimeOffset EndAt { get; init; }

    // Backward-compatible properties for TicketPlanningService:
    public int TechnicianId { get; init; }
    public DateTimeOffset? Begin { get => StartAt; init => StartAt = value ?? default; }
    public DateTimeOffset? End { get => EndAt; init => EndAt = value ?? default; }
    public int? DurationMinutes { get; init; }
    public string? TimeZoneId { get; init; }
    private string? _idempotencyKey;
    public string? IdempotencyKey
    {
        get => _idempotencyKey ?? (RequestId == Guid.Empty ? null : RequestId.ToString());
        init
        {
            _idempotencyKey = value;
            if (Guid.TryParse(value, out var g)) RequestId = g;
        }
    }
    public bool IsPrivate { get; init; } = false;

    public PlanTicketRequest() { }

    public PlanTicketRequest(
        string? content,
        int technicianId,
        DateTimeOffset? begin,
        DateTimeOffset? end,
        int? durationMinutes,
        string? timeZoneId,
        string? idempotencyKey,
        bool isPrivate = false)
    {
        Content = content;
        TechnicianId = technicianId;
        StartAt = begin ?? default;
        EndAt = end ?? default;
        DurationMinutes = durationMinutes;
        TimeZoneId = timeZoneId;
        _idempotencyKey = idempotencyKey;
        if (Guid.TryParse(idempotencyKey, out var g)) RequestId = g;
        IsPrivate = isPrivate;
    }
}

public sealed record PlanTicketResponse(int TicketId, int TaskId, int Status);

/// <summary>
/// Request to move an existing scheduled task. Every member is optional: only the
/// values sent are changed.
/// </summary>
public sealed record RescheduleTicketRequest(
    string? Content,
    int? TechnicianId,
    DateTimeOffset? Begin,
    DateTimeOffset? End,
    int? DurationMinutes,
    string? TimeZoneId,
    bool? IsPrivate);
