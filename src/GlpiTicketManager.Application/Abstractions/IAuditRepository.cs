using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Abstractions;

public interface IAuditRepository
{
    Task<long> LogAsync(int userId, string action, int? ticketId, string? details, CancellationToken ct = default);
    Task<IReadOnlyList<AuditEntry>> GetByUserAsync(int userId, int limit, CancellationToken ct = default);
    Task<IReadOnlyList<AuditEntry>> GetByTicketAsync(int ticketId, CancellationToken ct = default);
    Task<int> PurgeOlderThanAsync(DateTime cutoff, CancellationToken ct = default);
}
