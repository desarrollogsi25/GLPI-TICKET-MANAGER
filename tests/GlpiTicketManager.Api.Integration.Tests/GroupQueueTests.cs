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
/// Regresión QA: GET /api/tickets/by-group debe tolerar la ausencia de groupId.
/// Antes de fix, un groupId faltante rompía el binding de Minimal APIs
/// (BadHttpRequestException) y el manejador global respondía 500.
/// </summary>
public class GroupQueueTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static string? s_cachedToken;

    public GroupQueueTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
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

    private async Task<HttpResponseMessage> SendAsync(string url)
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }

    [Fact]
    public async Task GetUnassignedByGroup_WithoutGroupId_ReturnsOkWithEmptyPage()
    {
        // La URL que el front envia cuando el usuario no tiene grupo asignado:
        // /api/tickets/by-group?unassigned=true&limit=20&offset=0 (sin groupId)
        var response = await SendAsync("/api/tickets/by-group?unassigned=true&limit=20&offset=0");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
        result.Limit.Should().Be(20);
        result.Offset.Should().Be(0);
    }

    [Fact]
    public async Task GetUnassignedByGroup_WithoutGroupId_DoesNotReturnInternalServerError()
    {
        var response = await SendAsync("/api/tickets/by-group?unassigned=true&limit=20&offset=0");

        // Regresión explicita: antes era 500 "Error inesperado".
        ((int)response.StatusCode).Should().NotBe(500);
    }

    [Fact]
    public async Task GetUnassignedByGroup_WithZeroGroupId_ReturnsOkWithEmptyPage()
    {
        var response = await SendAsync("/api/tickets/by-group?groupId=0&unassigned=true&limit=20&offset=0");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    [Fact]
    public async Task GetUnassignedByGroup_WithUnrelatedGroupId_StillReturnsForbidden()
    {
        // Tech1 pertenece solo a Grupo 1: pedir la cola de otro grupo sigue siendo 403.
        var response = await SendAsync($"/api/tickets/by-group?groupId={CustomWebApplicationFactory.Group2Id}&unassigned=true&limit=20&offset=0");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
