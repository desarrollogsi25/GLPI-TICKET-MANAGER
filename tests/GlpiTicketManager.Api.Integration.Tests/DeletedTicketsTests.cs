using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class DeletedTicketsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? s_cachedToken;

    public DeletedTicketsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
        if (s_cachedToken is not null)
        {
            return s_cachedToken;
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
        s_cachedToken = body.AccessToken;
        return s_cachedToken;
    }

    [Fact]
    public async Task GetUnassignedByGroup_ExcludesDeletedTickets()
    {
        const int deletedTicketId = 999;
        var deletedTicket = new Ticket
        {
            Id = deletedTicketId,
            Name = "Deleted test ticket",
            Status = (int)TicketStatus.New,
            IsDeleted = true,
            RequesterIds = new[] { 9 },
            AssigneeIds = Array.Empty<int>()
        };

        // Insertar ticket is_deleted=1 con grupo 1 en BD / factory
        _factory.AddTicket(deletedTicket);

        try
        {
            // Login tech1
            var token = await AuthenticateAsTech1Async();
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/by-group?groupId={CustomWebApplicationFactory.Group1Id}&unassigned=true");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // GET /api/tickets/by-group?groupId=1&unassigned=true
            var response = await _client.SendAsync(request);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryDto>>();

            // Assert: el ticket 999 NO está en la respuesta
            result.Should().NotBeNull();
            result!.Items.Should().NotContain(t => t.Id == deletedTicketId);
        }
        finally
        {
            // Cleanup: DELETE ticket 999
            _factory.RemoveTicket(deletedTicketId);
        }
    }
}
