using GlpiTicketManager.Application.Dtos.Groups;

namespace GlpiTicketManager.Application.Abstractions;

public interface IGroupRepository
{
    Task<IReadOnlyList<GroupDto>> GetByEntityAsync(int entityId, CancellationToken ct = default);
    Task<IReadOnlyList<GroupDto>> GetByUserAsync(int userId, CancellationToken ct = default);
}
