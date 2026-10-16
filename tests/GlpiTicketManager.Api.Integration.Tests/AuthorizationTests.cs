using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class AuthorizationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? s_cachedTech1Token;
    private static string? s_cachedAdminToken;
    private static readonly SemaphoreSlim s_lock = new(1, 1);

    public AuthorizationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
        if (s_cachedTech1Token != null) return s_cachedTech1Token;

        await s_lock.WaitAsync();
        try
        {
            if (s_cachedTech1Token != null) return s_cachedTech1Token;

            var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
            {
                Username = "tech1",
                Password = "Tech1Pass!"
            });

            loginResponse.EnsureSuccessStatusCode();
            var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
            body.Should().NotBeNull();
            body!.AccessToken.Should().NotBeNullOrEmpty();
            s_cachedTech1Token = body.AccessToken;
            return s_cachedTech1Token;
        }
        finally
        {
            s_lock.Release();
        }
    }

    private async Task<string> AuthenticateAsAdminAsync()
    {
        if (s_cachedAdminToken != null) return s_cachedAdminToken;

        await s_lock.WaitAsync();
        try
        {
            if (s_cachedAdminToken != null) return s_cachedAdminToken;

            var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
            {
                Username = "admin_test",
                Password = "AdminPass123!"
            });

            loginResponse.EnsureSuccessStatusCode();
            var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
            body.Should().NotBeNull();
            body!.AccessToken.Should().NotBeNullOrEmpty();
            s_cachedAdminToken = body.AccessToken;
            return s_cachedAdminToken;
        }
        finally
        {
            s_lock.Release();
        }
    }

    [Fact]
    public async Task Test1_Tech1_CannotViewTicketOfTech2_Returns403()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket21Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test2_Tech1_CannotModifyStatusOfTicketOfTech2_Returns403()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{CustomWebApplicationFactory.Ticket21Id}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { status = 2 });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test3_Tech1_CannotClaimTicketOfAnotherGroup_Returns403()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket22Id}/claim");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test4_Tech1_CannotAddSolutionToTicketOfTech2_Returns403()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket21Id}/solutions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { content = "Unauthorized solution attempt" });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test5_Tech1_DoesNotSeeOtherTicketsWhenListing_IgnoresClientAssigneeId()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets?assigneeId={CustomWebApplicationFactory.Tech2Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty();
        result.Items.Should().OnlyContain(t => t.Id == CustomWebApplicationFactory.Ticket12Id);
        result.Items.Should().NotContain(t => t.Id == CustomWebApplicationFactory.Ticket21Id);
    }

    [Fact]
    public async Task Test6_Tech1_CannotViewGroupQueueOfAnotherGroup_Returns403()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/by-group?groupId={CustomWebApplicationFactory.Group2Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test7_Login_Tech1_JwtContainsRoleTechnician()
    {
        var token = await AuthenticateAsTech1Async();
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == "role")?.Value;

        roleClaim.Should().Be("technician");
    }

    [Fact]
    public async Task Test8_Login_Admin_JwtContainsRoleAdmin()
    {
        var token = await AuthenticateAsAdminAsync();
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == "role")?.Value;

        roleClaim.Should().Be("admin");
    }

    [Fact]
    public async Task Test9_Tech1_CannotViewTicketOfSameGroupAssignedToAnotherTech_Returns403()
    {
        // Ticket 13 is in Group 1, but assigned to Tech2. In strict model, Tech1 must get 403.
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket13Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test10_Tech1_CanViewOwnAssignedTicket_Returns200()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var ticket = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        ticket.Should().NotBeNull();
        ticket!.Id.Should().Be(CustomWebApplicationFactory.Ticket12Id);
    }

    [Fact]
    public async Task Test11_Tech1_CanViewUnassignedTicketInOwnGroup_Returns200()
    {
        // Ticket 11 is in Group 1, unassigned and New. Tech1 can view it to claim it.
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket11Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var ticket = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        ticket.Should().NotBeNull();
        ticket!.Id.Should().Be(CustomWebApplicationFactory.Ticket11Id);
    }

    [Fact]
    public async Task Test12_Tech1_CannotViewUnassignedTicketInAnotherGroup_Returns403()
    {
        // Ticket 22 is in Group 2, unassigned. Tech1 is NOT in Group 2, so gets 403.
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket22Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test13_Admin_CanViewAnyTicket_Returns200()
    {
        var token = await AuthenticateAsAdminAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket21Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Test14_Admin_CanModifyStatusOfAnyTicket_Returns204()
    {
        var token = await AuthenticateAsAdminAsync();
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{CustomWebApplicationFactory.Ticket21Id}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { status = 2 });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Test15_Admin_CanViewGroupQueueOfAnyGroup_Returns200()
    {
        var token = await AuthenticateAsAdminAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/by-group?groupId={CustomWebApplicationFactory.Group2Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Test16_Tech1_DashboardShowsOnlyOwnCounters()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/dashboard/stats");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var stats = await response.Content.ReadFromJsonAsync<DashboardStatsDto>();
        stats.Should().NotBeNull();
        stats!.TotalTickets.Should().Be(1);
    }

    [Fact]
    public async Task Test17_Admin_DashboardShowsGlobalCounters()
    {
        var token = await AuthenticateAsAdminAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/dashboard/stats");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var stats = await response.Content.ReadFromJsonAsync<DashboardStatsDto>();
        stats.Should().NotBeNull();
        stats!.TotalTickets.Should().Be(5);
    }
}
