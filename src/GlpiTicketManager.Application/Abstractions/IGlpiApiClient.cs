namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Write-side access to tickets through the GLPI REST API.
/// GLPI is the single source of truth for writes (workflow rules, notifications, logs).
/// </summary>
public interface IGlpiApiClient
{
    Task UpdateTicketStatusAsync(int ticketId, int status, CancellationToken cancellationToken);

    Task<int> CreateSolutionAsync(int ticketId, string content, CancellationToken cancellationToken);
}
