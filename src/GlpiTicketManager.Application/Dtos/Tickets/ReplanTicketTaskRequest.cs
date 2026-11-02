using System.Text.Json.Serialization;

namespace GlpiTicketManager.Application.Dtos.Tickets;

public sealed record ReplanTicketTaskRequest(
    Guid RequestId,
    string Content,
    [property: JsonConverter(typeof(ExplicitOffsetDateTimeConverter))] DateTimeOffset StartAt,
    [property: JsonConverter(typeof(ExplicitOffsetDateTimeConverter))] DateTimeOffset EndAt);

public sealed record TicketTaskMutationResponse(int TicketId, int TaskId, int TicketStatus);
