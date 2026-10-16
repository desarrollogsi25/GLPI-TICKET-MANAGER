using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Application.Authorization;

public interface IDashboardAccessPolicy
{
    Task<DashboardScope> GetScopeAsync(int userId, AppRole role, CancellationToken ct = default);
}

public sealed class DashboardScope
{
    public AppRole Role { get; init; }
    public int? UserId { get; init; }        // Si no es null, filtrar por este
    public IReadOnlyList<int>? GroupIds { get; init; }  // Si no es null, filtrar por estos
    public bool IsGlobal { get; init; }      // true solo para Admin
}

public sealed class DashboardAccessPolicy : IDashboardAccessPolicy
{
    private readonly ITicketRepository _tickets;

    public DashboardAccessPolicy(ITicketRepository tickets)
    {
        _tickets = tickets;
    }

    public async Task<DashboardScope> GetScopeAsync(int userId, AppRole role, CancellationToken ct = default)
    {
        if (role == AppRole.Admin)
        {
            return new DashboardScope
            {
                Role = role,
                IsGlobal = true
            };
        }

        if (role == AppRole.Supervisor)
        {
            var groups = await _tickets.GetGroupIdsForUserAsync(userId, ct);
            return new DashboardScope
            {
                Role = role,
                GroupIds = groups,
                IsGlobal = false
            };
        }

        // Technician
        return new DashboardScope
        {
            Role = role,
            UserId = userId,
            IsGlobal = false
        };
    }
}
