using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using Microsoft.AspNetCore.SignalR.Client;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class SignalRTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SignalRTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _factory.ResetState();
    }

    private async Task<string> AuthenticateAsTech1Async()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
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
    public async Task HubConnection_WithoutToken_Fails()
    {
        var hubConnection = new HubConnectionBuilder()
            .WithUrl(new Uri(_client.BaseAddress!, "/hubs/tickets"), options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

        var act = async () => await hubConnection.StartAsync();

        await act.Should().ThrowAsync<Exception>();
        hubConnection.State.Should().Be(HubConnectionState.Disconnected);
    }

    [Fact]
    public async Task HubConnection_WithValidJwt_ConnectsAndCanSubscribe()
    {
        var token = await AuthenticateAsTech1Async();

        var hubConnection = new HubConnectionBuilder()
            .WithUrl(new Uri(_client.BaseAddress!, $"/hubs/tickets?access_token={token}"), options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

        await hubConnection.StartAsync();
        hubConnection.State.Should().Be(HubConnectionState.Connected);

        var subscribeAct = async () => await hubConnection.InvokeAsync("SubscribeToGroup", CustomWebApplicationFactory.Group1Id);
        await subscribeAct.Should().NotThrowAsync();

        var unsubscribeAct = async () => await hubConnection.InvokeAsync("UnsubscribeFromGroup", CustomWebApplicationFactory.Group1Id);
        await unsubscribeAct.Should().NotThrowAsync();

        await hubConnection.StopAsync();
        hubConnection.State.Should().Be(HubConnectionState.Disconnected);
    }
}
