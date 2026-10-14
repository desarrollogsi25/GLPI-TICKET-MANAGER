using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Abstractions;

public interface IUserPreferencesRepository
{
    Task<UserPreference?> GetAsync(int userId, CancellationToken ct = default);
    Task UpsertAsync(int userId, string prefs, CancellationToken ct = default);
    Task<bool> DeleteAsync(int userId, CancellationToken ct = default);
}
