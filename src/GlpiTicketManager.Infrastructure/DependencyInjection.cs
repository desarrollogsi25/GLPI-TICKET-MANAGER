using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Infrastructure.BackgroundServices;
using GlpiTicketManager.Infrastructure.Glpi;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Repositories;
using GlpiTicketManager.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace GlpiTicketManager.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers Dapper repositories and the typed GLPI API client.
    /// </summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.SectionName));
        services.AddSingleton<IDbConnectionFactory, MySqlConnectionFactory>();

        services.Configure<AppDbOptions>(configuration.GetSection(AppDbOptions.SectionName));
        services.AddSingleton<IAppDbConnectionFactory>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<AppDbOptions>>().Value;
            return new AppDbConnectionFactory(options);
        });

        services.AddScoped<ITicketRepository, TicketRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IServiceRepository, ServiceRepository>();
        services.AddScoped<IAppSettingsRepository, AppSettingsRepository>();
        services.AddScoped<IUserPreferencesRepository, UserPreferencesRepository>();
        services.AddScoped<IAuditRepository, AuditRepository>();
        services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();
        services.AddScoped<IUserRoleResolver, UserRoleRepository>();
        services.AddScoped<IGroupRepository, GroupRepository>();
        services.AddScoped<IChannelRepository, ChannelRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddHostedService<RevokedTokenCleanupService>();
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();

        services.Configure<GlpiOptions>(configuration.GetSection(GlpiOptions.SectionName));
        services.AddHttpClient<IGlpiApiClient, GlpiApiClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<GlpiOptions>>().Value;

            if (Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var baseUri))
            {
                client.BaseAddress = baseUri;
            }

            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
        });

        return services;
    }
}
