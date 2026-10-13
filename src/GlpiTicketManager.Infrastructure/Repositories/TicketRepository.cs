using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using Microsoft.Extensions.Options;

namespace GlpiTicketManager.Infrastructure.Repositories;

/// <summary>
/// Dapper implementation of the ticket read side.
/// </summary>
public sealed class TicketRepository : ITicketRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly DatabaseOptions _options;

    public TicketRepository(IDbConnectionFactory connectionFactory, IOptions<DatabaseOptions> options)
    {
        _connectionFactory = connectionFactory;
        _options = options.Value;
    }

    public async Task<IReadOnlyList<Ticket>> GetByAssigneeAsync(
        int assigneeId,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            TicketQueries.ByAssignee,
            new { AssigneeId = assigneeId, Limit = limit, Offset = offset },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var rows = await connection.QueryAsync<Ticket>(command);
        return rows.AsList();
    }

    public async Task<long> CountByAssigneeAsync(int assigneeId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            TicketQueries.CountByAssignee,
            new { AssigneeId = assigneeId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<long>(command);
    }

    public async Task<Ticket?> GetByIdAsync(int ticketId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            TicketQueries.Detail,
            new { TicketId = ticketId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        using var reader = await connection.QueryMultipleAsync(command);

        var ticket = await reader.ReadFirstOrDefaultAsync<Ticket>();
        if (ticket is null)
        {
            return null;
        }

        ticket.Followups = (await reader.ReadAsync<TicketFollowup>()).AsList();
        var links = (await reader.ReadAsync<TicketUser>()).AsList();

        ticket.AssigneeIds = links
            .Where(link => link.Type == (int)Domain.Enums.TicketUserType.Assigned)
            .Select(link => link.UserId)
            .ToArray();

        ticket.RequesterIds = links
            .Where(link => link.Type == (int)Domain.Enums.TicketUserType.Requester)
            .Select(link => link.UserId)
            .ToArray();

        return ticket;
    }

    public async Task<IReadOnlyList<TicketUser>> GetUsersForTicketsAsync(
        IReadOnlyCollection<int> ticketIds,
        CancellationToken cancellationToken)
    {
        if (ticketIds.Count == 0)
        {
            return [];
        }

        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            TicketQueries.UsersByTicketIds,
            new { TicketIds = ticketIds },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var rows = await connection.QueryAsync<TicketUser>(command);
        return rows.AsList();
    }

    public async Task<DashboardStats> GetDashboardStatsAsync(CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            TicketQueries.Dashboard,
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        using var reader = await connection.QueryMultipleAsync(command);

        var stats = await reader.ReadSingleAsync<DashboardStats>();
        stats.ByStatus = (await reader.ReadAsync<TicketStatusCount>()).AsList();
        stats.ByTechnician = (await reader.ReadAsync<TechnicianWorkload>()).AsList();

        return stats;
    }
}
