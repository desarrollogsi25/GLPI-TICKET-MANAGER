using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class RateLimitingTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public RateLimitingTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static async Task<string> AuthenticateAsTech1Async(HttpClient client)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech1",
            Password = "Tech1Pass!"
        });

        loginResponse.EnsureSuccessStatusCode();
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrEmpty();
        return body.AccessToken;
    }

    [Fact]
    public async Task DashboardStats_After20Requests_Returns429()
    {
        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["RateLimiting:ExpensiveTokenLimit"] = "20",
                    ["RateLimiting:ExpensiveTokensPerPeriod"] = "1",
                    ["RateLimiting:ExpensiveReplenishmentSeconds"] = "60",
                    ["RateLimiting:PerUserRequestLimit"] = "100",
                    ["RateLimiting:LoginAttemptLimit"] = "5"
                });
            });
        });

        var client = customFactory.CreateClient();
        var token = await AuthenticateAsTech1Async(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var responses = new List<HttpStatusCode>();
        for (int i = 0; i < 21; i++)
        {
            var res = await client.GetAsync("/api/dashboard/stats");
            responses.Add(res.StatusCode);
        }

        // First 20 requests succeed (TokenLimit = 20)
        responses.Take(20).Should().OnlyContain(code => code == HttpStatusCode.OK);

        // 21st request exceeds token bucket and gets 429 Too Many Requests (QueueLimit = 0)
        responses.Last().Should().Be(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task Tickets_After100Requests_Returns429()
    {
        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["RateLimiting:ExpensiveTokenLimit"] = "20",
                    ["RateLimiting:PerUserRequestLimit"] = "100",
                    ["RateLimiting:LoginAttemptLimit"] = "5"
                });
            });
        });

        var client = customFactory.CreateClient();
        var token = await AuthenticateAsTech1Async(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var responses = new List<HttpStatusCode>();
        for (int i = 0; i < 101; i++)
        {
            var res = await client.GetAsync("/api/tickets");
            responses.Add(res.StatusCode);
        }

        // First 100 requests succeed (PermitLimit = 100)
        responses.Take(100).Should().OnlyContain(code => code == HttpStatusCode.OK);

        // 101st request exceeds fixed window and gets 429 Too Many Requests (QueueLimit = 0)
        responses.Last().Should().Be(HttpStatusCode.TooManyRequests);
    }

    /// <summary>
    /// BUG-032 / H-32: the 429 must tell the client when it may retry.
    ///
    /// The rejections used to be empty and carried no `Retry-After`, so a client that
    /// polled too fast had no signal to slow down and kept the bucket empty. The
    /// header is the contract that lets the client back off instead of looping.
    /// </summary>
    [Fact]
    public async Task ExpensiveEndpoint_WhenRateLimited_ReturnsRetryAfterHeader()
    {
        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["RateLimiting:ExpensiveTokenLimit"] = "20",
                    ["RateLimiting:ExpensiveTokensPerPeriod"] = "1",
                    ["RateLimiting:ExpensiveReplenishmentSeconds"] = "60",
                    ["RateLimiting:PerUserRequestLimit"] = "100",
                    ["RateLimiting:LoginAttemptLimit"] = "5"
                });
            });
        });

        var client = customFactory.CreateClient();
        var token = await AuthenticateAsTech1Async(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage? limited = null;
        for (int i = 0; i < 30 && limited is null; i++)
        {
            var response = await client.GetAsync("/api/dashboard/stats");
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                limited = response;
            }
        }

        limited.Should().NotBeNull("the Expensive bucket must reject the request that exceeds the limit");

        limited!.Headers.Contains("Retry-After").Should().BeTrue(
            "a rate-limited response must tell the client when it may retry");
        var retryAfter = int.Parse(limited.Headers.GetValues("Retry-After").First());
        retryAfter.Should().BeGreaterThan(0);

        // The body is a RFC 7807 ProblemDetails, so the UI can explain the rejection.
        var body = await limited.Content.ReadAsStringAsync();
        body.Should().Contain("retryAfterSeconds");
        body.Should().Contain("Demasiadas solicitudes");
    }

    /// <summary>
    /// BUG-032 / H-32: the 429 bursts were caused by a client asking for twice the
    /// sustainable rate. The quota itself is NOT to be relaxed to hide the bug, so
    /// this test pins the production values of the `Expensive` policy.
    /// </summary>
    [Fact]
    public void ProductionConfiguration_KeepsTheExpensiveQuotaUnchanged()
    {
        var contentRoot = _factory.Services
            .GetRequiredService<IHostEnvironment>()
            .ContentRootPath;

        var appsettingsPath = Path.Combine(contentRoot, "appsettings.json");
        File.Exists(appsettingsPath).Should().BeTrue(
            $"the production appsettings.json must be reachable at {appsettingsPath}");

        using var document = JsonDocument.Parse(File.ReadAllText(appsettingsPath));
        var rateLimiting = document.RootElement.GetProperty("RateLimiting");

        rateLimiting.GetProperty("ExpensiveTokenLimit").GetInt32().Should().Be(20);
        rateLimiting.GetProperty("ExpensiveTokensPerPeriod").GetInt32().Should().Be(1);
        rateLimiting.GetProperty("ExpensiveReplenishmentSeconds").GetInt32().Should().Be(3);
        rateLimiting.GetProperty("PerUserRequestLimit").GetInt32().Should().Be(100);
    }
}
