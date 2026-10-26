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
/// Integration tests for the Pending (Waiting = 4) ticket flow (H-34).
/// Context: Technicians and supervisors can place an active ticket into pending status
/// with a reason and private followup (ITILFollowup with is_private = 1).
/// </summary>
public class PendingTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? s_cachedTech1Token;
    private static string? s_cachedTech2Token;
    private static string? s_cachedSupervisorToken;

    public PendingTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.ResetState();
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsAsync(string username, string password)
    {
        if (username == "tech1" && s_cachedTech1Token != null) return s_cachedTech1Token;
        if (username == "tech2" && s_cachedTech2Token != null) return s_cachedTech2Token;
        if (username == "supervisor" && s_cachedSupervisorToken != null) return s_cachedSupervisorToken;

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = username,
            Password = password
        });

        loginResponse.EnsureSuccessStatusCode();
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        var token = body!.AccessToken;

        if (username == "tech1") s_cachedTech1Token = token;
        if (username == "tech2") s_cachedTech2Token = token;
        if (username == "supervisor") s_cachedSupervisorToken = token;

        return token;
    }

    private async Task<HttpResponseMessage> SetPendingAsync(int ticketId, int reasonId, string? comment, string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{ticketId}/pending");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new PendingTicketRequest
        {
            ReasonId = reasonId,
            Comment = comment ?? string.Empty
        });
        return await _client.SendAsync(request);
    }

    [Fact]
    public async Task SetPending_WithoutComment_Returns422()
    {
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");

        using var response = await SetPendingAsync(CustomWebApplicationFactory.Ticket12Id, 1, string.Empty, token);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task SetPending_WithWhitespaceComment_Returns422()
    {
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");

        using var response = await SetPendingAsync(CustomWebApplicationFactory.Ticket12Id, 1, "    ", token);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task SetPending_Successful_Returns200AndWritesToGlpi()
    {
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        const string comment = "Esperando piezas de repuesto del proveedor";

        using var response = await SetPendingAsync(CustomWebApplicationFactory.Ticket12Id, 2, comment, token);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        detail.Should().NotBeNull();
        detail!.Status.Should().Be((int)TicketStatus.Waiting);

        // Verify GLPI was called to write private followup and update status
        _factory.GlpiMock.Verify(g => g.CreateFollowupAsync(
            CustomWebApplicationFactory.Ticket12Id,
            comment,
            true,
            It.IsAny<CancellationToken>()), Times.Once);

        _factory.GlpiMock.Verify(g => g.UpdateTicketStatusAsync(
            CustomWebApplicationFactory.Ticket12Id,
            (int)TicketStatus.Waiting,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SetPending_WhenUserNotAssigned_Returns403()
    {
        // Ticket 12 is assigned to Tech1. Tech2 should be forbidden.
        var token = await AuthenticateAsAsync("tech2", "Tech2Pass!");

        using var response = await SetPendingAsync(
            CustomWebApplicationFactory.Ticket12Id,
            1,
            "Intentando pausar ticket ajeno",
            token);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task SetPending_WhenSupervisorInGroup_Returns200()
    {
        // Ticket 12 is in Group 1. Supervisor is in Group 1.
        var token = await AuthenticateAsAsync("supervisor_test", "SupervisorPass123!");
        const string comment = "Supervisor pone en espera para coordinar con cliente";

        using var response = await SetPendingAsync(
            CustomWebApplicationFactory.Ticket12Id,
            3,
            comment,
            token);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        detail!.Status.Should().Be((int)TicketStatus.Waiting);
    }

    [Fact]
    public async Task SetPending_WhenTicketClosed_Returns409()
    {
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        _factory.SetTicketStatus(CustomWebApplicationFactory.Ticket12Id, (int)TicketStatus.Closed);

        using var response = await SetPendingAsync(
            CustomWebApplicationFactory.Ticket12Id,
            1,
            "Ticket ya cerrado",
            token);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task SetPending_WhenTicketNotFound_Returns404()
    {
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");

        using var response = await SetPendingAsync(
            999999,
            1,
            "Ticket que no existe",
            token);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
