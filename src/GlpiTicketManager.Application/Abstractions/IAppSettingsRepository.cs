using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Abstractions;

public interface IAppSettingsRepository
{
    Task<AppSetting?> GetAsync(string key, CancellationToken ct = default);
    Task<IReadOnlyDictionary<string, string>> GetAllAsync(CancellationToken ct = default);
    Task UpsertAsync(string key, string value, int updatedBy, CancellationToken ct = default);
    Task<bool> DeleteAsync(string key, CancellationToken ct = default);
}
