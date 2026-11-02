using System.Text.Json.Serialization;

namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// A scheduled GLPI task is the only valid way to enter native status 3.
/// Explicit offsets prevent the API from guessing a timezone during DST changes.
/// </summary>
public sealed record PlanTicketRequest
{
    public Guid RequestId { get; init; }
    public string Content { get; init; } = string.Empty;
    [JsonConverter(typeof(ExplicitOffsetDateTimeConverter))]
    public DateTimeOffset StartAt { get; init; }
    [JsonConverter(typeof(ExplicitOffsetDateTimeConverter))]
    public DateTimeOffset EndAt { get; init; }
}

public sealed record PlanTicketResponse(int TicketId, int TaskId, int Status);
