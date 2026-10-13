using GlpiTicketManager.Application.Dtos.Tickets;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Write-side access to tickets through the GLPI REST API.
/// GLPI is the single source of truth for writes (workflow rules, notifications, logs).
/// </summary>
public interface IGlpiApiClient
{
    Task<int> CreateTicketAsync(CreateTicketRequest request, CancellationToken cancellationToken);

    Task UpdateTicketStatusAsync(int ticketId, int status, CancellationToken cancellationToken);
}
