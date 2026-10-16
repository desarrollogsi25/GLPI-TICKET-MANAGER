using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
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
}
