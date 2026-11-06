using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class TechniciansEndpointSecurityTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public TechniciansEndpointSecurityTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.ResetState();
        _client = factory.CreateClient();
    }

    private async Task<string> LoginAsync(string username, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = username,
            Password = password
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        return body!.AccessToken;
    }

    [Fact]
    public async Task GetTechnicians_WithoutAuthentication_Returns401()
    {
        using var response = await _client.GetAsync("/api/tickets/technicians");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTechnicians_AsRequester_Returns403Forbidden()
    {
        var token = await LoginAsync("solicitante_test", TestCredentials.Solicitante);
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/tickets/technicians");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetTechnicians_AsAdmin_Returns200WithTechnicians()
    {
        var token = await LoginAsync("admin_test", TestCredentials.Admin);
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/tickets/technicians");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var list = await response.Content.ReadFromJsonAsync<List<UserSummaryDto>>();
        list.Should().NotBeNull();
        list.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetTechnicians_AsTechnician_WithOwnGroup_Returns200()
    {
        var token = await LoginAsync("tech1", TestCredentials.Tech1);
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/technicians?groupId={CustomWebApplicationFactory.Group1Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTechnicians_AsTechnician_WithForeignGroup_Returns403Forbidden()
    {
        // Tech1 only belongs to Group1Id; requesting Group2Id must be rejected
        var token = await LoginAsync("tech1", TestCredentials.Tech1);
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/technicians?groupId={CustomWebApplicationFactory.Group2Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetTechnicians_AsSupervisor_WithForeignGroup_Returns403Forbidden()
    {
        // Supervisor only belongs to Group1Id; requesting Group2Id must be rejected
        var token = await LoginAsync("supervisor_test", TestCredentials.Supervisor);
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/technicians?groupId={CustomWebApplicationFactory.Group2Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
