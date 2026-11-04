using System.Data.Common;
using System.Text.Json;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WebPush;

namespace GlpiTicketManager.Infrastructure.Services;

public sealed class WebPushNotificationSender : IPushNotificationSender
{
    private readonly IPushSubscriptionRepository _subscriptionRepo;
    private readonly IAppDbConnectionFactory _factory;
    private readonly IConfiguration _config;
    private readonly ILogger<WebPushNotificationSender> _logger;
    private readonly WebPushClient _client;
    private VapidDetails? _vapidDetails;
    private readonly object _lock = new();

    public WebPushNotificationSender(
        IPushSubscriptionRepository subscriptionRepo,
        IAppDbConnectionFactory factory,
        IConfiguration config,
        ILogger<WebPushNotificationSender> logger)
    {
        _subscriptionRepo = subscriptionRepo;
        _factory = factory;
        _config = config;
        _logger = logger;
        _client = new WebPushClient();
    }

    private VapidDetails EnsureVapidDetails()
    {
        if (_vapidDetails is not null) return _vapidDetails;

        lock (_lock)
        {
            if (_vapidDetails is not null) return _vapidDetails;

            var configuredPublic = _config["WebPush:VapidPublicKey"] ?? Environment.GetEnvironmentVariable("WEBPUSH_VAPID_PUBLIC_KEY");
            var configuredPrivate = _config["WebPush:VapidPrivateKey"] ?? Environment.GetEnvironmentVariable("WEBPUSH_VAPID_PRIVATE_KEY");
            var subject = _config["WebPush:Subject"] ?? "mailto:support@glpi.local";

            if (!string.IsNullOrWhiteSpace(configuredPublic) && !string.IsNullOrWhiteSpace(configuredPrivate))
            {
                _vapidDetails = new VapidDetails(subject, configuredPublic, configuredPrivate);
                return _vapidDetails;
            }

            // Fallback to durable storage in app_settings table
            try
            {
                using var conn = _factory.CreateAsync().GetAwaiter().GetResult();
                var dbConn = (DbConnection)conn;

                const string selectSql = "SELECT key, value FROM app_settings WHERE key IN ('webpush.vapid.public_key', 'webpush.vapid.private_key');";
                var rows = dbConn.Query<(string Key, string Value)>(selectSql).ToDictionary(r => r.Key, r => r.Value);

                if (rows.TryGetValue("webpush.vapid.public_key", out var pubKey) &&
                    rows.TryGetValue("webpush.vapid.private_key", out var privKey) &&
                    !string.IsNullOrWhiteSpace(pubKey) && !string.IsNullOrWhiteSpace(privKey))
                {
                    _vapidDetails = new VapidDetails(subject, pubKey, privKey);
                    return _vapidDetails;
                }

                // Generate new persistent VAPID keys
                var keys = VapidHelper.GenerateVapidKeys();
                const string insertSql = """
                    INSERT INTO app_settings (key, value, updated_at)
                    VALUES ('webpush.vapid.public_key', @PubKey, NOW()),
                           ('webpush.vapid.private_key', @PrivKey, NOW())
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
                    """;
                dbConn.Execute(insertSql, new { PubKey = keys.PublicKey, PrivKey = keys.PrivateKey });

                _logger.LogInformation("Generated and saved new persistent VAPID keys in app_settings.");
                _vapidDetails = new VapidDetails(subject, keys.PublicKey, keys.PrivateKey);
                return _vapidDetails;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not load/save VAPID keys to app_settings, using ephemeral VAPID keys.");
                var ephemeral = VapidHelper.GenerateVapidKeys();
                _vapidDetails = new VapidDetails(subject, ephemeral.PublicKey, ephemeral.PrivateKey);
                return _vapidDetails;
            }
        }
    }

    public string GetVapidPublicKey()
    {
        return EnsureVapidDetails().PublicKey;
    }

    public async Task<int> SendPushAsync(int userId, string title, string body, string? url = null, CancellationToken ct = default)
    {
        var subscriptions = await _subscriptionRepo.GetSubscriptionsByUserAsync(userId, ct);
        if (subscriptions.Count == 0) return 0;

        var vapid = EnsureVapidDetails();
        var payload = JsonSerializer.Serialize(new
        {
            title,
            body,
            url = string.IsNullOrWhiteSpace(url) ? "/kanban" : url,
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        });

        int successCount = 0;
        foreach (var sub in subscriptions)
        {
            try
            {
                var pushSub = new WebPush.PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                await _client.SendNotificationAsync(pushSub, payload, vapid, ct);
                await _subscriptionRepo.UpdateLastUsedAsync(sub.Endpoint, ct);
                successCount++;
            }
            catch (WebPushException wpe)
            {
                _logger.LogWarning("WebPush failed for endpoint {Endpoint}: status {Status}", sub.Endpoint, wpe.StatusCode);
                // 404 or 410 means subscription expired or was revoked by browser
                if (wpe.StatusCode == System.Net.HttpStatusCode.Gone || wpe.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    await _subscriptionRepo.DeleteByEndpointAsync(sub.Endpoint, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Unexpected error delivering WebPush to {Endpoint}", sub.Endpoint);
            }
        }

        return successCount;
    }
}
