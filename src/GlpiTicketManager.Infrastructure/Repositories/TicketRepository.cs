using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Channels;
using GlpiTicketManager.Application.Dtos.Groups;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
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

    public async Task<PagedResult<Ticket>> GetUnassignedByGroupAsync(
        int groupId,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var countCommand = new CommandDefinition(
            "SELECT COUNT(*) FROM glpi_tickets t INNER JOIN glpi_groups_tickets gt ON t.id = gt.tickets_id WHERE gt.groups_id = @GroupId AND gt.type = 2 AND t.status = 1 AND NOT EXISTS (SELECT 1 FROM glpi_tickets_users tu WHERE tu.tickets_id = t.id AND tu.type = 2)",
            new { GroupId = groupId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var total = await connection.ExecuteScalarAsync<int>(countCommand);

        var command = new CommandDefinition(
            TicketQueries.UnassignedByGroup,
            new { GroupId = groupId, Limit = limit, Offset = offset },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var rows = await connection.QueryAsync<Ticket>(command);
        return new PagedResult<Ticket>(rows.ToList(), total, limit, offset);
    }

    public async Task<bool> ClaimAsync(int ticketId, int userId, int updatedBy, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        try
        {
            var claimCommand = new CommandDefinition(
                TicketUserQueries.Claim,
                new { TicketId = ticketId, UserId = userId, UpdatedBy = updatedBy },
                commandTimeout: _options.CommandTimeoutSeconds,
                cancellationToken: cancellationToken);

            await connection.ExecuteAsync(claimCommand);

            var updateCommand = new CommandDefinition(
                TicketQueries.UpdateStatus,
                new { NewStatus = 2, UpdatedBy = updatedBy, TicketId = ticketId },
                commandTimeout: _options.CommandTimeoutSeconds,
                cancellationToken: cancellationToken);

            await connection.ExecuteAsync(updateCommand);

            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> SolutionExistsAsync(int ticketId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            SolutionQueries.Exists,
            new { TicketId = ticketId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var result = await connection.QueryFirstOrDefaultAsync<bool>(command);
        return result;
    }

    public async Task<int> SolutionInsertAsync(int ticketId, string content, int userId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            SolutionQueries.Insert,
            new { TicketId = ticketId, Content = content, UserId = userId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var result = await connection.ExecuteScalarAsync<int>(command);
        return result;
    }

    public async Task<bool> IsUserInTicketGroupAsync(int ticketId, int userId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            @"SELECT COUNT(*) > 0 AS IsMember
              FROM glpi_groups_tickets gt
              INNER JOIN glpi_groups_users gu ON gu.groups_id = gt.groups_id
              WHERE gt.tickets_id = @TicketId
                AND gt.type = 2
                AND gu.users_id = @UserId",
            new { TicketId = ticketId, UserId = userId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var result = await connection.QueryFirstOrDefaultAsync<bool>(command);
        return result;
    }
    public async Task<IReadOnlyList<int>> GetGroupIdsForUserAsync(int userId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            "SELECT groups_id FROM glpi_groups_users WHERE users_id = @UserId",
            new { UserId = userId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var result = await connection.QueryAsync<int>(command);
        return result.AsList();
    }
}
