using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Domain.Enums;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// BUG-031 (H-31) — atomic resolve contract <c>POST /api/tickets/{id}/resolve</c>.
///
/// Context: GLPI 11 moves a ticket to <c>Solved</c> (5) on its own when an ITILSolution is
/// created, and the solution-presence query used to require at least 10 characters while
/// the API only rejects empty content and content over 2000 characters. The legacy
/// two-call sequence ("POST /solutions" then "PATCH /status") therefore answered 422 for a
/// short solution and 400 (GLPI's "el elemento ya está resuelto") on the retry, even though
/// the ticket was really solved. These tests lock the single-call contract.
/// </summary>
public class ResolveTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? _cachedToken;

    public ResolveTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        // Every test starts from a clean fixture so the order of execution cannot
        // change the outcome.
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

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        _cachedToken = body!.AccessToken;
        return _cachedToken;
    }

    private async Task<HttpResponseMessage> ResolveAsync(int ticketId, string content, string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{ticketId}/resolve");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { content });
        return await _client.SendAsync(request);
    }

    [Fact]
    public async Task Resolve_WithShortSolution_Succeeds()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await ResolveAsync(CustomWebApplicationFactory.Ticket12Id, "OK", token);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var ticket = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        ticket.Should().NotBeNull();
        // The product rule is that a resolve closes the ticket (5 -> 6).
        ticket!.Status.Should().Be((int)TicketStatus.Closed);
    }

    [Fact]
    public async Task Resolve_WithValidSolution_Succeeds()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await ResolveAsync(
            CustomWebApplicationFactory.Ticket12Id,
            "Se reinstala el equipo y se verifica el acceso.",
            token);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var ticket = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        ticket!.Status.Should().Be((int)TicketStatus.Closed);
    }

    [Fact]
    public async Task Resolve_WithEmptyContent_Returns400()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await ResolveAsync(CustomWebApplicationFactory.Ticket12Id, string.Empty, token);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Resolve_WithWhitespaceContent_Returns400()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await ResolveAsync(CustomWebApplicationFactory.Ticket12Id, "     ", token);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Resolve_WithContentOver2000Characters_Returns400()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await ResolveAsync(
            CustomWebApplicationFactory.Ticket12Id,
            new string('x', 2001),
            token);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Resolve_WithoutBody_Returns400()
    {
        var token = await AuthenticateAsTech1Async();

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/resolve");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { });

        using var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Resolve_OnUnknownTicket_Returns404()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await ResolveAsync(987654, "Solucion para un ticket inexistente", token);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Resolve_OnAlreadySolvedTicket_Returns409()
    {
        var token = await AuthenticateAsTech1Async();
        _factory.SetTicketStatus(CustomWebApplicationFactory.Ticket12Id, (int)TicketStatus.Solved);

        using var response = await ResolveAsync(
            CustomWebApplicationFactory.Ticket12Id,
            "Segunda solucion sobre un ticket ya resuelto",
            token);

        // 409 = conflict of state. A 400 here would mean the request was malformed.
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Resolve_OnClosedTicket_Returns409()
    {
        var token = await AuthenticateAsTech1Async();
        _factory.SetTicketStatus(CustomWebApplicationFactory.Ticket12Id, (int)TicketStatus.Closed);

        using var response = await ResolveAsync(
            CustomWebApplicationFactory.Ticket12Id,
            "Solucion sobre un ticket ya cerrado",
            token);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Resolve_TwiceInARow_Returns409OnTheSecondCall()
    {
        var token = await AuthenticateAsTech1Async();

        using var first = await ResolveAsync(CustomWebApplicationFactory.Ticket12Id, "OK", token);
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        // Double submit: the second call must not create a second solution and must
        // answer 409 instead of bubbling GLPI's opaque 400.
        using var second = await ResolveAsync(CustomWebApplicationFactory.Ticket12Id, "OK", token);

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Resolve_ByTechnicianWithoutAccess_Returns403()
    {
        // tech2 works on tickets of group 2 (ticket 21); ticket 41 belongs to group 1
        // and is assigned to tech1.
        var otherLogin = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech2",
            Password = "Tech2Pass!"
        });
        otherLogin.StatusCode.Should().Be(HttpStatusCode.OK);
        var otherBody = await otherLogin.Content.ReadFromJsonAsync<LoginResponse>();

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/resolve");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", otherBody!.AccessToken);
        request.Content = JsonContent.Create(new { content = "Intento de resolucion sin relacion con el ticket" });

        using var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Resolve_EmitsExactlyOneRealtimeEvent()
    {
        var token = await AuthenticateAsTech1Async();
        _factory.ResetNotifications();

        using var response = await ResolveAsync(
            CustomWebApplicationFactory.Ticket12Id,
            "Solucion unica con un unico evento de tiempo real",
            token);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        _factory.NotificationMock.Verify(
            n => n.NotifyTicketStatusChangedAsync(
                CustomWebApplicationFactory.Ticket12Id,
                It.IsAny<int>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);

        // The atomic resolve replaces the legacy pair of calls, so it must not also
        // publish a separate "solution added" event.
        _factory.NotificationMock.Verify(
            n => n.NotifySolutionAddedAsync(
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Resolve_AfterTheLegacyEndpointAlreadySolvedTheTicket_Returns409()
    {
        var token = await AuthenticateAsTech1Async();

        using var legacy = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/solutions");
        legacy.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        legacy.Content = JsonContent.Create(new { content = "Solucion creada por el endpoint legacy" });
        using var legacyResponse = await _client.SendAsync(legacy);
        legacyResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // GLPI already moved the ticket to Solved (5) when the legacy endpoint wrote the
        // solution. The atomic endpoint must answer 409 (state conflict) instead of
        // bubbling GLPI's opaque 400 ("El elemento ya está resuelto").
        using var response = await ResolveAsync(
            CustomWebApplicationFactory.Ticket12Id,
            "Solucion creada por el endpoint atomico",
            token);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }
}
