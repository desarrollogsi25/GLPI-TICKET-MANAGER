using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Application.Dtos.Tickets;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Write-side access to tickets through the GLPI REST API.
/// GLPI is the single source of truth for writes (workflow rules, notifications, logs).
/// </summary>
public interface IGlpiApiClient
{
    Task UpdateTicketStatusAsync(int ticketId, int status, CancellationToken cancellationToken);

    Task<int> CreateSolutionAsync(int ticketId, string content, CancellationToken cancellationToken);
    Task<int> CreateSolutionAsync(int ticketId, string content, int? userId, CancellationToken cancellationToken);

    Task UpdateSolutionStatusAsync(int solutionId, int status, CancellationToken cancellationToken);

    /// <summary>Create a native, scheduled TODO TicketTask (GLPI owns the status change).</summary>
    Task<int> CreatePlannedTaskAsync(
        int ticketId, int technicianId, string content, DateTimeOffset startAt,
        DateTimeOffset endAt, CancellationToken cancellationToken);

    /// <summary>Read native GLPI TicketTasks, including scheduled and completed tasks.</summary>
    Task<IReadOnlyList<TicketTaskDto>> GetTicketTasksAsync(int ticketId, CancellationToken cancellationToken);

    Task UpdateTicketTaskAsync(int taskId, int state, CancellationToken cancellationToken);

    Task ReplanTicketTaskAsync(int taskId, string content, DateTimeOffset startAt,
        DateTimeOffset endAt, CancellationToken cancellationToken);

    Task DeleteTicketTaskAsync(int taskId, CancellationToken cancellationToken);

    Task<GlpiTicketTask> CreateTicketTaskAsync(
        CreateTicketTaskRequest request,
        CancellationToken cancellationToken);

    Task<GlpiTicketTask?> GetTicketTaskAsync(int taskId, CancellationToken cancellationToken);

    Task<IReadOnlyList<GlpiTicketTask>> GetGlpiTicketTasksAsync(int ticketId, CancellationToken cancellationToken);

    Task<GlpiTicketTask?> UpdateTicketTaskAsync(
        int taskId,
        UpdateTicketTaskRequest request,
        CancellationToken cancellationToken);
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
    Task<int> CreateFollowupAsync(int ticketId, string content, bool isPrivate, int? userId, CancellationToken cancellationToken);

    Task<int> CreateTicketAsync(
        string title,
        string description,
        int urgency,
        int? categoryId,
        int requesterUserId,
        int? assignmentGroupId,
        CancellationToken cancellationToken);
}
