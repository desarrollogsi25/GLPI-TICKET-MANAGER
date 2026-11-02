using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Security.Cryptography;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Notifications;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Integration tests for GLPI Webhook endpoint (H-35):
/// POST /api/integrations/glpi/ticket-created
/// Validates signature, resolves group assignment in MariaDB,
/// creates persistent notifications and emits real-time SignalR event.
/// </summary>
public class GlpiWebhookTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly string ExpectedSecret = TestCredentials.WebhookSecret;
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public GlpiWebhookTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.ResetState();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HandleTicketCreated_MissingSecretHeader_Returns401Unauthorized()
    {
        var payload = new { ticketId = 11 };
        var response = await _client.PostAsJsonAsync("/api/integrations/glpi/ticket-created", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HandleTicketCreated_InvalidSecretHeader_Returns401Unauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
        request.Headers.Add("X-Webhook-Secret", ExpectedSecret);
        request.Content = new StringContent("{\"ticketId\": 11}", Encoding.UTF8, "application/json");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HandleTicketCreated_InvalidPayload_MissingTicketId_Returns400BadRequest()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
        Sign(request, "{\"ticketId\": 0}");
        request.Content = new StringContent("{\"ticketId\": 0}", Encoding.UTF8, "application/json");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task HandleTicketCreated_ValidTicketWithSecretHeader_Returns200AndCreatesNotifications()
    {
        _factory.ResetNotifications();

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
        Sign(request, "{\"ticketId\": 11}");
        request.Content = new StringContent("{\"ticketId\": 11}", Encoding.UTF8, "application/json");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify SignalR event NotifyTicketCreatedAsync was called for ticket 11 and group 1
        _factory.NotificationMock.Verify(
            n => n.NotifyTicketCreatedAsync(11, CustomWebApplicationFactory.Group1Id, It.IsAny<CancellationToken>()),
            Times.Once);

        // Verify that persistent notifications were created for Tech1 (in group 1)
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech1",
            Password = TestCredentials.Tech1
        });
        loginResponse.EnsureSuccessStatusCode();
        var tokenBody = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        tokenBody.Should().NotBeNull();

        using var notifRequest = new HttpRequestMessage(HttpMethod.Get, "/api/notifications?limit=10&offset=0");
        notifRequest.Headers.Add("Authorization", $"Bearer {tokenBody!.AccessToken}");
        var notifResponse = await _client.SendAsync(notifRequest);

        notifResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var notifs = await notifResponse.Content.ReadFromJsonAsync<List<NotificationDto>>();
        notifs.Should().NotBeNull();
        notifs!.Should().Contain(n => n.TicketId == 11 && n.Type == "TicketCreated");
    }

    [Fact]
    public async Task HandleTicketCreated_BearerTokenInsteadOfHmac_Returns401()
    {
        // Using standard GLPI items_id attribute
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
        request.Headers.Add("Authorization", $"Bearer {ExpectedSecret}");
        request.Content = new StringContent("{\"items_id\": 21}", Encoding.UTF8, "application/json");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HandleTicketCreated_ValidWithGlpiSignatureHeader_Returns200()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
        Sign(request, "{\"ticketId\": 12}");
        request.Content = new StringContent("{\"ticketId\": 12}", Encoding.UTF8, "application/json");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task HandleTicketCreated_StaleSignature_Returns401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
        Sign(request, "{\"ticketId\": 11}", DateTimeOffset.UtcNow.AddMinutes(-11));
        request.Content = new StringContent("{\"ticketId\": 11}", Encoding.UTF8, "application/json");

        (await _client.SendAsync(request)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HandleTicketCreated_ModifiedBody_Returns401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
        Sign(request, "{\"ticketId\": 11}");
        request.Content = new StringContent("{\"ticketId\": 21}", Encoding.UTF8, "application/json");

        (await _client.SendAsync(request)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HandleTicketCreated_OversizedBody_Returns413()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
        request.Content = new StringContent(new string('x', 65537), Encoding.UTF8, "application/json");

        (await _client.SendAsync(request)).StatusCode.Should().Be(HttpStatusCode.RequestEntityTooLarge);
    }

    private static void Sign(HttpRequestMessage request, string rawBody, DateTimeOffset? time = null)
    {
        var timestamp = (time ?? DateTimeOffset.UtcNow).ToUnixTimeSeconds().ToString(System.Globalization.CultureInfo.InvariantCulture);
        var signature = HMACSHA256.HashData(Encoding.UTF8.GetBytes(ExpectedSecret),
            Encoding.UTF8.GetBytes(rawBody + timestamp));
        request.Headers.Add("X-GLPI-timestamp", timestamp);
        request.Headers.Add("X-GLPI-signature", Convert.ToHexString(signature).ToLowerInvariant());
    }
}
