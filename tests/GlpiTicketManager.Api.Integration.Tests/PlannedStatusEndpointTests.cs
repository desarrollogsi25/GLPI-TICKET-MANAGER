using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Domain.Enums;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Uses a dedicated host so assertions about external effects cannot be polluted by
/// other integration tests sharing the class fixture.
/// </summary>
public sealed class PlannedStatusEndpointTests
{
    [Fact]
    public async Task DirectStatusThreePatchIsRejectedBeforeGlpiOrNotificationWrites()
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

        factory.GlpiMock.Invocations.Clear();
        factory.NotificationMock.Invocations.Clear();

        using var request = new HttpRequestMessage(
            HttpMethod.Patch,
            $"/api/tickets/{CustomWebApplicationFactory.Ticket12Id}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", credentials!.AccessToken);
        request.Content = JsonContent.Create(new { status = (int)TicketStatus.Planned });

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        factory.GlpiMock.Verify(
            glpi => glpi.UpdateTicketStatusAsync(
                CustomWebApplicationFactory.Ticket12Id,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        factory.NotificationMock.Verify(
            notifications => notifications.NotifyTicketStatusChangedAsync(
                CustomWebApplicationFactory.Ticket12Id,
                It.IsAny<int>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
