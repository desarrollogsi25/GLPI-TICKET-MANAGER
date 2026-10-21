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
    private static string? _cachedToken;

    public SolutionTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        // The GLPI double reproduces the real side effect of BUG-031: writing a solution
        // moves the ticket to Solved (5). Every test therefore starts from a clean
        // fixture, otherwise the order of execution would change the expected status.
        _factory.ResetState();
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
        if (_cachedToken is not null)
        {
            return _cachedToken;
        }

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech1",
            Password = "Tech1Pass!"
        });

        loginResponse.EnsureSuccessStatusCode();
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrEmpty();
        _cachedToken = body.AccessToken;
        return _cachedToken;
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

    [Fact]
    public async Task AddSolution_WithEmptyContent_Returns400()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/solutions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { content = "" });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddSolution_WithWhitespaceContent_Returns400()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/solutions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { content = "         " });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddSolution_WithShortContent_Returns201()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/solutions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        // Short solutions are allowed: a technician can close a ticket with "OK".
        request.Content = JsonContent.Create(new { content = "OK" });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task AddSolution_WithTooLongContent_Returns400()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/solutions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { content = new string('x', 2001) });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddSolution_WithValidContent_Returns201()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/solutions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { content = "Solucion valida con mas de 10 caracteres." });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<SolutionResponse>();
        body.Should().NotBeNull();
        body!.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task PatchStatus5_WhenSolutionContentEmpty_Returns422()
    {
        var token = await AuthenticateAsTech1Async();
        _factory.SetTicketSolution(CustomWebApplicationFactory.Ticket12Id, "   ");

        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { status = 5 });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task PatchStatus5_WhenSolutionContentShort_Succeeds()
    {
        var token = await AuthenticateAsTech1Async();
        _factory.SetTicketSolution(CustomWebApplicationFactory.Ticket12Id, "OK");

        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { status = 5 });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
