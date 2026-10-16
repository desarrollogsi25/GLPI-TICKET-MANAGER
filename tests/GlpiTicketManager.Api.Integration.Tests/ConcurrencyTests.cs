using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Domain.Enums;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class ConcurrencyTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ConcurrencyTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _factory.ResetState();
    }

    private async Task<string> LoginAsync(string username, string password)
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = username,
            Password = password
        });

        loginResponse.EnsureSuccessStatusCode();
        var body = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrEmpty();
        return body.AccessToken;
    }

    private Task<int> GetAssigneeCountFromDb(int ticketId)
    {
        return Task.FromResult(_factory.GetAssigneeCount(ticketId));
    }

    [Fact]
    public async Task TwoTechsClaimSameTicket_OnlyOneSucceeds()
    {
        _factory.ResetState();
        int ticketId = CustomWebApplicationFactory.Ticket31Id;

        // Login tech1 y tech2 (ambos en Grupo 1)
        var token1 = await LoginAsync("tech1", "Tech1Pass!");
        var token2 = await LoginAsync("tech2", "Tech2Pass!");

        var client1 = _factory.CreateClient();
        client1.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token1);

        var client2 = _factory.CreateClient();
        client2.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token2);

        var task1 = client1.PostAsync($"/api/tickets/{ticketId}/claim", null);
        var task2 = client2.PostAsync($"/api/tickets/{ticketId}/claim", null);

        var responses = await Task.WhenAll(task1, task2);

        // Solo uno debe ser 200, el otro 409
        var statusCodes = responses.Select(r => (int)r.StatusCode).OrderBy(x => x);
        Assert.Equal(new[] { 200, 409 }, statusCodes.ToArray());

        // Verificar en BD: solo UNA fila type=2
        var count = await GetAssigneeCountFromDb(ticketId);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task ClaimFailsDuringInsert_TransactionRollsBack_TicketRemainsNewAndUnassigned()
    {
        _factory.ResetState();
        int ticketId = CustomWebApplicationFactory.Ticket31Id;
        _factory.SimulateInsertFailure = true;

        try
        {
            var token = await LoginAsync("tech1", "Tech1Pass!");
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsync($"/api/tickets/{ticketId}/claim", null);

            // La excepción no capturada de DB durante el INSERT aborta la transacción y responde con 500
            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

            // Verificar que el rollback dejó el ticket en status 1 (New) y sin asignación
            var ticket = _factory.GetTicket(ticketId);
            ticket.Should().NotBeNull();
            ticket!.Status.Should().Be((int)TicketStatus.New);

            var count = await GetAssigneeCountFromDb(ticketId);
            Assert.Equal(0, count);
        }
        finally
        {
            _factory.SimulateInsertFailure = false;
            _factory.ResetState();
        }
    }

    [Fact]
    public async Task ClaimAlreadyClaimedTicket_Returns409()
    {
        _factory.ResetState();
        int ticketId = CustomWebApplicationFactory.Ticket31Id;

        var token = await LoginAsync("tech1", "Tech1Pass!");
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        // tech1 reclama ticket → 200
        var firstResponse = await client.PostAsync($"/api/tickets/{ticketId}/claim", null);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // tech1 intenta reclamar de nuevo → 409
        var secondResponse = await client.PostAsync($"/api/tickets/{ticketId}/claim", null);
        secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }
}
