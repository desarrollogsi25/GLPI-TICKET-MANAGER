using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Mapping;
using GlpiTicketManager.Domain.Enums;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// BUG-032 (H-31) — the persistence source of truth for a ticket status.
/// </summary>
/// <remarks>
/// GLPI owns the status and the solutions of a ticket. The application reads the
/// tickets from MariaDB (the read model) but writes through GLPI's REST API, so the
/// only reliable proof that a status change landed is to read the ticket back from
/// GLPI (<c>GET /Ticket/{id}</c>) instead of assuming the requested status.
///
/// These tests pin that behaviour. The double keeps the GLPI state and the MariaDB
/// read model in two separate stores, so a read-back that consults the wrong source
/// produces a different (and wrong) answer.
/// </remarks>
public class TicketPersistenceTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? _cachedToken;

    public TicketPersistenceTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
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

    private async Task<HttpResponseMessage> PatchStatusAsync(int ticketId, int status, string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{ticketId}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { status });
        return await _client.SendAsync(request);
    }

    /// <summary>
    /// The resolve must consult GLPI for the resulting state. Without this read-back
    /// the application would publish the status it <em>intended</em> to write.
    /// </summary>
    [Fact]
    public async Task Resolve_ReadsTheResultingStateBackFromGlpi()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await ResolveAsync(CustomWebApplicationFactory.Ticket12Id, "OK", token);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        _factory.GlpiMock.Verify(
            g => g.GetTicketStateAsync(
                CustomWebApplicationFactory.Ticket12Id,
                It.IsAny<CancellationToken>()),
            Times.AtLeastOnce,
            "the state that is reported back has to be the one GLPI confirms");
    }

    /// <summary>
    /// The happy path: GLPI applied the transition, so the ticket really ends closed.
    /// </summary>
    [Fact]
    public async Task Resolve_WhenGlpiAppliedTheTransition_EndsClosed()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await ResolveAsync(CustomWebApplicationFactory.Ticket12Id, "OK", token);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var ticket = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        ticket.Should().NotBeNull();
        ticket!.Status.Should().Be((int)TicketStatus.Closed);
        ticket.StatusLabel.Should().Be(TicketLabels.Status((int)TicketStatus.Closed));

        // GLPI itself reports the closed ticket, so the answer is not a coincidence.
        _factory.GetGlpiReportedStatus(CustomWebApplicationFactory.Ticket12Id)
            .Should().Be((int)TicketStatus.Closed);
    }

    /// <summary>
    /// The discriminating test: when GLPI refuses the transition (a workflow rule
    /// blocks it, so the REST API answers 200 but the ticket keeps its status) the API
    /// must report what GLPI holds, not the status the code asked for.
    /// </summary>
    /// <remarks>
    /// Reading the ticket from the MariaDB read model instead of from GLPI would answer
    /// "Closed" here, which is a state GLPI never accepted.
    /// </remarks>
    [Fact]
    public async Task Resolve_ReportsTheStatusGlpiConfirms_NotTheRequestedOne()
    {
        var token = await AuthenticateAsTech1Async();
        _factory.SetGlpiReportedStatus(
            CustomWebApplicationFactory.Ticket12Id,
            (int)TicketStatus.Waiting);

        using var response = await ResolveAsync(CustomWebApplicationFactory.Ticket12Id, "OK", token);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var ticket = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        ticket.Should().NotBeNull();

        ticket!.Status.Should().Be((int)TicketStatus.Waiting);
        ticket.StatusLabel.Should().Be(TicketLabels.Status((int)TicketStatus.Waiting));
    }

    /// <summary>
    /// The status change event must carry the status GLPI confirms. Publishing the
    /// requested status would tell every other open session about a transition the
    /// server never applied.
    /// </summary>
    [Fact]
    public async Task UpdateStatus_PublishesTheStatusGlpiConfirms()
    {
        var token = await AuthenticateAsTech1Async();
        _factory.ResetNotifications();
        _factory.SetGlpiReportedStatus(
            CustomWebApplicationFactory.Ticket12Id,
            (int)TicketStatus.Waiting);

        using var response = await PatchStatusAsync(
            CustomWebApplicationFactory.Ticket12Id,
            (int)TicketStatus.Planned,
            token);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        _factory.NotificationMock.Verify(
            n => n.NotifyTicketStatusChangedAsync(
                CustomWebApplicationFactory.Ticket12Id,
                (int)TicketStatus.Waiting,
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    /// <summary>
    /// The status change path also has to read the result back from GLPI.
    /// </summary>
    [Fact]
    public async Task UpdateStatus_ReadsTheResultingStateBackFromGlpi()
    {
        var token = await AuthenticateAsTech1Async();

        using var response = await PatchStatusAsync(
            CustomWebApplicationFactory.Ticket12Id,
            (int)TicketStatus.Planned,
            token);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        _factory.GlpiMock.Verify(
            g => g.GetTicketStateAsync(
                CustomWebApplicationFactory.Ticket12Id,
                It.IsAny<CancellationToken>()),
            Times.AtLeastOnce,
            "the status that is published has to be the one GLPI confirms");
    }
}
