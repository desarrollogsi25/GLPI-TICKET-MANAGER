using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GlpiTicketManager.Application.Dtos.Auth;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>H-03: technicians cannot add solutions or resolve a colleague's ticket.</summary>
public sealed class SolutionAuthorizationTests
{
    [Fact]
    public async Task SameGroupTechnicianIsDeniedOnAllSolutionRoutesBeforeExternalWrites()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        using var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech1",
            Password = TestCredentials.Tech1
        });
        login.EnsureSuccessStatusCode();
        var credentials = await login.Content.ReadFromJsonAsync<LoginResponse>();
        var ticketId = CustomWebApplicationFactory.Ticket13Id; // same group, assigned to tech2

        async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", credentials!.AccessToken);
            return await client.SendAsync(request);
        }

        using var addSolution = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{ticketId}/solutions")
        {
            Content = JsonContent.Create(new { content = "Intento sin asignación" })
        };
        using var addSolutionResponse = await SendAsync(addSolution);

        using var resolve = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{ticketId}/resolve")
        {
            Content = JsonContent.Create(new { content = "Intento de resolución sin asignación" })
        };
        using var resolveResponse = await SendAsync(resolve);

        using var patchStatus = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{ticketId}/status")
        {
            Content = JsonContent.Create(new { status = 5, solution = "Intento de PATCH con solución" })
        };
        using var patchStatusResponse = await SendAsync(patchStatus);

        Assert.Equal(HttpStatusCode.Forbidden, addSolutionResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, resolveResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, patchStatusResponse.StatusCode);
        factory.GlpiMock.Verify(
            glpi => glpi.CreateSolutionAsync(ticketId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        factory.GlpiMock.Verify(
            glpi => glpi.UpdateTicketStatusAsync(ticketId, It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
        factory.NotificationMock.Verify(
            notifications => notifications.NotifySolutionAddedAsync(ticketId, It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
        factory.NotificationMock.Verify(
            notifications => notifications.NotifyTicketStatusChangedAsync(
                ticketId,
                It.IsAny<int>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
