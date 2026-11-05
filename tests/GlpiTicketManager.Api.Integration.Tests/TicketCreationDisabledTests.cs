using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class TicketCreationDisabledTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public TicketCreationDisabledTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Theory]
    [InlineData("admin_test")]
    [InlineData("supervisor_test")]
    [InlineData("tech1")]
    [InlineData("solicitante_test")]
    public async Task Creation_IsUnavailable_EvenForAuthenticatedUsers(string username)
    {
        _factory.ResetState();
        using var client = _factory.CreateClient();
        var password = username switch
        {
            "admin_test" => TestCredentials.Admin,
            "supervisor_test" => TestCredentials.Supervisor,
            "tech1" => TestCredentials.Tech1,
            _ => TestCredentials.Solicitante
        };
        using var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = username, Password = password
        });
        login.EnsureSuccessStatusCode();
        var session = (await login.Content.ReadFromJsonAsync<LoginResponse>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
        _factory.GlpiMock.Invocations.Clear();

        using var response = await client.PostAsJsonAsync("/api/tickets", new
        {
            title = "Forbidden channel", description = "Must not create a ticket", urgency = 3, categoryId = 12
        });

        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
        _factory.GlpiMock.Invocations.Should().NotContain(i => i.Method.Name == "CreateTicketAsync");
    }
}
