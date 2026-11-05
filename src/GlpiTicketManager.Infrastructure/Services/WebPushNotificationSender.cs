using System.Data.Common;
using System.Text.Json;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Notifications;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WebPush;

namespace GlpiTicketManager.Infrastructure.Services;

public sealed class WebPushNotificationSender : IPushNotificationSender, IDisposable
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
        _client = new WebPushClient(new HttpClientHandler { AllowAutoRedirect = false });
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
            if (!string.IsNullOrWhiteSpace(configuredPublic) || !string.IsNullOrWhiteSpace(configuredPrivate))
                throw new InvalidOperationException("La configuración VAPID debe incluir ambas claves.");

            // Cross-process serialization preserves one durable pair across API
            // instances. Never replace an existing pair or fall back to ephemeral keys.
            try
            {
                using var conn = _factory.CreateAsync().GetAwaiter().GetResult();
                var dbConn = (DbConnection)conn;
                using var transaction = dbConn.BeginTransaction();
                dbConn.Execute("SELECT pg_advisory_xact_lock(723905421311);", transaction: transaction);

                const string selectSql = "SELECT key, value FROM app_settings WHERE key IN ('webpush.vapid.public_key', 'webpush.vapid.private_key');";
                var rows = dbConn.Query<(string Key, string Value)>(selectSql, transaction: transaction)
                    .ToDictionary(r => r.Key, r => r.Value);

                if (rows.TryGetValue("webpush.vapid.public_key", out var pubKey) &&
                    rows.TryGetValue("webpush.vapid.private_key", out var privKey) &&
                    !string.IsNullOrWhiteSpace(pubKey) && !string.IsNullOrWhiteSpace(privKey))
                {
                    transaction.Commit();
                    _vapidDetails = new VapidDetails(subject, pubKey, privKey);
                    return _vapidDetails;
                }
                if (rows.Count > 0)
                    throw new InvalidOperationException("El par VAPID persistido está incompleto; requiere revisión.");

                // Generate new persistent VAPID keys
                var keys = VapidHelper.GenerateVapidKeys();
                const string insertSql = """
                    INSERT INTO app_settings (key, value, updated_at)
                    VALUES ('webpush.vapid.public_key', @PubKey, NOW()),
                           ('webpush.vapid.private_key', @PrivKey, NOW());
                    """;
                dbConn.Execute(insertSql, new { PubKey = keys.PublicKey, PrivKey = keys.PrivateKey }, transaction);
                transaction.Commit();

                _logger.LogInformation("Generated and saved new persistent VAPID keys in app_settings.");
                _vapidDetails = new VapidDetails(subject, keys.PublicKey, keys.PrivateKey);
                return _vapidDetails;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("VAPID persistence unavailable ({ErrorType})", ex.GetType().Name);
                throw new InvalidOperationException("No se pudo cargar el par VAPID persistente.");
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
            // Historical subscriptions are checked too, not just new registrations.
            if (!PushSubscriptionPolicy.IsAllowedEndpoint(sub.Endpoint))
            {
                _logger.LogWarning("Blocked push subscription {SubscriptionId}: unsupported destination", sub.Id);
                continue;
            }
            try
            {
                var pushSub = new WebPush.PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                await _client.SendNotificationAsync(pushSub, payload, vapid, ct);
                await _subscriptionRepo.UpdateLastUsedAsync(sub.Endpoint, ct);
                successCount++;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (WebPushException wpe)
            {
                _logger.LogWarning("WebPush failed for subscription {SubscriptionId}: status {Status}", sub.Id, wpe.StatusCode);
                // 404 or 410 means subscription expired or was revoked by browser
                if (wpe.StatusCode == System.Net.HttpStatusCode.Gone || wpe.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    await _subscriptionRepo.DeleteByEndpointAsync(sub.Endpoint, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("WebPush error for subscription {SubscriptionId}: {ErrorType}", sub.Id, ex.GetType().Name);
            }
        }

        return successCount;
    }

    public void Dispose() => _client.Dispose();
}
