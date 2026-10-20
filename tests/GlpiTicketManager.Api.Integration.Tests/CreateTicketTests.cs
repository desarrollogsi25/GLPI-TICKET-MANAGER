using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class CreateTicketTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public CreateTicketTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsSolicitanteAsync()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "solicitante_test",
            Password = "Solicitante123!"
        });

        loginResponse.EnsureSuccessStatusCode();
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrEmpty();
        return body.AccessToken;
    }

    [Fact]
    public async Task CreateTicket_AsSolicitante_Returns201Created_WithRequesterAssigned()
    {
        var token = await AuthenticateAsSolicitanteAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/tickets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new CreateTicketRequest
        {
            Title = "Problema con la pantalla",
            Description = "La pantalla parpadea constantemente al encender el equipo.",
            Urgency = 3,
            CategoryId = 2
        });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<TicketDetailDto>();
        created.Should().NotBeNull();
        created!.Id.Should().BeGreaterThan(0);
        created.Title.Should().Be("Problema con la pantalla");
        created.Content.Should().Be("La pantalla parpadea constantemente al encender el equipo.");
        created.Urgency.Should().Be(3);
        created.RequesterIds.Should().Contain(CustomWebApplicationFactory.SolicitanteId);
    }

    [Fact]
    public async Task CreateTicket_TitleTooShort_Returns400BadRequest()
    {
        var token = await AuthenticateAsSolicitanteAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/tickets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new
        {
            Title = "Hola", // < 5 chars
            Description = "Descripción válida con más de diez caracteres.",
            Urgency = 3
        });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateTicket_DescriptionTooShort_Returns400BadRequest()
    {
        var token = await AuthenticateAsSolicitanteAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/tickets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new
        {
            Title = "Título válido",
            Description = "Corta", // < 10 chars
            Urgency = 3
        });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateTicket_Unauthenticated_Returns401Unauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/tickets");
        request.Content = JsonContent.Create(new CreateTicketRequest
        {
            Title = "Título válido",
            Description = "Descripción válida con más de diez caracteres.",
            Urgency = 3
        });

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
