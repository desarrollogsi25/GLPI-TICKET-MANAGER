using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace GlpiTicketManager.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Registers the use-case services (they depend on abstractions implemented in Infrastructure).
    /// </summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ITicketAccessPolicy, TicketAccessPolicy>();
        services.AddScoped<IDashboardAccessPolicy, DashboardAccessPolicy>();
        services.AddScoped<ITicketService, TicketService>();
        services.AddScoped<ITicketPlanningService, TicketPlanningService>();
        services.AddScoped<IAuthService, AuthService>();

        // Deterministic clock for the scheduling rules (future-only starts, duration
        // bounds). Overridable in tests through the same registration.
        services.TryAddSingleton(TimeProvider.System);
        return services;
    }
}
