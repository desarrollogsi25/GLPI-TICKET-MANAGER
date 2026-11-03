using System.Net;
using FluentAssertions;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public sealed class CorsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CorsTests(CustomWebApplicationFactory factory) => _client = factory.CreateClient();

    [Theory]
    [InlineData("https://front.example.test", true)]
    [InlineData("https://attacker.example.test", false)]
    [InlineData("https://front.example.test.evil.test", false)]
    [InlineData("http://front.example.test", false)]
    public async Task Preflight_IsAllowedOnlyForExactConfiguredOrigin(string origin, bool allowed)
    {
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/tickets");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "authorization");

        using var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins)
            .Should().Be(allowed);
        if (allowed)
        {
            origins.Should().ContainSingle().Which.Should().Be(origin);
            response.Headers.GetValues("Access-Control-Allow-Credentials").Should().ContainSingle("true");
        }
    }

    [Fact]
    public async Task ActualCrossOriginResponse_DoesNotReflectUnlistedOrigin()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("Origin", "https://attacker.example.test");

        using var response = await _client.SendAsync(request);
        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeFalse();
        response.Headers.Contains("Access-Control-Allow-Credentials").Should().BeFalse();
    }
}
