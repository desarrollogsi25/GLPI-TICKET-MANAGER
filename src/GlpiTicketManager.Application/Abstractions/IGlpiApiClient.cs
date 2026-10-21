namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Write-side access to tickets through the GLPI REST API.
/// GLPI is the single source of truth for writes (workflow rules, notifications, logs).
/// </summary>
public interface IGlpiApiClient
{
    Task UpdateTicketStatusAsync(int ticketId, int status, CancellationToken cancellationToken);

    Task<int> CreateSolutionAsync(int ticketId, string content, CancellationToken cancellationToken);

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
