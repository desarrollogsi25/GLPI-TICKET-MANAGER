using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Dashboard;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Integration tests for Dashboard endpoints (H-35):
/// 1. GET /api/groups/{groupId}/dashboard (Supervisor of that group or Admin)
/// 2. GET /api/admin/dashboard and /api/admin/groups-summary (Admin only)
/// </summary>
public class DashboardTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? s_cachedSupervisorToken;
    private static string? s_cachedAdminToken;
    private static string? s_cachedTech1Token;

    public DashboardTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.ResetState();
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsAsync(string username, string password)
    {
        if (username == "supervisor_test" && s_cachedSupervisorToken != null) return s_cachedSupervisorToken;
        if (username == "admin_test" && s_cachedAdminToken != null) return s_cachedAdminToken;
        if (username == "tech1" && s_cachedTech1Token != null) return s_cachedTech1Token;

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = username,
            Password = password
        });

        loginResponse.EnsureSuccessStatusCode();
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        var token = body!.AccessToken;

        if (username == "supervisor_test") s_cachedSupervisorToken = token;
        if (username == "admin_test") s_cachedAdminToken = token;
        if (username == "tech1") s_cachedTech1Token = token;

        return token;
    }

    [Fact]
    public async Task GetGroupDashboard_AsSupervisorOfGroup_Returns200WithTeamMembers()
    {
        // Supervisor belongs to Group 1 in fixtures
        var token = await AuthenticateAsAsync("supervisor_test", "SupervisorPass123!");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/groups/1/dashboard");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var members = await response.Content.ReadFromJsonAsync<List<TeamMemberDto>>();
        members.Should().NotBeNull();
        members!.Should().HaveCount(2);
        members!.Select(m => m.Name).Should().Contain(new[] { "Technician 1", "Technician 2" });
        members!.First(m => m.UserId == CustomWebApplicationFactory.Tech1Id).ActiveTickets.Should().Be(1);
    }

    [Fact]
    public async Task GetGroupDashboard_AsSupervisorOfDifferentGroup_Returns403Forbidden()
    {
        // Supervisor belongs to Group 1, attempting to access Group 2
        var token = await AuthenticateAsAsync("supervisor_test", "SupervisorPass123!");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/groups/2/dashboard");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetGroupDashboard_AsAdmin_Returns200EvenForAnyGroup()
    {
        // Admin has global access to all group dashboards
        var token = await AuthenticateAsAsync("admin_test", "AdminPass123!");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/groups/2/dashboard");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var members = await response.Content.ReadFromJsonAsync<List<TeamMemberDto>>();
        members.Should().NotBeNull();
        members!.Should().HaveCount(1);
        members!.First().UserId.Should().Be(CustomWebApplicationFactory.Tech2Id);
    }

    [Fact]
    public async Task GetGroupDashboard_AsTechnician_Returns403Forbidden()
    {
        // Technicians are not allowed to view supervisor team dashboards
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/groups/1/dashboard");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetGroupDashboard_Unauthenticated_Returns401Unauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/groups/1/dashboard");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAdminDashboard_AsAdmin_Returns200WithGroupSummaries()
    {
        var token = await AuthenticateAsAsync("admin_test", "AdminPass123!");

        // 1. Check primary endpoint /api/admin/dashboard
        using var request1 = new HttpRequestMessage(HttpMethod.Get, "/api/admin/dashboard");
        request1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response1 = await _client.SendAsync(request1);

        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        var summaries1 = await response1.Content.ReadFromJsonAsync<List<GroupSummaryDto>>();
        summaries1.Should().NotBeNull();
        summaries1!.Should().HaveCount(2);
        summaries1!.Select(s => s.GroupName).Should().Contain(new[] { "Call Center", "Soporte Nivel 1" });

        // 2. Check frontend-compatible alias endpoint /api/admin/groups-summary
        using var request2 = new HttpRequestMessage(HttpMethod.Get, "/api/admin/groups-summary");
        request2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response2 = await _client.SendAsync(request2);

        response2.StatusCode.Should().Be(HttpStatusCode.OK);
        var summaries2 = await response2.Content.ReadFromJsonAsync<List<GroupSummaryDto>>();
        summaries2.Should().NotBeNull();
        summaries2!.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAdminDashboard_AsSupervisor_Returns403Forbidden()
    {
        var token = await AuthenticateAsAsync("supervisor_test", "SupervisorPass123!");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/admin/dashboard");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAdminDashboard_AsTechnician_Returns403Forbidden()
    {
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/admin/groups-summary");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAdminDashboard_Unauthenticated_Returns401Unauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/admin/dashboard");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
