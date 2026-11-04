using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Dtos.Auth;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Domain.Entities;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public sealed class TicketListScopeTests
{
    [Fact]
    public async Task TechnicianServiceFilterCannotWidenAssigneeScope()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        var existing = factory.GetTicket(CustomWebApplicationFactory.Ticket21Id)!;
        factory.AddTicket(new Ticket
        {
            Id = existing.Id,
            Name = existing.Name,
            Content = existing.Content,
            Status = existing.Status,
            Type = existing.Type,
            Priority = existing.Priority,
            Urgency = existing.Urgency,
            Impact = existing.Impact,
            CategoryId = 991,
            CreatedAt = existing.CreatedAt,
            UpdatedAt = existing.UpdatedAt,
            AssigneeIds = existing.AssigneeIds,
            RequesterIds = existing.RequesterIds,
        });

        using var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "tech1",
            Password = TestCredentials.Tech1
        });
        login.EnsureSuccessStatusCode();
        var credentials = await login.Content.ReadFromJsonAsync<LoginResponse>();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/tickets?serviceId=991");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", credentials!.AccessToken);
        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    [Fact]
    public async Task SupervisorAssigneeFilterRemainsInsideServerDerivedGroupScope()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        using var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "supervisor_test",
            Password = TestCredentials.Supervisor
        });
        login.EnsureSuccessStatusCode();
        var credentials = await login.Content.ReadFromJsonAsync<LoginResponse>();

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/tickets?assigneeId={CustomWebApplicationFactory.Tech2Id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", credentials!.AccessToken);
        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().ContainSingle(t => t.Id == CustomWebApplicationFactory.Ticket13Id);
        result.Items.Should().NotContain(t => t.Id == CustomWebApplicationFactory.Ticket21Id);
        result.Total.Should().Be(1);
    }
}
