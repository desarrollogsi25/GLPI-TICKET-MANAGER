using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class SolutionTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public SolutionTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech1",
            Password = "Tech1Pass!"
        });

        loginResponse.EnsureSuccessStatusCode();
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrEmpty();
        return body.AccessToken;
    }

    [Fact]
    public async Task AddSolution_UsingGlpiApi_CreatesITILSolution()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/solutions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { content = "Solucion verificada mediante GLPI REST API" });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<SolutionResponse>();
        body.Should().NotBeNull();
        body!.Id.Should().BeGreaterThan(0);
    }
}
