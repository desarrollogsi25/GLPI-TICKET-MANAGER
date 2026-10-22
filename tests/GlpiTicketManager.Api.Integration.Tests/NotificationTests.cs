using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Notifications;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Integration tests for persistent notifications (H-34).
/// Context: GET /api/notifications, GET /api/notifications/unread-count, PUT /api/notifications/{id}/read
/// </summary>
public class NotificationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static string? s_cachedTech1Token;

    public NotificationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.ResetState();
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
        if (s_cachedTech1Token != null) return s_cachedTech1Token;

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech1",
            Password = "Tech1Pass!"
        });

        loginResponse.EnsureSuccessStatusCode();
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        s_cachedTech1Token = body!.AccessToken;
        return s_cachedTech1Token;
    }

    [Fact]
    public async Task GetUnreadCount_InitialState_ReturnsZero()
    {
        var token = await AuthenticateAsTech1Async();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/notifications/unread-count");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<UnreadCountResponse>();
        result.Should().NotBeNull();
        result!.Count.Should().Be(0);
    }

    [Fact]
    public async Task CreateNotification_ReflectedInListAndUnreadCount()
    {
        var token = await AuthenticateAsTech1Async();

        // Use service to insert a notification for Tech1
        using (var scope = _factory.Services.CreateScope())
        {
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            await notificationService.CreateAsync(
                CustomWebApplicationFactory.Tech1Id,
                "TicketPending",
                CustomWebApplicationFactory.Ticket12Id,
                "Ticket en Pendiente",
                "El ticket 12 requiere repuesto",
                CancellationToken.None);
        }

        // Test GET /api/notifications/unread-count
        using (var unreadReq = new HttpRequestMessage(HttpMethod.Get, "/api/notifications/unread-count"))
        {
            unreadReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var unreadResp = await _client.SendAsync(unreadReq);
            unreadResp.StatusCode.Should().Be(HttpStatusCode.OK);
            var unread = await unreadResp.Content.ReadFromJsonAsync<UnreadCountResponse>();
            unread!.Count.Should().Be(1);
        }

        // Test GET /api/notifications
        long notificationId;
        using (var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/notifications"))
        {
            listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var listResp = await _client.SendAsync(listReq);
            listResp.StatusCode.Should().Be(HttpStatusCode.OK);
            var items = await listResp.Content.ReadFromJsonAsync<List<NotificationDto>>();
            items.Should().NotBeNull();
            var notifList = items!;
            notifList.Should().HaveCount(1);
            notifList[0].Title.Should().Be("Ticket en Pendiente");
            notifList[0].Message.Should().Be("El ticket 12 requiere repuesto");
            notifList[0].Body.Should().Be("El ticket 12 requiere repuesto");
            notifList[0].IsRead.Should().BeFalse();
            notifList[0].Read.Should().BeFalse();
            notificationId = notifList[0].Id;
        }

        // Test PUT /api/notifications/{id}/read
        using (var readReq = new HttpRequestMessage(HttpMethod.Put, $"/api/notifications/{notificationId}/read"))
        {
            readReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var readResp = await _client.SendAsync(readReq);
            readResp.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        // Verify count is now 0
        using (var unreadReq = new HttpRequestMessage(HttpMethod.Get, "/api/notifications/unread-count"))
        {
            unreadReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var unreadResp = await _client.SendAsync(unreadReq);
            unreadResp.StatusCode.Should().Be(HttpStatusCode.OK);
            var unread = await unreadResp.Content.ReadFromJsonAsync<UnreadCountResponse>();
            unread!.Count.Should().Be(0);
        }
    }

    [Fact]
    public async Task MarkAsRead_WhenNotFound_Returns404()
    {
        var token = await AuthenticateAsTech1Async();

        using var readReq = new HttpRequestMessage(HttpMethod.Put, "/api/notifications/99999/read");
        readReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var readResp = await _client.SendAsync(readReq);

        readResp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
