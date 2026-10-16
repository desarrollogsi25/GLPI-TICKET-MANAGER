using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace GlpiTicketManager.Api.Integration.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public const int Tech1Id = 7;
    public const int Tech2Id = 8;
    public const int Group1Id = 1;
    public const int Group2Id = 2;
    public const int Ticket11Id = 11; // Group 1, unassigned, New (1)
    public const int Ticket12Id = 12; // Group 1, assigned to Tech1, Assigned (2)
    public const int Ticket21Id = 21; // Group 2, assigned to Tech2, Assigned (2)
    public const int Ticket22Id = 22; // Group 2, unassigned, New (1)

    static CustomWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("Database__ConnectionString", "Server=127.0.0.1;Port=3306;Database=glpi;User=glpi;Password=SecretNonDefaultPass123!;");
        Environment.SetEnvironmentVariable("AppDb__ConnectionString", "Host=127.0.0.1;Port=5432;Database=glpi_ticket_manager;Username=app;Password=SecretAppDbPass123!;");
        Environment.SetEnvironmentVariable("GlpiApi__AppToken", "integration-test-app-token-32-chars-minimum!!");
        Environment.SetEnvironmentVariable("GlpiApi__UserToken", "integration-test-user-token-32-chars-minimum!!");
        Environment.SetEnvironmentVariable("Jwt__Key", "integration-test-secret-signing-key-32-chars-minimum!!");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:ConnectionString"] = "Server=127.0.0.1;Port=3306;Database=glpi;User=glpi;Password=secretpass123;",
                ["AppDb:ConnectionString"] = "Host=127.0.0.1;Port=5432;Database=glpi_ticket_manager;Username=app;Password=secretpass123",
                ["GlpiApi:AppToken"] = "integration-test-app-token-32-chars-minimum!!",
                ["GlpiApi:UserToken"] = "integration-test-user-token-32-chars-minimum!!",
                ["Jwt:Key"] = "integration-test-secret-signing-key-32-chars-minimum!!",
                ["Jwt:Issuer"] = "GlpiTicketManager.Api",
                ["Jwt:Audience"] = "GlpiTicketManager.Frontend"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove existing repo registrations if present
            var descriptors = services.Where(d =>
                d.ServiceType == typeof(ITicketRepository) ||
                d.ServiceType == typeof(IUserRepository) ||
                d.ServiceType == typeof(IPasswordHasher) ||
                d.ServiceType == typeof(IRevokedTokenRepository) ||
                d.ServiceType == typeof(IGlpiApiClient) ||
                d.ServiceType == typeof(IAuditRepository)).ToList();

            foreach (var d in descriptors)
            {
                services.Remove(d);
            }

            // Mock IUserRepository
            var userRepoMock = new Mock<IUserRepository>();
            userRepoMock.Setup(u => u.GetByNameAsync("tech1", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UserAccount
                {
                    Id = Tech1Id,
                    Name = "tech1",
                    RealName = "Technician 1",
                    FirstName = "Tech1",
                    PasswordHash = "hash1",
                    IsActive = true,
                    IsDeleted = false,
                    ProfileId = 6,
                    DefaultEntityId = 0
                });

            userRepoMock.Setup(u => u.GetByNameAsync("tech2", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UserAccount
                {
                    Id = Tech2Id,
                    Name = "tech2",
                    RealName = "Technician 2",
                    FirstName = "Tech2",
                    PasswordHash = "hash2",
                    IsActive = true,
                    IsDeleted = false,
                    ProfileId = 6,
                    DefaultEntityId = 0
                });

            // Mock IPasswordHasher
            var hasherMock = new Mock<IPasswordHasher>();
            hasherMock.Setup(h => h.Verify("Tech1Pass!", "hash1")).Returns(true);
            hasherMock.Setup(h => h.Verify("Tech2Pass!", "hash2")).Returns(true);

            // Mock IRevokedTokenRepository
            var revokedMock = new Mock<IRevokedTokenRepository>();
            revokedMock.Setup(r => r.IsRevokedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            // Mock IAuditRepository
            var auditMock = new Mock<IAuditRepository>();
            auditMock.Setup(a => a.LogAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(1L);

            // Mock IGlpiApiClient
            var glpiMock = new Mock<IGlpiApiClient>();
            glpiMock.Setup(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Setup tickets
            var ticket11 = new Ticket
            {
                Id = Ticket11Id,
                Name = "Ticket 11 (Call Center unassigned)",
                Status = (int)TicketStatus.New,
                RequesterIds = new[] { 9 },
                AssigneeIds = Array.Empty<int>()
            };

            var ticket12 = new Ticket
            {
                Id = Ticket12Id,
                Name = "Ticket 12 (Tech1 assigned)",
                Status = (int)TicketStatus.Assigned,
                RequesterIds = new[] { 9 },
                AssigneeIds = new[] { Tech1Id }
            };

            var ticket21 = new Ticket
            {
                Id = Ticket21Id,
                Name = "Ticket 21 (Tech2 assigned)",
                Status = (int)TicketStatus.Assigned,
                RequesterIds = new[] { 9 },
                AssigneeIds = new[] { Tech2Id }
            };

            var ticket22 = new Ticket
            {
                Id = Ticket22Id,
                Name = "Ticket 22 (Group 2 unassigned)",
                Status = (int)TicketStatus.New,
                RequesterIds = new[] { 9 },
                AssigneeIds = Array.Empty<int>()
            };

            var allTickets = new Dictionary<int, Ticket>
            {
                [Ticket11Id] = ticket11,
                [Ticket12Id] = ticket12,
                [Ticket21Id] = ticket21,
                [Ticket22Id] = ticket22
            };

            // Mock ITicketRepository
            var ticketRepoMock = new Mock<ITicketRepository>();

            ticketRepoMock.Setup(t => t.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((int id, CancellationToken _) => allTickets.GetValueOrDefault(id));

            ticketRepoMock.Setup(t => t.GetGroupIdsForUserAsync(Tech1Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group1Id });

            ticketRepoMock.Setup(t => t.GetGroupIdsForUserAsync(Tech2Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group2Id });

            ticketRepoMock.Setup(t => t.GetGroupIdsForTicketAsync(It.Is<int>(id => id == Ticket11Id || id == Ticket12Id), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group1Id });

            ticketRepoMock.Setup(t => t.GetGroupIdsForTicketAsync(It.Is<int>(id => id == Ticket21Id || id == Ticket22Id), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group2Id });

            ticketRepoMock.Setup(t => t.IsUserAssignedToTicketAsync(Tech1Id, Ticket12Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            ticketRepoMock.Setup(t => t.IsUserAssignedToTicketAsync(Tech2Id, Ticket21Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            ticketRepoMock.Setup(t => t.GetFilteredAsync(Tech1Id, It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { ticket12 });

            ticketRepoMock.Setup(t => t.CountFilteredAsync(Tech1Id, It.IsAny<int?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(1L);

            ticketRepoMock.Setup(t => t.GetFilteredAsync(Tech2Id, It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { ticket21 });

            ticketRepoMock.Setup(t => t.CountFilteredAsync(Tech2Id, It.IsAny<int?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(1L);

            ticketRepoMock.Setup(t => t.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((IReadOnlyCollection<int> ids, CancellationToken _) =>
                {
                    var links = new List<TicketUser>();
                    if (ids.Contains(Ticket12Id))
                        links.Add(new TicketUser { TicketId = Ticket12Id, UserId = Tech1Id, Type = (int)TicketUserType.Assigned });
                    if (ids.Contains(Ticket21Id))
                        links.Add(new TicketUser { TicketId = Ticket21Id, UserId = Tech2Id, Type = (int)TicketUserType.Assigned });
                    return links;
                });

            ticketRepoMock.Setup(t => t.GetUnassignedByGroupAsync(Group1Id, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PagedResult<Ticket>(new[] { ticket11 }, 1, 20, 0));

            ticketRepoMock.Setup(t => t.GetUnassignedByGroupAsync(Group2Id, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PagedResult<Ticket>(new[] { ticket22 }, 1, 20, 0));

            services.AddSingleton(userRepoMock.Object);
            services.AddSingleton(hasherMock.Object);
            services.AddSingleton(revokedMock.Object);
            services.AddSingleton(auditMock.Object);
            services.AddSingleton(glpiMock.Object);
            services.AddSingleton(ticketRepoMock.Object);
        });
    }
}
