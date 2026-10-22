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
/// A short-lived session is opened per operation, which keeps the client stateless and
/// avoids leaking GLPI session tokens.
/// </summary>
public sealed class GlpiApiClient : IGlpiApiClient
{
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

    public async Task<int> CreateSolutionAsync(int ticketId, string content, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);

        try
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
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    /// <summary>
    /// Reads the ticket state back from GLPI.
    ///
    /// BUG-032 / H-31: GLPI is the owner of the status and the solutions. After a
    /// write, this is the only source that can confirm the change was persisted.
    /// </summary>
    public async Task<GlpiTicketState?> GetTicketStateAsync(int ticketId, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);

        try
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
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    /// <summary>
    /// Parses the date format GLPI uses in its REST payloads ("YYYY-MM-DD HH:MM:SS").
    /// An empty or malformed value means "not set" and is reported as null.
    /// </summary>
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

    public async Task ReopenTicketAsync(int ticketId, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);

        try
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
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    public async Task<int> CreateFollowupAsync(int ticketId, string content, bool isPrivate, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);

        try
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
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    public async Task<int> CreateTicketAsync(
        string title,
        string description,
        int urgency,
        int? categoryId,
        int requesterUserId,
        int? assignmentGroupId,
        CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);

        try
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

    /// <summary>
    /// The shape of `GET Ticket/{id}` as GLPI 11 answers it. Only the fields the API
    /// needs to confirm a write are modelled; GLPI sends many more.
    /// </summary>
    private sealed record TicketStateResponse(
        [property: JsonPropertyName("id")] int? Id,
        [property: JsonPropertyName("status")] int? Status,
        [property: JsonPropertyName("solvedate")] string? SolvedAt,
        [property: JsonPropertyName("closedate")] string? ClosedAt);
}
