using GlpiTicketManager.Application.Abstractions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Infrastructure.BackgroundServices;

public sealed class RevokedTokenCleanupService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RevokedTokenCleanupService> _logger;

    public RevokedTokenCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<RevokedTokenCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Primera ejecución: no esperar una hora antes del primer purge.
        await PurgeOnceAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(Interval, stoppingToken);
                await PurgeOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task PurgeOnceAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IRevokedTokenRepository>();
            var purged = await repo.PurgeExpiredAsync(ct);

            if (purged > 0)
                _logger.LogInformation("Purged {Count} expired revoked tokens", purged);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error purging expired revoked tokens");
        }
    }
}
