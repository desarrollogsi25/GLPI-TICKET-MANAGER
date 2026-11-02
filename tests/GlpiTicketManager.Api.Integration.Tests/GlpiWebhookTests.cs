using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Security.Cryptography;
using FluentAssertions;
using GlpiTicketManager.Api.Notifications;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Notifications;
using Moq;
using Microsoft.Extensions.DependencyInjection;
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
    public async Task HandleTicketCreated_ReplaysWithOlderNotifications_AreDeduplicated()
    {
        _factory.ResetNotifications();

        async Task<HttpStatusCode> DeliverAsync()
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
            Sign(request, "{\"ticketId\": 11}");
            request.Content = new StringContent("{\"ticketId\": 11}", Encoding.UTF8, "application/json");
            using var response = await _client.SendAsync(request);
            return response.StatusCode;
        }

        (await DeliverAsync()).Should().Be(HttpStatusCode.OK);

        // Simulate a busy inbox: the legacy "first 10" existence test would
        // miss the earlier TicketCreated notification and create a duplicate.
        using (var scope = _factory.Services.CreateScope())
        {
            var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
            for (var i = 0; i < 15; i++)
                await notifications.CreateAsync(CustomWebApplicationFactory.Tech1Id,
                    "TicketUpdated", 900 + i, "Event", "Other event");
        }

        var concurrent = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => DeliverAsync()));
        concurrent.Should().OnlyContain(status => status == HttpStatusCode.OK);

        using var verifyScope = _factory.Services.CreateScope();
        var service = verifyScope.ServiceProvider.GetRequiredService<INotificationService>();
        var all = await service.GetByUserAsync(CustomWebApplicationFactory.Tech1Id, 100, 0);
        all.Count(n => n.Type == "TicketCreated" && n.TicketId == 11).Should().Be(1);
        _factory.NotificationMock.Verify(n => n.NotifyTicketCreatedAsync(11,
            CustomWebApplicationFactory.Group1Id, It.IsAny<CancellationToken>()), Times.Once);
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

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task WatcherAndSignedWebhook_ShareClaimsAcrossRetries(bool watcherFirst)
    {
        const int ticketId = 951;
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(factory.Services);
        using var scope = factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var dashboard = Mock.Get(scope.ServiceProvider.GetRequiredService<IDashboardRepository>());
        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var resume = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var attempts = 0;
        int[] technicians = [CustomWebApplicationFactory.Tech1Id, CustomWebApplicationFactory.Tech2Id];
        dashboard.Setup(d => d.GetTechnicianUserIdsInGroupAsync(CustomWebApplicationFactory.Group1Id,
                It.IsAny<CancellationToken>()))
            .Returns(async (int _, CancellationToken ct) =>
            {
                if (Interlocked.Increment(ref attempts) == 1)
                {
                    entered.SetResult();
                    await resume.Task.WaitAsync(TimeSpan.FromSeconds(10), ct);
                }
                return (IReadOnlyList<int>)technicians;
            });

        Task Poll() => watcher.ProcessBatchAsync([new(ticketId, "Synthetic", 0)], default);
        async Task Deliver()
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/glpi/ticket-created");
            var body = $"{{\"ticketId\":{ticketId}}}";
            Sign(request, body);
            request.Content = new StringContent(body, Encoding.UTF8, "application/json");
            using var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();
        }

        // Both paths have resolved the same ticket before the first path resumes.
        var first = watcherFirst ? Poll() : Deliver();
        try
        {
            await entered.Task.WaitAsync(TimeSpan.FromSeconds(10));
            await (watcherFirst ? Deliver() : Poll());
        }
        finally { resume.TrySetResult(); }
        await first;

        foreach (var tech in technicians)
        {
            for (int i = 0; i < 12; i++)
                await service.CreateAsync(tech, "TicketUpdated", ticketId, "Update", "Unrelated");
            (await service.GetByUserAsync(tech, 10, 0)).Should().NotContain(n => n.Type == "TicketCreated");
        }
        await Task.WhenAll(Poll(), Deliver());
        foreach (var tech in technicians)
        {
            var rows = await service.GetByUserAsync(tech, 100, 0);
            rows.Count(n => n.Type == "TicketCreated" && n.TicketId == ticketId).Should().Be(1);
            rows.Count(n => n.Type == "TicketUpdated").Should().Be(12);
        }
        factory.TicketCreatedKeys.Should().BeEquivalentTo(technicians.Select(tech => (tech, ticketId)));
        factory.NotificationMock.Verify(n => n.NotifyTicketCreatedAsync(ticketId, CustomWebApplicationFactory.Group1Id,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task WatcherRetriesPartialTicketBeforeAdvancingItsCursor()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        var watcher = ActivatorUtilities.CreateInstance<GlpiNativeTicketWatcher>(factory.Services);
        using var scope = factory.Services.CreateScope();
        var repo = Mock.Get(scope.ServiceProvider.GetRequiredService<INotificationRepository>());
        var fail = true;
        repo.Setup(r => r.TryCreateTicketCreatedAsync(It.Is<Notification>(n =>
                fail && n.UserId == CustomWebApplicationFactory.Tech2Id && n.TicketId == 951),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                fail = false;
                throw new TimeoutException("Synthetic persistence failure");
            });
        await watcher.ProcessBatchAsync([new(950, "Skipped fixture", 0)], default);
        GlpiNativeTicketWatcher.NewTicketRow[] batch = [new(951, "Retry", 0), new(952, "Later", 0)];
        await Assert.ThrowsAsync<TimeoutException>(() => watcher.ProcessBatchAsync(batch, default));
        watcher.LastSeenTicketId.Should().Be(950);
        factory.TicketCreatedKeys.Should().ContainSingle().Which.Should().Be((CustomWebApplicationFactory.Tech1Id, 951));
        await watcher.ProcessBatchAsync(batch, default);
        watcher.LastSeenTicketId.Should().Be(952);
        foreach (int tech in new[] { CustomWebApplicationFactory.Tech1Id, CustomWebApplicationFactory.Tech2Id })
        {
            var rows = await repo.Object.GetByUserAsync(tech, 100, 0, default);
            rows.Select(n => n.TicketId).Should().BeEquivalentTo(new int?[] { 951, 952 });
        }
        factory.TicketCreatedKeys.Should().HaveCount(4);
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
