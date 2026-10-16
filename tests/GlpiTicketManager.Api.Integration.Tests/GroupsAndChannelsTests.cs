using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Channels;
using GlpiTicketManager.Application.Dtos.Groups;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class GroupsAndChannelsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public GroupsAndChannelsTests(CustomWebApplicationFactory factory)
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
    public async Task GetGroups_ReturnsGroupsFromDatabase()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/groups");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var groups = await response.Content.ReadFromJsonAsync<List<GroupDto>>();
        groups.Should().NotBeNull();
        groups!.Count.Should().BeGreaterOrEqualTo(2);
        groups.Select(g => g.Name).Should().Contain(new[] { "Call Center", "Soporte Nivel 1" });
    }

    [Fact]
    public async Task GetGroups_WhenNewGroupInserted_ReturnsIt()
    {
        var token = await AuthenticateAsTech1Async();
        var newGroup = new GroupDto(999, "Grupo Test");
        _factory.AddGroup(newGroup);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, "/api/groups");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.SendAsync(request);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var groups = await response.Content.ReadFromJsonAsync<List<GroupDto>>();
            groups.Should().NotBeNull();
            groups!.Should().Contain(g => g.Id == 999 && g.Name == "Grupo Test");
        }
        finally
        {
            _factory.RemoveGroup(999);
        }
    }

    [Fact]
    public async Task GetChannels_ReturnsActiveChannelsFromDatabase()
    {
        var token = await AuthenticateAsTech1Async();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/channels");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var channels = await response.Content.ReadFromJsonAsync<List<ChannelDto>>();
        channels.Should().NotBeNull();
        channels!.Count.Should().BeGreaterOrEqualTo(6);
        channels.Select(c => c.Name).Should().Contain(new[] { "Helpdesk", "E-Mail", "Phone", "Direct", "Written", "Other" });
    }

    [Fact]
    public async Task GetChannels_WhenChannelDeactivated_DoesNotReturnIt()
    {
        var token = await AuthenticateAsTech1Async();
        _factory.DeactivateChannel(6); // Other

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, "/api/channels");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.SendAsync(request);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var channels = await response.Content.ReadFromJsonAsync<List<ChannelDto>>();
            channels.Should().NotBeNull();
            channels!.Should().NotContain(c => c.Id == 6 || c.Name == "Other");
        }
        finally
        {
            _factory.ActivateChannel(new ChannelDto(6, "Other"));
        }
    }
}
