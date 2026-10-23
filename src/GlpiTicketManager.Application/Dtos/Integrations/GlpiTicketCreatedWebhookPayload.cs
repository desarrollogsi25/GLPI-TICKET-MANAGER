using System.Text.Json.Serialization;

namespace GlpiTicketManager.Application.Dtos.Integrations;

/// <summary>
/// Webhook payload received when a ticket is created in GLPI (H-35).
/// Accepts common GLPI webhook field naming styles (ticketId, ticket_id, items_id, id).
/// </summary>
public sealed class GlpiTicketCreatedWebhookPayload
{
    [JsonPropertyName("ticketId")]
    public int TicketId { get; set; }

    [JsonPropertyName("ticket_id")]
    public int TicketIdSnake { get; set; }

    [JsonPropertyName("items_id")]
    public int ItemsId { get; set; }

    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonIgnore]
    public int ResolvedTicketId => TicketId != 0 ? TicketId : (TicketIdSnake != 0 ? TicketIdSnake : (ItemsId != 0 ? ItemsId : Id));
}
