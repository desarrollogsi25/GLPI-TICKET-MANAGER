using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class TicketTasksTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public TicketTasksTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        factory.ResetState();
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsync(string username, string password)
    {
        using var login = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest { Username = username, Password = password });
        login.EnsureSuccessStatusCode();
        var token = await login.Content.ReadFromJsonAsync<LoginResponse>();
        return token!.AccessToken;
    }

    private async Task<HttpResponseMessage> MutateAsync(
        string username, string password, HttpMethod method, string suffix, object? body = null)
    {
        using var request = new HttpRequestMessage(method, $"/api/tickets/12/tasks/{suffix}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer",
            await AuthenticateAsync(username, password));
        if (body is not null) request.Content = JsonContent.Create(body);
        return await _client.SendAsync(request);
    }

    private async Task<HttpResponseMessage> ReadTasksAsync(
        string username, string password, int ticketId)
    {
        using var login = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest { Username = username, Password = password });
        login.EnsureSuccessStatusCode();
        var token = await login.Content.ReadFromJsonAsync<LoginResponse>();

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{ticketId}/tasks");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token!.AccessToken);
        return await _client.SendAsync(request);
    }

    [Fact]
    public async Task AssignedTechnician_SeesNativeTasksIncludingPrivate()
    {
        using var response = await ReadTasksAsync("tech1", TestCredentials.Tech1,
            CustomWebApplicationFactory.Ticket12Id);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var tasks = await response.Content.ReadFromJsonAsync<List<TicketTaskDto>>();
        tasks.Should().HaveCount(2);
        tasks![0].StartAt.Should().Be(new DateTimeOffset(2026, 11, 3, 9, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public async Task Requester_SeesOnlyPublicNativeTasks()
    {
        using var response = await ReadTasksAsync("solicitante_test", TestCredentials.Solicitante,
            CustomWebApplicationFactory.Ticket12Id);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var tasks = await response.Content.ReadFromJsonAsync<List<TicketTaskDto>>();
        tasks.Should().ContainSingle().Which.IsPrivate.Should().BeFalse();
        tasks![0].Content.Should().NotContain("privada");
    }

    [Fact]
    public async Task UnauthorizedTechnician_CannotReadOtherGroupTasks()
    {
        using var response = await ReadTasksAsync("tech1", TestCredentials.Tech1,
            CustomWebApplicationFactory.Ticket21Id);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UnknownTicket_ReturnsNotFound()
    {
        using var response = await ReadTasksAsync("admin_test", TestCredentials.Admin, 99999);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AssignedTechnician_CanCompleteTask_AndRetryIsSafe()
    {
        using var response = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Post, "8012/complete");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<TicketTaskMutationResponse>();
        result!.TaskId.Should().Be(8012);
        using var second = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Post, "8012/complete");
        second.StatusCode.Should().Be(HttpStatusCode.OK);
        using var readback = await ReadTasksAsync("tech1", TestCredentials.Tech1, 12);
        var tasks = await readback.Content.ReadFromJsonAsync<List<TicketTaskDto>>();
        tasks!.Single(task => task.Id == 8012).State.Should().Be(2);
    }

    [Fact]
    public async Task AssignedTechnician_CanCancelOnlyOpenTask()
    {
        using var response = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Delete, "8012");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var readback = await ReadTasksAsync("tech1", TestCredentials.Tech1, 12);
        var tasks = await readback.Content.ReadFromJsonAsync<List<TicketTaskDto>>();
        tasks.Should().NotContain(item => item.Id == 8012);
    }

    [Fact]
    public async Task AssignedTechnician_CanReplanWithIdempotentRequestKey()
    {
        var payload = new ReplanTicketTaskRequest(Guid.NewGuid(), "Inspección postergada",
            new DateTimeOffset(2026, 11, 5, 11, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 11, 5, 13, 0, 0, TimeSpan.Zero));
        using var response = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Put, "8012", payload);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var retry = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Put, "8012", payload);
        retry.StatusCode.Should().Be(HttpStatusCode.OK);
        var tasks = await _factory.GlpiMock.Object.GetTicketTasksAsync(12, CancellationToken.None);
        var task = tasks.Single(item => item.Id == 8012);
        task.Content.Should().Be(payload.Content);
        task.StartAt.Should().Be(payload.StartAt);
    }

    [Fact]
    public async Task RequesterCannotCompleteAndOtherTechnicianCannotCancel()
    {
        using var requester = await MutateAsync("solicitante_test", TestCredentials.Solicitante,
            HttpMethod.Post, "8012/complete");
        requester.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        using var other = await MutateAsync("tech2", TestCredentials.Tech2,
            HttpMethod.Delete, "8012");
        other.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CannotCancelCompletedTaskOrModifyWrongTicketTask()
    {
        using var complete = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Post, "8012/complete");
        complete.StatusCode.Should().Be(HttpStatusCode.OK);
        using var cancel = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Delete, "8012");
        cancel.StatusCode.Should().Be(HttpStatusCode.Conflict);
        using var foreign = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Post, "8123/complete");
        foreign.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Plan_RejectsExistingTechnicianScheduleOverlap()
    {
        var payload = new PlanTicketRequest
        {
            RequestId = Guid.NewGuid(), Content = "Intervención conflictiva",
            StartAt = new DateTimeOffset(2026, 11, 3, 9, 30, 0, TimeSpan.Zero),
            EndAt = new DateTimeOffset(2026, 11, 3, 10, 30, 0, TimeSpan.Zero)
        };
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/tickets/12/plan");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer",
            await AuthenticateAsync("tech1", TestCredentials.Tech1));
        request.Content = JsonContent.Create(payload);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        _factory.GetTicket(12)!.Status.Should().Be(2);
    }

    [Fact]
    public async Task Replan_RejectsOverlapWithAnotherTicketOfSameTechnician()
    {
        _factory.AddScheduledTask(new TicketTaskDto(8113, 13, CustomWebApplicationFactory.Tech1Id,
            "Otra intervención", 1, false,
            new DateTimeOffset(2026, 11, 5, 11, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 11, 5, 12, 0, 0, TimeSpan.Zero), 3600));
        using var response = await MutateAsync("tech1", TestCredentials.Tech1,
            HttpMethod.Put, "8012", new ReplanTicketTaskRequest(Guid.NewGuid(),
                "Trabajo solapado", new DateTimeOffset(2026, 11, 5, 11, 30, 0, TimeSpan.Zero),
                new DateTimeOffset(2026, 11, 5, 12, 30, 0, TimeSpan.Zero)));
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var tasks = await _factory.GlpiMock.Object.GetTicketTasksAsync(12, CancellationToken.None);
        tasks.Single(task => task.Id == 8012).Content.Should().Be("Visita programada");
    }

    [Fact]
    public async Task Plan_WithoutConflict_CreatesNativeTaskAndTransitionsTicket()
    {
        var payload = new PlanTicketRequest
        {
            RequestId = Guid.NewGuid(),
            Content = "Planificacion exitosa sin conflicto",
            StartAt = new DateTimeOffset(2026, 11, 4, 14, 0, 0, TimeSpan.Zero),
            EndAt = new DateTimeOffset(2026, 11, 4, 15, 30, 0, TimeSpan.Zero)
        };
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/tickets/12/plan");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer",
            await AuthenticateAsync("tech1", TestCredentials.Tech1));
        request.Content = JsonContent.Create(payload);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PlanTicketResponse>();
        result.Should().NotBeNull();
        result!.TaskId.Should().BeGreaterThan(0);
        result.Status.Should().Be(3); // Planned

        // Verify readback through our API reflects state and task
        using var readback = await ReadTasksAsync("tech1", TestCredentials.Tech1, 12);
        readback.StatusCode.Should().Be(HttpStatusCode.OK);
        var tasks = await readback.Content.ReadFromJsonAsync<List<TicketTaskDto>>();
        tasks.Should().Contain(t => t.Id == result.TaskId && t.Content == payload.Content);
    }
}
