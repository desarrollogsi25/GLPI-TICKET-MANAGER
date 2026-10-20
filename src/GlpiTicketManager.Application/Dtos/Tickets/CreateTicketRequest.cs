using System.ComponentModel.DataAnnotations;

namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Payload to create a ticket by a requester (or system).
/// </summary>
public sealed record CreateTicketRequest
{
    [Required(ErrorMessage = "El título es obligatorio.")]
    [MinLength(5, ErrorMessage = "El título debe tener al menos 5 caracteres.")]
    public string Title { get; init; } = string.Empty;

    [Required(ErrorMessage = "La descripción es obligatoria.")]
    [MinLength(10, ErrorMessage = "La descripción debe tener al menos 10 caracteres.")]
    public string Description { get; init; } = string.Empty;

    [Range(1, 5, ErrorMessage = "La urgencia debe ser un valor entre 1 y 5.")]
    public int Urgency { get; init; } = 3;

    public int? CategoryId { get; init; }
}
