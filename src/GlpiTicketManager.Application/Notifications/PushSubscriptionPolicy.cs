using System.Security.Cryptography;
using GlpiTicketManager.Application.Dtos.Notifications;

namespace GlpiTicketManager.Application.Notifications;

/// <summary>Only browser push services may receive outbound encrypted payloads.</summary>
public static class PushSubscriptionPolicy
{
    public static bool IsAllowedEndpoint(string? endpoint)
    {
        if (string.IsNullOrWhiteSpace(endpoint) || endpoint.Length > 4096 ||
            !Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps || uri.Port != 443 ||
            uri.UserInfo.Length != 0 || uri.Fragment.Length != 0) return false;
        var host = uri.IdnHost.TrimEnd('.');
        return host.Equals("fcm.googleapis.com", StringComparison.OrdinalIgnoreCase) ||
            host.Equals("web.push.apple.com", StringComparison.OrdinalIgnoreCase) ||
            host.EndsWith(".push.services.mozilla.com", StringComparison.OrdinalIgnoreCase) ||
            host.EndsWith(".notify.windows.com", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsValid(PushSubscriptionDto? subscription)
    {
        if (subscription is null || !IsAllowedEndpoint(subscription.Endpoint) || subscription.Keys is null)
            return false;
        try
        {
            var publicKey = Decode(subscription.Keys.P256dh);
            var auth = Decode(subscription.Keys.Auth);
            if (publicKey.Length != 65 || publicKey[0] != 4 || auth.Length != 16) return false;
            using var key = ECDiffieHellman.Create(new ECParameters
            {
                Curve = ECCurve.NamedCurves.nistP256,
                Q = new ECPoint { X = publicKey[1..33], Y = publicKey[33..65] }
            });
            return true;
        }
        catch (Exception ex) when (ex is FormatException or CryptographicException or ArgumentException)
        {
            return false;
        }
    }

    private static byte[] Decode(string? value)
    {
        if (string.IsNullOrEmpty(value) || value.Length > 100) throw new FormatException();
        var normalized = value.Replace('-', '+').Replace('_', '/');
        return Convert.FromBase64String(normalized.PadRight((normalized.Length + 3) / 4 * 4, '='));
    }
}
