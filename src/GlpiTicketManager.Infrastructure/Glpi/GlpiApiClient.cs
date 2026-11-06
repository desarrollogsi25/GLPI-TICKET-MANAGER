using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Tickets;
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

    public async Task<int> CreatePlannedTaskAsync(
        int ticketId, int technicianId, string content, DateTimeOffset startAt,
        DateTimeOffset endAt, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            // GLPI stores its datetimes in UTC (without an offset in API v1).
            // `state=1` is TODO; a completed task must NOT turn the ticket planned.
            var payload = new
            {
                input = new
                {
                    tickets_id = ticketId,
                    users_id_tech = technicianId,
                    content,
                    state = 1,
                    is_private = 0,
                    begin = startAt.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                    end = endAt.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                    actiontime = (int)(endAt - startAt).TotalSeconds
                }
            };

            using var response = await SendAsync(HttpMethod.Post, "TicketTask", sessionToken, payload, cancellationToken);
            var created = await response.Content.ReadFromJsonAsync<CreateItemResponse>(SerializerOptions, cancellationToken);
            if (created is null || created.Id <= 0)
            {
                throw new GlpiApiException((int)response.StatusCode,
                    "GLPI may have created the planned task but returned no valid identifier. Reconcile before retrying.");
            }

            _logger.LogInformation("Created GLPI planned task {TaskId} for ticket {TicketId}", created.Id, ticketId);
            return created.Id;
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<TicketTaskDto>> GetTicketTasksAsync(int ticketId, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            const int pageSize = 100;
            const int maxTasks = 2000;
            var tasks = new List<TicketTaskDto>();
            for (var offset = 0; offset < maxTasks;)
            {
                // GLPI REST v1 exposes TicketTask as a native Ticket sub-item.
                using var request = new HttpRequestMessage(HttpMethod.Get,
                    $"Ticket/{ticketId}/TicketTask?range={offset}-{offset + pageSize - 1}");
                request.Headers.TryAddWithoutValidation("Session-Token", sessionToken);
                if (!string.IsNullOrWhiteSpace(_options.AppToken))
                    request.Headers.TryAddWithoutValidation("App-Token", _options.AppToken);

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    throw new GlpiApiException((int)response.StatusCode,
                        $"GLPI rejected GET Ticket/{ticketId}/TicketTask.");
                }

                var page = await response.Content.ReadFromJsonAsync<List<TicketTaskResponse>>(
                    SerializerOptions, cancellationToken) ?? [];
                foreach (var task in page)
                {
                    if (task.Id is not > 0 || task.TicketId != ticketId || task.IsDeleted == 1)
                        continue;
                    tasks.Add(new TicketTaskDto(task.Id.Value, ticketId,
                        task.TechnicianId ?? 0, task.Content ?? string.Empty,
                        task.State ?? 0, task.IsPrivate == 1,
                        ParseGlpiTaskDate(task.Begin), ParseGlpiTaskDate(task.End),
                        task.ActionTime ?? 0));
                }

                // Respect GLPI's actual returned range: the server may cap the
                // requested pageSize. Without this, >50 tasks could be omitted.
                var range = response.Content.Headers.ContentRange;
                var last = range?.To ?? (offset + page.Count - 1);
                var total = range?.Length;
                if (page.Count == 0 || (total.HasValue && last >= total - 1) ||
                    (!total.HasValue && page.Count < pageSize))
                    return tasks;
                offset = checked((int)last + 1);
            }

            throw new GlpiApiException(502,
                $"Ticket {ticketId} has more than {maxTasks} tasks; refusing a partial timeline.");
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    private static DateTimeOffset? ParseGlpiTaskDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return DateTime.TryParseExact(value, "yyyy-MM-dd HH:mm:ss",
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out var date) ? new DateTimeOffset(date) : null;
    }

    public async Task UpdateTicketTaskAsync(int taskId, int state, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            using var response = await SendAsync(HttpMethod.Put, $"TicketTask/{taskId}", sessionToken,
                new { input = new { state } }, cancellationToken);
        }
        finally { await KillSessionAsync(sessionToken, cancellationToken); }
    }

    public async Task ReplanTicketTaskAsync(int taskId, string content,
        DateTimeOffset startAt, DateTimeOffset endAt, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            // `pending = 0` is GLPI's own "no longer pending" input. On a Waiting
            // ticket the TicketTask post-update hook reopens it and derives Planned
            // from the planned task, so the API never writes status 3 directly.
            using var response = await SendAsync(HttpMethod.Put, $"TicketTask/{taskId}", sessionToken,
                new { input = new
                {
                    content,
                    state = 1,
                    begin = startAt.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                    end = endAt.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                    actiontime = (int)(endAt - startAt).TotalSeconds,
                    pending = 0
                } }, cancellationToken);
        }
        finally { await KillSessionAsync(sessionToken, cancellationToken); }
    }

    public async Task DeleteTicketTaskAsync(int taskId, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            // TicketTask has no is_deleted column in GLPI 11's schema. A DELETE
            // may be permanent; the service must audit the intent first and the
            // browser must require explicit confirmation.
            using var response = await SendAsync(HttpMethod.Delete, $"TicketTask/{taskId}", sessionToken,
                new { input = new { } }, cancellationToken);
        }
        finally { await KillSessionAsync(sessionToken, cancellationToken); }
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

    private static string FormatGlpiDate(DateTime utc) =>
        utc.ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);

    public async Task<GlpiTicketTask> CreateTicketTaskAsync(
        CreateTicketTaskRequest request,
        CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            var payload = new
            {
                input = new
                {
                    tickets_id = request.TicketId,
                    content = request.Content,
                    users_id_tech = request.TechnicianId,
                    is_private = request.IsPrivate ? 1 : 0,
                    state = (int)GlpiTicketManager.Domain.Enums.TicketTaskState.ToDo,
                    uuid = request.Uuid,
                    // Native "this scheduled task is not pending": lets GLPI reopen a
                    // Waiting ticket and derive Planned in its own post-add hook.
                    pending = 0,
                    plan = new
                    {
                        begin = FormatGlpiDate(request.BeginUtc),
                        end = FormatGlpiDate(request.EndUtc)
                    }
                }
            };

            using var response = await SendAsync(
                HttpMethod.Post,
                "TicketTask",
                sessionToken,
                payload,
                cancellationToken);

            var created = await response.Content
                .ReadFromJsonAsync<CreateItemResponse>(SerializerOptions, cancellationToken);

            if (created is null || created.Id <= 0)
            {
                throw new GlpiApiException(
                    (int)response.StatusCode,
                    "GLPI created the task but did not return a valid identifier.");
            }

            var task = await ReadGlpiTaskAsync(sessionToken, created.Id, cancellationToken);
            if (task is null)
            {
                throw new GlpiApiException(
                    (int)response.StatusCode,
                    $"GLPI created task {created.Id} but did not return it on read-back.");
            }

            return task;
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    public async Task<GlpiTicketTask?> GetTicketTaskAsync(int taskId, CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            return await ReadGlpiTaskAsync(sessionToken, taskId, cancellationToken);
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<GlpiTicketTask>> GetGlpiTicketTasksAsync(
        int ticketId,
        CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"Ticket/{ticketId}/TicketTask");
            request.Headers.TryAddWithoutValidation("Session-Token", sessionToken);
            if (!string.IsNullOrWhiteSpace(_options.AppToken))
            {
                request.Headers.TryAddWithoutValidation("App-Token", _options.AppToken);
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return [];
            }

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new GlpiApiException(
                    (int)response.StatusCode,
                    $"GLPI API returned {(int)response.StatusCode} for GET Ticket/{ticketId}/TicketTask.",
                    body);
            }

            var tasks = await response.Content
                .ReadFromJsonAsync<List<TicketTaskResponse>>(SerializerOptions, cancellationToken);

            return (tasks ?? []).Select(t => new GlpiTicketTask(
                t.Id ?? 0,
                null,
                t.TicketId ?? ticketId,
                t.Content ?? string.Empty,
                t.State ?? (int)GlpiTicketManager.Domain.Enums.TicketTaskState.ToDo,
                ParseGlpiDate(t.Begin),
                ParseGlpiDate(t.End),
                t.ActionTime ?? 0,
                t.TechnicianId ?? 0,
                0,
                t.IsPrivate == 1,
                null,
                null)).ToArray();
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    public async Task<GlpiTicketTask?> UpdateTicketTaskAsync(
        int taskId,
        UpdateTicketTaskRequest request,
        CancellationToken cancellationToken)
    {
        var sessionToken = await InitSessionAsync(cancellationToken);
        try
        {
            var input = new Dictionary<string, object>
            {
                ["id"] = taskId
            };

            if (request.Content is not null) input["content"] = request.Content;
            if (request.TechnicianId is not null) input["users_id_tech"] = request.TechnicianId.Value;
            if (request.State is not null) input["state"] = request.State.Value;
            if (request.IsPrivate is not null) input["is_private"] = request.IsPrivate.Value ? 1 : 0;
            // GLPI form input: telling it the task is no longer pending makes its
            // post-update hook reopen Waiting and derive Planned from the task.
            if (request.ClearPending) input["pending"] = 0;
            if (request.HasScheduleChange)
            {
                if (request.BeginUtc is null || request.EndUtc is null)
                {
                    throw new ArgumentException("A schedule change needs both start and end.", nameof(request));
                }
                input["plan"] = new
                {
                    begin = FormatGlpiDate(request.BeginUtc.Value),
                    end = FormatGlpiDate(request.EndUtc.Value)
                };
            }

            using var response = await SendAsync(
                HttpMethod.Put,
                $"TicketTask/{taskId}",
                sessionToken,
                new { input },
                cancellationToken);

            return await ReadGlpiTaskAsync(sessionToken, taskId, cancellationToken);
        }
        finally
        {
            await KillSessionAsync(sessionToken, cancellationToken);
        }
    }

    private async Task<GlpiTicketTask?> ReadGlpiTaskAsync(
        string sessionToken,
        int taskId,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"TicketTask/{taskId}");
        request.Headers.TryAddWithoutValidation("Session-Token", sessionToken);
        if (!string.IsNullOrWhiteSpace(_options.AppToken))
        {
            request.Headers.TryAddWithoutValidation("App-Token", _options.AppToken);
        }

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return null;

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new GlpiApiException(
                (int)response.StatusCode,
                $"GLPI API returned {(int)response.StatusCode} for GET TicketTask/{taskId}.",
                body);
        }

        var task = await response.Content
            .ReadFromJsonAsync<TicketTaskResponse>(SerializerOptions, cancellationToken);

        return task is null ? null : new GlpiTicketTask(
            task.Id ?? taskId,
            null,
            task.TicketId ?? 0,
            task.Content ?? string.Empty,
            task.State ?? (int)GlpiTicketManager.Domain.Enums.TicketTaskState.ToDo,
            ParseGlpiDate(task.Begin),
            ParseGlpiDate(task.End),
            task.ActionTime ?? 0,
            task.TechnicianId ?? 0,
            0,
            task.IsPrivate == 1,
            null,
            null);
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

    private sealed record TicketTaskResponse(
        [property: JsonPropertyName("id")] int? Id,
        [property: JsonPropertyName("tickets_id")] int? TicketId,
        [property: JsonPropertyName("users_id_tech")] int? TechnicianId,
        [property: JsonPropertyName("content")] string? Content,
        [property: JsonPropertyName("state")] int? State,
        [property: JsonPropertyName("is_private")] int? IsPrivate,
        [property: JsonPropertyName("is_deleted")] int? IsDeleted,
        [property: JsonPropertyName("begin")] string? Begin,
        [property: JsonPropertyName("end")] string? End,
        [property: JsonPropertyName("actiontime")] int? ActionTime);

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
