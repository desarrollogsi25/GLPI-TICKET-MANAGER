using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Business rules for ticket status transitions:
/// - Technicians cannot reopen a Closed ticket (only an admin can).
/// - Technicians cannot move work backwards (Assigned/In-Progress → New).
/// - Technicians cannot leave Resolved.
/// - Resolving auto-closes the ticket (final status 6).
/// </summary>
public class WorkflowRulesTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? s_cachedTech1Token;
    private static string? s_cachedAdminToken;
    private static readonly SemaphoreSlim s_lock = new(1, 1);

    public WorkflowRulesTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsAsync(string username, string password)
    {
        await s_lock.WaitAsync();
        try
        {
            if (username == "tech1" && s_cachedTech1Token != null) return s_cachedTech1Token;
            if (username == "admin_test" && s_cachedAdminToken != null) return s_cachedAdminToken;

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
            if (username == "admin_test") s_cachedAdminToken = token;

            return token;
        }
        finally
        {
            s_lock.Release();
        }
    }

    private void ArrangeTicket(int status, DateTime? closedAt = null)
    {
        var ticket = _factory.GetTicket(CustomWebApplicationFactory.Ticket12Id);
        _factory.AddTicket(new Ticket
        {
            Id = CustomWebApplicationFactory.Ticket12Id,
            Name = ticket?.Name ?? "Ticket 12",
            Status = status,
            CreatedAt = ticket?.CreatedAt ?? DateTime.UtcNow.AddDays(-2),
            UpdatedAt = ticket?.UpdatedAt ?? DateTime.UtcNow.AddDays(-2),
            SolvedAt = status is 5 or 6 ? DateTime.UtcNow.AddHours(-1) : null,
            ClosedAt = closedAt ?? (status == 6 ? DateTime.UtcNow.AddHours(-1) : null),
            RequesterIds = ticket?.RequesterIds ?? new[] { CustomWebApplicationFactory.SolicitanteId },
            AssigneeIds = new[] { CustomWebApplicationFactory.Tech1Id }
        });
    }

    private async Task<HttpResponseMessage> PatchStatusAsync(string token, int status)
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { status });
        return await _client.SendAsync(request);
    }

    [Fact]
    public async Task Technician_CannotReopenClosedTicket_Returns403()
    {
        ArrangeTicket((int)TicketStatus.Closed, closedAt: DateTime.UtcNow.AddDays(-1));

        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/reopen");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new ReopenTicketRequest { Reason = "Intento de reapertura por técnico" });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_CanReopenClosedTicket_ReturnsOk()
    {
        ArrangeTicket((int)TicketStatus.Closed, closedAt: DateTime.UtcNow.AddDays(-1));

        var token = await AuthenticateAsAsync("admin_test", "AdminPass123!");
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/reopen");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new ReopenTicketRequest { Reason = "Reapertura por administrador" });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        detail.Should().NotBeNull();
        detail!.Status.Should().Be((int)TicketStatus.Assigned);
    }

    [Fact]
    public async Task Technician_CannotMoveAssignedBackToNew_Returns403()
    {
        ArrangeTicket((int)TicketStatus.Assigned);
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");

        var response = await PatchStatusAsync(token, (int)TicketStatus.New);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();
        problem!.Detail.Should().Contain("Nuevo");
    }

    [Fact]
    public async Task Technician_CannotChangeStatusOfClosedTicket_Returns403WithClearMessage()
    {
        ArrangeTicket((int)TicketStatus.Closed, closedAt: DateTime.UtcNow.AddDays(-1));
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");

        var response = await PatchStatusAsync(token, (int)TicketStatus.Assigned);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();
        problem!.Detail.Should().Contain("administrador");
    }

    [Fact]
    public async Task Technician_CanMoveSolvedTicketBackToAssigned()
    {
        ArrangeTicket((int)TicketStatus.Solved);
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");

        var response = await PatchStatusAsync(token, (int)TicketStatus.Assigned);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Technician_CannotManuallyCloseTicket_Returns403()
    {
        ArrangeTicket((int)TicketStatus.Planned);
        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");

        var response = await PatchStatusAsync(token, (int)TicketStatus.Closed);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Resolve_AutoClosesTicket_FinalStatusIsClosed()
    {
        ArrangeTicket((int)TicketStatus.Planned);
        _factory.SetTicketSolution(CustomWebApplicationFactory.Ticket12Id, "OK");

        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        var response = await PatchStatusAsync(token, (int)TicketStatus.Solved);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        // Auto-close: the stored status must end up as Closed (6), not Solved (5).
        _factory.GetTicket(CustomWebApplicationFactory.Ticket12Id)!.Status.Should().Be((int)TicketStatus.Closed);
    }

    [Fact]
    public async Task Technician_CannotMoveWaitingStraightToResolved_Returns422()
    {
        // H-39: a Waiting (4) ticket must be resumed to In-Progress (3) first.
        ArrangeTicket((int)TicketStatus.Waiting);
        _factory.SetTicketSolution(CustomWebApplicationFactory.Ticket12Id, "Listo");

        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        var response = await PatchStatusAsync(token, (int)TicketStatus.Solved);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();
        problem!.Detail.Should().Be(
            "No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.");
        _factory.GetTicket(CustomWebApplicationFactory.Ticket12Id)!.Status.Should().Be((int)TicketStatus.Waiting);
    }

    [Fact]
    public async Task Technician_CannotCloseWaitingTicket_Returns422()
    {
        ArrangeTicket((int)TicketStatus.Waiting);

        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        var response = await PatchStatusAsync(token, (int)TicketStatus.Closed);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();
        problem!.Detail.Should().Be(
            "No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.");
        _factory.GetTicket(CustomWebApplicationFactory.Ticket12Id)!.Status.Should().Be((int)TicketStatus.Waiting);
    }

    [Fact]
    public async Task Technician_CanResumeWaitingToInProgress()
    {
        ArrangeTicket((int)TicketStatus.Waiting);

        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        var response = await PatchStatusAsync(token, (int)TicketStatus.Planned);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        _factory.GetTicket(CustomWebApplicationFactory.Ticket12Id)!.Status.Should().Be((int)TicketStatus.Planned);
    }

    [Fact]
    public async Task Technician_ConfirmingAlreadySolvedTicket_AutoCloses_NoForbidden()
    {
        // GLPI marks a ticket Solved (5) as a side effect of adding a solution, so the
        // resolve flow sends a 5->5 confirmation. That must not be treated as "leaving 5".
        ArrangeTicket((int)TicketStatus.Solved);
        _factory.SetTicketSolution(CustomWebApplicationFactory.Ticket12Id, "OK");

        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        var response = await PatchStatusAsync(token, (int)TicketStatus.Solved);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        _factory.GetTicket(CustomWebApplicationFactory.Ticket12Id)!.Status.Should().Be((int)TicketStatus.Closed);
    }

    private sealed record ProblemDetailsResponse(string? Title, string? Detail, int? Status);
}
