using System.Text.Json.Serialization;

namespace GlpiTicketManager.Application.Dtos.Integrations;

/// <summary>
/// Webhook payload received when a ticket is created in GLPI (H-35).
/// Accepts common GLPI webhook field naming styles (ticketId, ticket_id, items_id, id).
/// </summary>
public sealed record GlpiTicketCreatedWebhookPayload
{
    [JsonPropertyName("ticketId")]
    public int? TicketId { get; init; }

    [JsonPropertyName("ticket_id")]
    public int? TicketIdSnake { get; init; }

    [JsonPropertyName("items_id")]
    public int? ItemsId { get; init; }

    [JsonPropertyName("id")]
    public int? Id { get; init; }

    [JsonIgnore]
    public int ResolvedTicketId => TicketId ?? TicketIdSnake ?? ItemsId ?? Id ?? 0;
}
