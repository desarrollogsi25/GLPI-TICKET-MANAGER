using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Filters by creation date on GET /api/tickets (startDate / endDate, UTC, inclusive).
/// </summary>
public class DateFilterTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static string? s_cachedToken;

    public DateFilterTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        factory.ResetState();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
        // Cached across tests in the class: repeated logins would trip the auth rate limiter
        // when the whole suite runs in a single process.
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

    private async Task<PagedResult<TicketSummaryDto>> GetTicketsAsync(string query)
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets?{query}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryDto>>();
        result.Should().NotBeNull();
        return result!;
    }

    [Fact]
    public async Task GetTickets_WithEndDateBeforeOldTicket_ReturnsEmptyPage()
    {
        // Ticket 12 (Tech1's only assigned ticket) was created on 2026-01-15 UTC, so an
        // upper bound of the previous day must exclude it.
        var result = await GetTicketsAsync("startDate=2025-01-01&endDate=2026-01-14&limit=50");

        result.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
        result.Limit.Should().Be(50);
        result.Offset.Should().Be(0);
    }

    [Fact]
    public async Task GetTickets_WithStartDateAfterOldTicket_ReturnsEmptyPage()
    {
        var result = await GetTicketsAsync("startDate=2026-01-16&limit=50");

        result.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    [Fact]
    public async Task GetTickets_WithSingleDayRangeIncludingTicket_ReturnsThatTicket()
    {
        var result = await GetTicketsAsync("startDate=2026-01-15&endDate=2026-01-15&limit=50");

        result.Total.Should().Be(1);
        result.Items.Should().ContainSingle(t => t.Id == CustomWebApplicationFactory.Ticket12Id);
    }

    [Fact]
    public async Task GetTickets_WithRangeContainingAllAssignedTickets_ReturnsThem()
    {
        var result = await GetTicketsAsync("startDate=2026-01-01&endDate=2026-12-31&limit=50");

        result.Total.Should().Be(1);
        result.Items.Should().ContainSingle(t => t.Id == CustomWebApplicationFactory.Ticket12Id);
    }

    [Fact]
    public async Task GetTickets_WithOnlyStartDate_IgnoresUpperBound()
    {
        var result = await GetTicketsAsync("startDate=2026-01-01&limit=50");

        result.Total.Should().Be(1);
        result.Items.Should().ContainSingle(t => t.Id == CustomWebApplicationFactory.Ticket12Id);
    }

    [Fact]
    public async Task GetTickets_WithOnlyEndDate_IncludesOldTickets()
    {
        // No startDate: the only Tech1 ticket is old, so an endDate in the recent range
        // must still include it.
        var result = await GetTicketsAsync("endDate=2026-12-31&limit=50");

        result.Total.Should().Be(1);
        result.Items.Should().ContainSingle(t => t.Id == CustomWebApplicationFactory.Ticket12Id);
    }

    [Fact]
    public async Task GetTickets_WithStartDateAfterEndDate_Returns400()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/tickets?startDate=2026-06-01&endDate=2026-01-01&limit=50");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
