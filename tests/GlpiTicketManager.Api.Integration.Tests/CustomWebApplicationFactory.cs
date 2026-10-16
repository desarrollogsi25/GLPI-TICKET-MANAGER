using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Application.Dtos.Channels;
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
    public const int AdminId = 100;
    public const int SupervisorId = 101;
    public const int Group1Id = 1;
    public const int Group2Id = 2;
    public const int Ticket11Id = 11; // Group 1, unassigned, New (1)
    public const int Ticket12Id = 12; // Group 1, assigned to Tech1, Assigned (2)
    public const int Ticket13Id = 13; // Group 1, assigned to Tech2, Assigned (2)
    public const int Ticket21Id = 21; // Group 2, assigned to Tech2, Assigned (2)
    public const int Ticket22Id = 22; // Group 2, unassigned, New (1)
    public const int Ticket31Id = 31; // Group 1, unassigned, New (1) - shared for concurrency tests

    public bool SimulateInsertFailure { get; set; }
    private readonly object _stateLock = new();
    private readonly Dictionary<int, Ticket> _allTickets = new();
    private readonly List<TicketUser> _ticketUsers = new();
    private readonly List<GroupDto> _groups = new();
    private readonly List<ChannelDto> _channels = new();

    public CustomWebApplicationFactory()
    {
        ResetState();
    }

    public void ResetState()
    {
        lock (_stateLock)
        {
            SimulateInsertFailure = false;
            _allTickets.Clear();
            _allTickets[Ticket11Id] = new Ticket
            {
                Id = Ticket11Id,
                Name = "Ticket 11 (Call Center unassigned)",
                Status = (int)TicketStatus.New,
                RequesterIds = new[] { 9 },
                AssigneeIds = Array.Empty<int>()
            };
            _allTickets[Ticket12Id] = new Ticket
            {
                Id = Ticket12Id,
                Name = "Ticket 12 (Tech1 assigned)",
                Status = (int)TicketStatus.Assigned,
                RequesterIds = new[] { 9 },
                AssigneeIds = new[] { Tech1Id }
            };
            _allTickets[Ticket13Id] = new Ticket
            {
                Id = Ticket13Id,
                Name = "Ticket 13 (Tech2 assigned same group)",
                Status = (int)TicketStatus.Assigned,
                RequesterIds = new[] { 9 },
                AssigneeIds = new[] { Tech2Id }
            };
            _allTickets[Ticket21Id] = new Ticket
            {
                Id = Ticket21Id,
                Name = "Ticket 21 (Tech2 assigned)",
                Status = (int)TicketStatus.Assigned,
                RequesterIds = new[] { 9 },
                AssigneeIds = new[] { Tech2Id }
            };
            _allTickets[Ticket22Id] = new Ticket
            {
                Id = Ticket22Id,
                Name = "Ticket 22 (Group 2 unassigned)",
                Status = (int)TicketStatus.New,
                RequesterIds = new[] { 9 },
                AssigneeIds = Array.Empty<int>()
            };
            _allTickets[Ticket31Id] = new Ticket
            {
                Id = Ticket31Id,
                Name = "Ticket 31 (Group 1 unassigned concurrency test)",
                Status = (int)TicketStatus.New,
                RequesterIds = new[] { 9 },
                AssigneeIds = Array.Empty<int>()
            };

            _ticketUsers.Clear();
            _ticketUsers.Add(new TicketUser { TicketId = Ticket12Id, UserId = Tech1Id, Type = (int)TicketUserType.Assigned });
            _ticketUsers.Add(new TicketUser { TicketId = Ticket13Id, UserId = Tech2Id, Type = (int)TicketUserType.Assigned });
            _ticketUsers.Add(new TicketUser { TicketId = Ticket21Id, UserId = Tech2Id, Type = (int)TicketUserType.Assigned });

            _groups.Clear();
            _groups.Add(new GroupDto(1, "Call Center"));
            _groups.Add(new GroupDto(2, "Soporte Nivel 1"));

            _channels.Clear();
            _channels.Add(new ChannelDto(1, "Helpdesk"));
            _channels.Add(new ChannelDto(2, "E-Mail"));
            _channels.Add(new ChannelDto(3, "Phone"));
            _channels.Add(new ChannelDto(4, "Direct"));
            _channels.Add(new ChannelDto(5, "Written"));
            _channels.Add(new ChannelDto(6, "Other"));
        }
    }

    public void AddGroup(GroupDto group)
    {
        lock (_stateLock)
        {
            _groups.Add(group);
        }
    }

    public void RemoveGroup(int id)
    {
        lock (_stateLock)
        {
            _groups.RemoveAll(g => g.Id == id);
        }
    }

    public void DeactivateChannel(int id)
    {
        lock (_stateLock)
        {
            _channels.RemoveAll(c => c.Id == id);
        }
    }

    public void ActivateChannel(ChannelDto channel)
    {
        lock (_stateLock)
        {
            if (!_channels.Any(c => c.Id == channel.Id))
                _channels.Add(channel);
        }
    }

    public int GetAssigneeCount(int ticketId)
    {
        lock (_stateLock)
        {
            return _ticketUsers.Count(u => u.TicketId == ticketId && u.Type == (int)TicketUserType.Assigned);
        }
    }

    public Ticket? GetTicket(int ticketId)
    {
        lock (_stateLock)
        {
            return _allTickets.GetValueOrDefault(ticketId);
        }
    }

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
                ["Jwt:Audience"] = "GlpiTicketManager.Frontend",
                ["RateLimiting:ExpensiveTokenLimit"] = "20",
                ["RateLimiting:ExpensiveTokensPerPeriod"] = "1",
                ["RateLimiting:ExpensiveReplenishmentSeconds"] = "3",
                ["RateLimiting:PerUserRequestLimit"] = "100",
                ["RateLimiting:LoginAttemptLimit"] = "5"
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
                d.ServiceType == typeof(IAuditRepository) ||
                d.ServiceType == typeof(IGroupRepository) ||
                d.ServiceType == typeof(IChannelRepository) ||
                d.ServiceType == typeof(IUserRoleResolver)).ToList();

            foreach (var d in descriptors)
            {
                services.Remove(d);
            }

            // Mock IUserRoleResolver
            var roleResolverMock = new Mock<IUserRoleResolver>();
            roleResolverMock.Setup(r => r.ResolveAsync(Tech1Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(AppRole.Technician);
            roleResolverMock.Setup(r => r.ResolveAsync(Tech2Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(AppRole.Technician);
            roleResolverMock.Setup(r => r.ResolveAsync(AdminId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(AppRole.Admin);
            roleResolverMock.Setup(r => r.ResolveAsync(SupervisorId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(AppRole.Supervisor);

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

            userRepoMock.Setup(u => u.GetByNameAsync("admin_test", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UserAccount
                {
                    Id = AdminId,
                    Name = "admin_test",
                    RealName = "Admin User",
                    FirstName = "Admin",
                    PasswordHash = "admin_hash",
                    IsActive = true,
                    IsDeleted = false,
                    ProfileId = 4,
                    DefaultEntityId = 0
                });

            userRepoMock.Setup(u => u.GetByNameAsync("supervisor_test", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UserAccount
                {
                    Id = SupervisorId,
                    Name = "supervisor_test",
                    RealName = "Supervisor User",
                    FirstName = "Supervisor",
                    PasswordHash = "sup_hash",
                    IsActive = true,
                    IsDeleted = false,
                    ProfileId = 7,
                    DefaultEntityId = 0
                });

            // Mock IPasswordHasher
            var hasherMock = new Mock<IPasswordHasher>();
            hasherMock.Setup(h => h.Verify("Tech1Pass!", "hash1")).Returns(true);
            hasherMock.Setup(h => h.Verify("Tech2Pass!", "hash2")).Returns(true);
            hasherMock.Setup(h => h.Verify("AdminPass123!", "admin_hash")).Returns(true);
            hasherMock.Setup(h => h.Verify("SupervisorPass123!", "sup_hash")).Returns(true);

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
            glpiMock.Setup(g => g.CreateSolutionAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

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

            var ticket13 = new Ticket
            {
                Id = Ticket13Id,
                Name = "Ticket 13 (Tech2 assigned same group)",
                Status = (int)TicketStatus.Assigned,
                RequesterIds = new[] { 9 },
                AssigneeIds = new[] { Tech2Id }
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
                [Ticket13Id] = ticket13,
                [Ticket21Id] = ticket21,
                [Ticket22Id] = ticket22
            };

            // Mock ITicketRepository
            var ticketRepoMock = new Mock<ITicketRepository>();

            ticketRepoMock.Setup(t => t.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((int id, CancellationToken _) =>
                {
                    lock (_stateLock)
                    {
                        return _allTickets.GetValueOrDefault(id);
                    }
                });

            ticketRepoMock.Setup(t => t.GetGroupIdsForUserAsync(Tech1Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group1Id });

            ticketRepoMock.Setup(t => t.GetGroupIdsForUserAsync(Tech2Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group1Id, Group2Id });

            ticketRepoMock.Setup(t => t.GetGroupIdsForUserAsync(SupervisorId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group1Id });

            ticketRepoMock.Setup(t => t.GetGroupIdsForUserAsync(AdminId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Array.Empty<int>());

            ticketRepoMock.Setup(t => t.GetGroupIdsForTicketAsync(It.Is<int>(id => id == Ticket11Id || id == Ticket12Id || id == Ticket13Id || id == Ticket31Id), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group1Id });

            ticketRepoMock.Setup(t => t.GetGroupIdsForTicketAsync(It.Is<int>(id => id == Ticket21Id || id == Ticket22Id), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new[] { Group2Id });

            ticketRepoMock.Setup(t => t.IsUserAssignedToTicketAsync(Tech1Id, Ticket12Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            ticketRepoMock.Setup(t => t.IsUserAssignedToTicketAsync(Tech2Id, Ticket13Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            ticketRepoMock.Setup(t => t.IsUserAssignedToTicketAsync(Tech2Id, Ticket21Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            ticketRepoMock.Setup(t => t.HasAssigneeAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((int id, CancellationToken _) =>
                {
                    lock (_stateLock)
                    {
                        return _ticketUsers.Any(u => u.TicketId == id && u.Type == (int)TicketUserType.Assigned);
                    }
                });

            ticketRepoMock.Setup(t => t.GetFilteredAsync(Tech1Id, It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    lock (_stateLock)
                    {
                        return new[] { _allTickets[Ticket12Id] };
                    }
                });

            ticketRepoMock.Setup(t => t.CountFilteredAsync(Tech1Id, It.IsAny<int?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(1L);

            ticketRepoMock.Setup(t => t.GetFilteredAsync(Tech2Id, It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    lock (_stateLock)
                    {
                        return new[] { _allTickets[Ticket13Id], _allTickets[Ticket21Id] };
                    }
                });

            ticketRepoMock.Setup(t => t.CountFilteredAsync(Tech2Id, It.IsAny<int?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(2L);

            ticketRepoMock.Setup(t => t.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((IReadOnlyCollection<int> ids, CancellationToken _) =>
                {
                    lock (_stateLock)
                    {
                        return _ticketUsers.Where(u => ids.Contains(u.TicketId)).ToList();
                    }
                });

            ticketRepoMock.Setup(t => t.ClaimAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((int ticketId, int userId, int updatedBy, CancellationToken _) =>
                {
                    lock (_stateLock)
                    {
                        if (!_allTickets.TryGetValue(ticketId, out var ticket))
                            return false;

                        // Conditional UPDATE: WHERE status = 1 AND NOT EXISTS (assignee type = 2)
                        bool hasAssignee = _ticketUsers.Any(u => u.TicketId == ticketId && u.Type == (int)TicketUserType.Assigned);
                        if (ticket.Status != (int)TicketStatus.New || hasAssignee)
                        {
                            return false;
                        }

                        if (SimulateInsertFailure)
                        {
                            // Failure during INSERT in transaction: rolled back, status remains New (1) and unassigned
                            throw new InvalidOperationException("Simulated database failure during INSERT into glpi_tickets_users.");
                        }

                        _allTickets[ticketId] = new Ticket
                        {
                            Id = ticket.Id,
                            Name = ticket.Name,
                            Content = ticket.Content,
                            Status = (int)TicketStatus.Assigned,
                            Type = ticket.Type,
                            Priority = ticket.Priority,
                            Urgency = ticket.Urgency,
                            Impact = ticket.Impact,
                            CategoryId = ticket.CategoryId,
                            CreatedAt = ticket.CreatedAt,
                            UpdatedAt = DateTime.UtcNow,
                            SolvedAt = ticket.SolvedAt,
                            ClosedAt = ticket.ClosedAt,
                            IsDeleted = ticket.IsDeleted,
                            HasSolution = ticket.HasSolution,
                            RequesterIds = ticket.RequesterIds,
                            AssigneeIds = new[] { userId }
                        };
                        _ticketUsers.Add(new TicketUser
                        {
                            TicketId = ticketId,
                            UserId = userId,
                            Type = (int)TicketUserType.Assigned
                        });

                        return true;
                    }
                });

            ticketRepoMock.Setup(t => t.GetUnassignedByGroupAsync(Group1Id, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PagedResult<Ticket>(new[] { ticket11 }, 1, 20, 0));

            ticketRepoMock.Setup(t => t.GetUnassignedByGroupAsync(Group2Id, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PagedResult<Ticket>(new[] { ticket22 }, 1, 20, 0));

            ticketRepoMock.Setup(t => t.GetDashboardStatsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DashboardStats { TotalTickets = 5, OpenTickets = 5, ByStatus = new List<TicketStatusCount>(), ByTechnician = new List<TechnicianWorkload>() });

            ticketRepoMock.Setup(t => t.GetDashboardStatsAsync(It.IsAny<DashboardScope?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((DashboardScope? scope, CancellationToken _) =>
                {
                    if (scope is not null && scope.Role == AppRole.Technician)
                    {
                        return new DashboardStats
                        {
                            TotalTickets = 1,
                            OpenTickets = 1,
                            ByStatus = new List<TicketStatusCount>(),
                            ByTechnician = new List<TechnicianWorkload>()
                        };
                    }

                    return new DashboardStats
                    {
                        TotalTickets = 5,
                        OpenTickets = 5,
                        ByStatus = new List<TicketStatusCount>(),
                        ByTechnician = new List<TechnicianWorkload>()
                    };
                });

            var groupRepoMock = new Mock<IGroupRepository>();
            groupRepoMock.Setup(g => g.GetByEntityAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((int entityId, CancellationToken _) =>
                {
                    lock (_stateLock)
                    {
                        return _groups.ToList();
                    }
                });

            var channelRepoMock = new Mock<IChannelRepository>();
            channelRepoMock.Setup(c => c.GetAllActiveAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync((CancellationToken _) =>
                {
                    lock (_stateLock)
                    {
                        return _channels.ToList();
                    }
                });

            services.AddSingleton(roleResolverMock.Object);
            services.AddSingleton(userRepoMock.Object);
            services.AddSingleton(hasherMock.Object);
            services.AddSingleton(revokedMock.Object);
            services.AddSingleton(auditMock.Object);
            services.AddSingleton(glpiMock.Object);
            services.AddSingleton(ticketRepoMock.Object);
            services.AddSingleton(groupRepoMock.Object);
            services.AddSingleton(channelRepoMock.Object);
        });
    }
}
