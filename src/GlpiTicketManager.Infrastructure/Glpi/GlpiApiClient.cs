using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GlpiTicketManager.Infrastructure.Glpi;

/// <summary>
/// Typed <see cref="HttpClient"/> that performs ticket writes against the GLPI REST API.
/// A short-lived session is opened per operation, which keeps the client stateless and
/// avoids leaking GLPI session tokens.
/// </summary>
public sealed class GlpiApiClient : IGlpiApiClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
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

    public async Task<int> CreateTicketAsync(CreateTicketRequest request, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);

        try
        {
            var input = new Dictionary<string, object?>
            {
                ["name"] = request.Title,
                ["content"] = request.Content,
                ["type"] = request.Type,
                ["urgency"] = request.Urgency,
                ["impact"] = request.Impact
            };

            if (request.CategoryId is > 0)
            {
                input["itilcategories_id"] = request.CategoryId;
            }

            if (request.RequesterId is > 0)
            {
                input["_users_id_requester"] = request.RequesterId;
            }

            if (request.AssigneeId is > 0)
            {
                input["_users_id_assign"] = request.AssigneeId;
            }

            using var response = await SendAsync(
                HttpMethod.Post,
                "Ticket",
                sessionToken,
                new { input },
                cancellationToken);

            var created = await response.Content
                .ReadFromJsonAsync<CreatedTicketResponse>(SerializerOptions, cancellationToken);

            if (created is null || created.Id <= 0)
            {
                throw new GlpiApiException((int)response.StatusCode, "GLPI did not return a ticket id.");
            }

            _logger.LogInformation("Created GLPI ticket {TicketId}", created.Id);
            return created.Id;
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    public async Task UpdateTicketStatusAsync(int ticketId, int status, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);

        try
        {
            var payload = new { input = new { status } };

            using var response = await SendAsync(
                HttpMethod.Put,
                $"Ticket/{ticketId}",
                sessionToken,
                payload,
                cancellationToken);

            _logger.LogInformation("Updated GLPI ticket {TicketId} to status {Status}", ticketId, status);
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

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

    private async Task KillSessionAsync(string sessionToken, CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, "killSession");

            if (!string.IsNullOrWhiteSpace(_options.AppToken))
            {
                request.Headers.TryAddWithoutValidation("App-Token", _options.AppToken);
            }

            request.Headers.TryAddWithoutValidation("Session-Token", sessionToken);

            using var response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(exception, "Failed to close the GLPI API session.");
        }
    }

    private async Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string relativeUrl,
        string sessionToken,
        object payload,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, relativeUrl);
        request.Headers.TryAddWithoutValidation("Session-Token", sessionToken);

        if (!string.IsNullOrWhiteSpace(_options.AppToken))
        {
            request.Headers.TryAddWithoutValidation("App-Token", _options.AppToken);
        }

        request.Content = JsonContent.Create(payload, options: SerializerOptions);

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

    private sealed record CreatedTicketResponse(int Id);
}
