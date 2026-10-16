using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Services;
using Microsoft.Extensions.DependencyInjection;

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
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
