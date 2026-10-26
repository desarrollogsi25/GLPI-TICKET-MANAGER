using GlpiTicketManager.Application.Models;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Write-side access to tickets through the GLPI REST API.
/// GLPI is the single source of truth for writes (workflow rules, notifications, logs).
/// </summary>
public interface IGlpiApiClient
{
    Task UpdateTicketStatusAsync(int ticketId, int status, CancellationToken cancellationToken);

    Task<int> CreateSolutionAsync(int ticketId, string content, CancellationToken cancellationToken);

    /// <summary>
    /// Reads the ticket state back from GLPI.
    ///
    /// BUG-032 / H-31: after writing a status change or a solution, the resulting
    /// state has to be read from GLPI itself. Reading the ticket from MariaDB would
    /// only prove that GLPI's own table says something, not that the write landed.
    /// Returns null when GLPI does not know the ticket.
    /// </summary>
    Task<GlpiTicketState?> GetTicketStateAsync(int ticketId, CancellationToken cancellationToken);

    Task ReopenTicketAsync(int ticketId, CancellationToken cancellationToken);

    Task<int> CreateFollowupAsync(int ticketId, string content, bool isPrivate, CancellationToken cancellationToken);

    Task<int> CreateTicketAsync(
        string title,
        string description,
        int urgency,
        int? categoryId,
        int requesterUserId,
        int? assignmentGroupId,
        CancellationToken cancellationToken);
}
