using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class AuthorizationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? s_cachedToken;
    private static readonly SemaphoreSlim s_lock = new(1, 1);

    public AuthorizationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
        if (s_cachedToken != null) return s_cachedToken;

        await s_lock.WaitAsync();
        try
        {
            if (s_cachedToken != null) return s_cachedToken;

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
        finally
        {
            s_lock.Release();
        }
    }

    [Fact]
    public async Task Test1_Tech1_CannotViewTicketOfTech2_Returns403()
    {
        // Arrange
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket21Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test2_Tech1_CannotModifyStatusOfTicketOfTech2_Returns403()
    {
        // Arrange
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{CustomWebApplicationFactory.Ticket21Id}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { status = 2 });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test3_Tech1_CannotClaimTicketOfAnotherGroup_Returns403()
    {
        // Arrange
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket22Id}/claim");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test4_Tech1_CannotAddSolutionToTicketOfTech2_Returns403()
    {
        // Arrange
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{CustomWebApplicationFactory.Ticket21Id}/solutions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { content = "Unauthorized solution attempt" });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Test5_Tech1_DoesNotSeeOtherTicketsWhenListing_IgnoresClientAssigneeId()
    {
        // Arrange
        var token = await AuthenticateAsTech1Async();
        // Client maliciously asks for assigneeId=8 (tech2)
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets?assigneeId={CustomWebApplicationFactory.Tech2Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty();
        // Server forced filter to tech1's tickets
        result.Items.Should().OnlyContain(t => t.Id == CustomWebApplicationFactory.Ticket12Id);
        result.Items.Should().NotContain(t => t.Id == CustomWebApplicationFactory.Ticket21Id);
    }

    [Fact]
    public async Task Test6_Tech1_CannotViewGroupQueueOfAnotherGroup_Returns403()
    {
        // Arrange
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/by-group?groupId={CustomWebApplicationFactory.Group2Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
