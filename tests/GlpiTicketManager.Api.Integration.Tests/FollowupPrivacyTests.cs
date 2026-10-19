using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Domain.Entities;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class FollowupPrivacyTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? s_cachedTech1Token;
    private static string? s_cachedTech2Token;
    private static string? s_cachedAdminToken;
    private static readonly SemaphoreSlim s_lock = new(1, 1);

    public FollowupPrivacyTests(CustomWebApplicationFactory factory)
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
            if (username == "tech2" && s_cachedTech2Token != null) return s_cachedTech2Token;
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
            if (username == "tech2") s_cachedTech2Token = token;
            if (username == "admin_test") s_cachedAdminToken = token;

            return token;
        }
        finally
        {
            s_lock.Release();
        }
    }

    [Fact]
    public async Task GetTicketDetail_AsTech1_SeesPrivateFollowupsOfAssignedTicket()
    {
        // Ticket 12 is assigned to Tech1
        _factory.AddFollowup(CustomWebApplicationFactory.Ticket12Id, new TicketFollowup
        {
            Id = 101,
            TicketId = CustomWebApplicationFactory.Ticket12Id,
            Content = "Public note on ticket 12",
            IsPrivate = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        });
        _factory.AddFollowup(CustomWebApplicationFactory.Ticket12Id, new TicketFollowup
        {
            Id = 102,
            TicketId = CustomWebApplicationFactory.Ticket12Id,
            Content = "Private note on ticket 12",
            IsPrivate = true,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        });

        var token = await AuthenticateAsAsync("tech1", "Tech1Pass!");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        detail.Should().NotBeNull();
        detail!.Followups.Should().Contain(f => f.IsPrivate);
        detail.Followups.Should().Contain(f => !f.IsPrivate);
    }

    [Fact]
    public async Task GetTicketDetail_AsTech2_DoesNotSeePrivateFollowupsOfTicketNotAssignedToHim()
    {
        // Ticket 11 is unassigned in Group 1. Tech2 is in Group 1 so can view it, but is NOT assigned.
        _factory.AddFollowup(CustomWebApplicationFactory.Ticket11Id, new TicketFollowup
        {
            Id = 201,
            TicketId = CustomWebApplicationFactory.Ticket11Id,
            Content = "Public note on ticket 11",
            IsPrivate = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        });
        _factory.AddFollowup(CustomWebApplicationFactory.Ticket11Id, new TicketFollowup
        {
            Id = 202,
            TicketId = CustomWebApplicationFactory.Ticket11Id,
            Content = "Private note on ticket 11",
            IsPrivate = true,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        });

        var token = await AuthenticateAsAsync("tech2", "Tech2Pass!");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket11Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        detail.Should().NotBeNull();
        detail!.Followups.Should().Contain(f => !f.IsPrivate && f.Content == "Public note on ticket 11");
        detail.Followups.Should().NotContain(f => f.IsPrivate);
    }

    [Fact]
    public async Task GetTicketDetail_AsAdmin_SeesAllPrivateFollowups()
    {
        _factory.AddFollowup(CustomWebApplicationFactory.Ticket12Id, new TicketFollowup
        {
            Id = 301,
            TicketId = CustomWebApplicationFactory.Ticket12Id,
            Content = "Admin private note",
            IsPrivate = true,
            CreatedAt = DateTime.UtcNow
        });

        // Admin views Ticket 12 which has private followups
        var token = await AuthenticateAsAsync("admin_test", "AdminPass123!");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        detail.Should().NotBeNull();
        detail!.Followups.Should().Contain(f => f.IsPrivate);
    }

    [Fact]
    public async Task GetTicketDetail_ExcludesPrivateWhenRequester()
    {
        // Ticket 11 has RequesterIds = [Tech2Id]. Tech2 is requester, not assigned technician.
        var ticket11 = _factory.GetTicket(CustomWebApplicationFactory.Ticket11Id);
        if (ticket11 != null)
        {
            ticket11.RequesterIds = new[] { CustomWebApplicationFactory.Tech2Id };
        }

        var token = await AuthenticateAsAsync("tech2", "Tech2Pass!");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/tickets/{CustomWebApplicationFactory.Ticket11Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        detail.Should().NotBeNull();
        detail!.Followups.Should().NotContain(f => f.IsPrivate);
    }
}
