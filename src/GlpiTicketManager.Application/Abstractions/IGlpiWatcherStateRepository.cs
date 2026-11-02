namespace GlpiTicketManager.Application.Abstractions;

public sealed record GlpiWatcherPendingTicket(
    int TicketId,
    int CategoryId,
    string TicketName,
    string Status,
    int Attempts,
    DateTime NextRetryAt,
    string? LastError);

public interface IGlpiWatcherStateRepository
{
    Task<int?> GetLastSeenTicketIdAsync(CancellationToken ct = default);
    Task SetLastSeenTicketIdAsync(int lastSeenTicketId, CancellationToken ct = default);
    Task RecordPendingTicketAsync(int ticketId, int categoryId, string ticketName, string status, string? error = null, CancellationToken ct = default);
    Task<IReadOnlyList<GlpiWatcherPendingTicket>> GetPendingTicketsAsync(int limit = 20, CancellationToken ct = default);
    Task<IReadOnlyList<GlpiWatcherPendingTicket>> GetPermanentlyFailedTicketsAsync(int limit = 20, CancellationToken ct = default);
    Task MarkPermanentlyFailedAsync(int ticketId, string reason, CancellationToken ct = default);
    Task<bool> RecoverPendingTicketAsync(int ticketId, CancellationToken ct = default);
    Task RemovePendingTicketAsync(int ticketId, CancellationToken ct = default);
}
