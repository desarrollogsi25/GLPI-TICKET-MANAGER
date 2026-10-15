using GlpiTicketManager.Application.Dtos.Services;

namespace GlpiTicketManager.Application.Abstractions;

public interface IServiceRepository
{
    Task<IReadOnlyList<ServiceDto>> GetAllAsync(CancellationToken ct = default);
}
