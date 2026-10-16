using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Application.Authorization;

public interface IUserRoleResolver
{
    Task<AppRole> ResolveAsync(int userId, CancellationToken ct = default);
}
