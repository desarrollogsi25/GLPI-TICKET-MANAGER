using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using FluentAssertions;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Notifications;
using GlpiTicketManager.Application.Notifications;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class PushSecurityTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public PushSecurityTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Theory]
    [InlineData("http://127.0.0.1/api")]
    [InlineData("https://127.0.0.1/api")]
    [InlineData("https://169.254.169.254/latest/meta-data")]
    [InlineData("https://[::1]/api")]
    [InlineData("https://internal.example/api")]
    [InlineData("https://fcm.googleapis.com.evil.example/send")]
    [InlineData("https://fcm.googleapis.com@internal.example/send")]
    [InlineData("https://fcm.googleapis.com:444/send")]
    [InlineData("file:///tmp/subscription")]
    public async Task Subscription_RejectsUntrustedDestinationsBeforePersistence(string endpoint)
    {
        var repository = new Mock<IPushSubscriptionRepository>(MockBehavior.Strict);
        using var app = _factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.RemoveAll<IPushSubscriptionRepository>();
            services.AddSingleton(repository.Object);
        }));
        using var client = app.CreateClient();
        using var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech1", Password = TestCredentials.Tech1
        });
        login.EnsureSuccessStatusCode();
        var session = (await login.Content.ReadFromJsonAsync<LoginResponse>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);

        using var response = await client.PostAsJsonAsync("/api/notifications/push/subscribe",
            new PushSubscriptionDto(endpoint, ValidKeys()));
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        repository.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("https://fcm.googleapis.com/fcm/send/synthetic")]
    [InlineData("https://updates.push.services.mozilla.com/wpush/v2/synthetic")]
    [InlineData("https://web.push.apple.com/synthetic")]
    [InlineData("https://wns2.notify.windows.com/?token=synthetic")]
    public void Subscription_AcceptsStandardBrowserProvidersWithValidKeys(string endpoint)
    {
        PushSubscriptionPolicy.IsValid(new PushSubscriptionDto(endpoint, ValidKeys())).Should().BeTrue();
    }

    [Fact]
    public void Subscription_RejectsMalformedEncryptionKeys()
    {
        PushSubscriptionPolicy.IsValid(new PushSubscriptionDto(
            "https://fcm.googleapis.com/fcm/send/synthetic", new PushKeysDto("invalid", "invalid")))
            .Should().BeFalse();
    }

    [Fact]
    public void Vapid_DatabaseFailure_DoesNotReturnAnEphemeralKey()
    {
        var database = new Mock<IAppDbConnectionFactory>();
        database.Setup(d => d.CreateAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Synthetic storage failure"));
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["WebPush:VapidPublicKey"] = "", ["WebPush:VapidPrivateKey"] = ""
        }).Build();
        using var sender = new WebPushNotificationSender(new Mock<IPushSubscriptionRepository>().Object,
            database.Object, config, NullLogger<WebPushNotificationSender>.Instance);
        var getKey = () => sender.GetVapidPublicKey();
        getKey.Should().Throw<InvalidOperationException>();
    }

    private static PushKeysDto ValidKeys()
    {
        using var key = ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);
        var point = key.ExportParameters(false).Q;
        var publicKey = new byte[65];
        publicKey[0] = 4;
        point.X!.CopyTo(publicKey, 1);
        point.Y!.CopyTo(publicKey, 33);
        static string Encode(byte[] value) => Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return new PushKeysDto(Encode(publicKey), Encode(RandomNumberGenerator.GetBytes(16)));
    }
}
