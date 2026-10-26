using System.Collections.Concurrent;
using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GlpiTicketManager.Infrastructure.Glpi;

/// <summary>
/// Typed <see cref="HttpClient"/> that performs ticket writes against the GLPI REST API.
/// Uses a SessionTokenPool with 5-minute sliding TTL and single retry on 401 Unauthorized
/// to maximize throughput and minimize session roundtrips.
/// </summary>
public sealed class GlpiApiClient : IGlpiApiClient
{
    private sealed record PooledSession(string Token, DateTimeOffset ExpiresAt);
    private static readonly ConcurrentDictionary<string, PooledSession> SessionPool = new();
    private static readonly SemaphoreSlim SessionLock = new(1, 1);

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly JsonSerializerOptions IncludeNullsSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.Never
    };

    private readonly HttpClient _httpClient;
    private readonly GlpiOptions _options;
    private readonly ILogger<GlpiApiClient> _logger;

    public GlpiApiClient(
        HttpClient httpClient,
        IOptions<GlpiOptions> options,
        ILogger<GlpiApiClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;

        if (_httpClient.BaseAddress is null &&
            Uri.TryCreate(_options.BaseUrl, UriKind.Absolute, out var baseUri))
        {
            _httpClient.BaseAddress = baseUri;
        }
    }

    private async Task<string> GetSessionTokenAsync(CancellationToken cancellationToken)
    {
        var key = string.IsNullOrEmpty(_options.UserToken) ? "default" : _options.UserToken;
        if (SessionPool.TryGetValue(key, out var pooled) && DateTimeOffset.UtcNow < pooled.ExpiresAt)
        {
            return pooled.Token;
        }

        await SessionLock.WaitAsync(cancellationToken);
        try
        {
            if (SessionPool.TryGetValue(key, out pooled) && DateTimeOffset.UtcNow < pooled.ExpiresAt)
            {
                return pooled.Token;
            }

            var token = await InitSessionAsync(cancellationToken);
            var newSession = new PooledSession(token, DateTimeOffset.UtcNow.AddMinutes(5));
            SessionPool[key] = newSession;
            return token;
        }
        finally
        {
            SessionLock.Release();
        }
    }

    private void InvalidateSession(string? token = null)
    {
        var key = string.IsNullOrEmpty(_options.UserToken) ? "default" : _options.UserToken;
        if (token == null)
        {
            SessionPool.TryRemove(key, out _);
        }
        else if (SessionPool.TryGetValue(key, out var pooled) && pooled.Token == token)
        {
            SessionPool.TryRemove(key, out _);
        }
    }

    private async Task<T> ExecuteWithSessionAsync<T>(
        Func<string, Task<T>> action,
        CancellationToken cancellationToken)
    {
        var token = await GetSessionTokenAsync(cancellationToken);
        try
        {
            return await action(token);
        }
        catch (GlpiApiException ex) when (ex.StatusCode == 401)
        {
            _logger.LogWarning("GLPI session token expired or invalid (401). Refreshing token and retrying once...");
            InvalidateSession(token);
            var freshToken = await GetSessionTokenAsync(cancellationToken);
            return await action(freshToken);
        }
    }

    private Task ExecuteWithSessionAsync(
        Func<string, Task> action,
        CancellationToken cancellationToken) =>
        ExecuteWithSessionAsync(async token =>
        {
            await action(token);
            return true;
        }, cancellationToken);

    public Task UpdateTicketStatusAsync(int ticketId, int status, CancellationToken cancellationToken) =>
        ExecuteWithSessionAsync(async sessionToken =>
        {
            var payload = new { input = new { status } };

            using var response = await SendAsync(
                HttpMethod.Put,
                $"Ticket/{ticketId}",
                sessionToken,
                payload,
                cancellationToken);

            _logger.LogInformation("Updated GLPI ticket {TicketId} to status {Status}", ticketId, status);
        }, cancellationToken);

    public Task<int> CreateSolutionAsync(int ticketId, string content, CancellationToken cancellationToken) =>
        ExecuteWithSessionAsync(async sessionToken =>
        {
            var payload = new
            {
                input = new
                {
                    itemtype = "Ticket",
                    items_id = ticketId,
                    content
                }
            };

            using var response = await SendAsync(
                HttpMethod.Post,
                "ITILSolution",
                sessionToken,
                payload,
                cancellationToken);

            var created = await response.Content
                .ReadFromJsonAsync<CreateItemResponse>(SerializerOptions, cancellationToken);

            if (created is null || created.Id <= 0)
            {
                throw new GlpiApiException(
                    (int)response.StatusCode,
                    "GLPI created solution but did not return a valid identifier.");
            }

            _logger.LogInformation(
                "Created GLPI solution {SolutionId} for ticket {TicketId}",
                created.Id,
                ticketId);

            return created.Id;
        }, cancellationToken);

    public Task<GlpiTicketState?> GetTicketStateAsync(int ticketId, CancellationToken cancellationToken) =>
        ExecuteWithSessionAsync(async sessionToken =>
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"Ticket/{ticketId}");

            request.Headers.TryAddWithoutValidation("Session-Token", sessionToken);
            if (!string.IsNullOrWhiteSpace(_options.AppToken))
            {
                request.Headers.TryAddWithoutValidation("App-Token", _options.AppToken);
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new GlpiApiException(
                    (int)response.StatusCode,
                    $"GLPI API returned {(int)response.StatusCode} for GET Ticket/{ticketId}.",
                    body);
            }

            var ticket = await response.Content
                .ReadFromJsonAsync<TicketStateResponse>(SerializerOptions, cancellationToken);

            if (ticket is null || ticket.Status is null)
            {
                throw new GlpiApiException(
                    (int)response.StatusCode,
                    $"GLPI did not return a status for ticket {ticketId}.");
            }

            return new GlpiTicketState(
                TicketId: ticket.Id ?? ticketId,
                Status: ticket.Status.Value,
                SolvedAt: ParseGlpiDate(ticket.SolvedAt),
                ClosedAt: ParseGlpiDate(ticket.ClosedAt));
        }, cancellationToken);

    private static DateTime? ParseGlpiDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return DateTime.TryParse(
            value,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out var parsed)
            ? parsed
            : null;
    }

    public Task ReopenTicketAsync(int ticketId, CancellationToken cancellationToken) =>
        ExecuteWithSessionAsync(async sessionToken =>
        {
            var payload = new
            {
                input = new
                {
                    status = 2,
                    solvedate = (string?)null,
                    closedate = (string?)null
                }
            };

            using var response = await SendAsync(
                HttpMethod.Put,
                $"Ticket/{ticketId}",
                sessionToken,
                payload,
                IncludeNullsSerializerOptions,
                cancellationToken);

            _logger.LogInformation("Reopened GLPI ticket {TicketId} to status 2", ticketId);
        }, cancellationToken);

    public Task<int> CreateFollowupAsync(int ticketId, string content, bool isPrivate, CancellationToken cancellationToken) =>
        ExecuteWithSessionAsync(async sessionToken =>
        {
            var payload = new
            {
                input = new
                {
                    itemtype = "Ticket",
                    items_id = ticketId,
                    content,
                    is_private = isPrivate ? 1 : 0
                }
            };

            using var response = await SendAsync(
                HttpMethod.Post,
                "ITILFollowup",
                sessionToken,
                payload,
                cancellationToken);

            var created = await response.Content
                .ReadFromJsonAsync<CreateItemResponse>(SerializerOptions, cancellationToken);

            if (created is null || created.Id <= 0)
            {
                throw new GlpiApiException(
                    (int)response.StatusCode,
                    "GLPI created followup but did not return a valid identifier.");
            }

            _logger.LogInformation(
                "Created GLPI followup {FollowupId} for ticket {TicketId}",
                created.Id,
                ticketId);

            return created.Id;
        }, cancellationToken);

    public Task<int> CreateTicketAsync(
        string title,
        string description,
        int urgency,
        int? categoryId,
        int requesterUserId,
        int? assignmentGroupId,
        CancellationToken cancellationToken) =>
        ExecuteWithSessionAsync(async sessionToken =>
        {
            var input = new Dictionary<string, object>
            {
                ["name"] = title,
                ["content"] = description,
                ["urgency"] = urgency,
                ["_users_id_requester"] = requesterUserId
            };

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                input["itilcategories_id"] = categoryId.Value;
            }

            if (assignmentGroupId is > 0)
            {
                input["_groups_id_assign"] = new[] { assignmentGroupId.Value };
            }

            var payload = new { input };

            using var response = await SendAsync(
                HttpMethod.Post,
                "Ticket",
                sessionToken,
                payload,
                cancellationToken);

            var created = await response.Content
                .ReadFromJsonAsync<CreateItemResponse>(SerializerOptions, cancellationToken);

            if (created is null || created.Id <= 0)
            {
                throw new GlpiApiException(
                    (int)response.StatusCode,
                    "GLPI created ticket but did not return a valid identifier.");
            }

            _logger.LogInformation(
                "Created GLPI ticket {TicketId} requested by user {UserId}",
                created.Id,
                requesterUserId);

            return created.Id;
        }, cancellationToken);

    private async Task<string> InitSessionAsync(CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "initSession");

        if (!string.IsNullOrWhiteSpace(_options.AppToken))
        {
            request.Headers.TryAddWithoutValidation("App-Token", _options.AppToken);
        }

        request.Headers.TryAddWithoutValidation("Authorization", $"user_token {_options.UserToken}");

        using var response = await _httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new GlpiApiException(
                (int)response.StatusCode,
                "Could not open a GLPI API session. Check AppToken / UserToken.",
                body);
        }

        var session = await response.Content
            .ReadFromJsonAsync<InitSessionResponse>(SerializerOptions, cancellationToken);

        if (string.IsNullOrWhiteSpace(session?.SessionToken))
        {
            throw new GlpiApiException((int)response.StatusCode, "GLPI returned an empty session token.");
        }

        return session.SessionToken;
    }

    private Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string relativeUrl,
        string sessionToken,
        object payload,
        CancellationToken cancellationToken) =>
        SendAsync(method, relativeUrl, sessionToken, payload, SerializerOptions, cancellationToken);

    private async Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string relativeUrl,
        string sessionToken,
        object payload,
        JsonSerializerOptions serializerOptions,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, relativeUrl);
        request.Headers.TryAddWithoutValidation("Session-Token", sessionToken);

        if (!string.IsNullOrWhiteSpace(_options.AppToken))
        {
            request.Headers.TryAddWithoutValidation("App-Token", _options.AppToken);
        }

        request.Content = JsonContent.Create(payload, options: serializerOptions);

        var response = await _httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            var statusCode = (int)response.StatusCode;
            response.Dispose();
            throw new GlpiApiException(
                statusCode,
                $"GLPI API returned {statusCode} for {method.Method} {relativeUrl}.",
                body);
        }

        return response;
    }

    private sealed record InitSessionResponse(
        [property: JsonPropertyName("session_token")] string SessionToken);

    private sealed record CreateItemResponse(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("message")] string? Message);

    private sealed record TicketStateResponse(
        [property: JsonPropertyName("id")] int? Id,
        [property: JsonPropertyName("status")] int? Status,
        [property: JsonPropertyName("solvedate")] string? SolvedAt,
        [property: JsonPropertyName("closedate")] string? ClosedAt);
}
