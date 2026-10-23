using System.Data.Common;
using System.Text;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
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
        return await GetFilteredAsync(assigneeId, null, limit, offset, cancellationToken);
    }

    public async Task<long> CountByAssigneeAsync(int assigneeId, CancellationToken cancellationToken)
    {
        return await CountFilteredAsync(assigneeId, null, cancellationToken);
    }

    public Task<IReadOnlyList<Ticket>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int limit,
        int offset,
        CancellationToken cancellationToken) =>
        GetFilteredAsync(assigneeId, serviceId, null, limit, offset, cancellationToken);

    public async Task<IReadOnlyList<Ticket>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int? requesterId,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        return await GetFilteredAsync(
            assigneeId,
            serviceId,
            requesterId,
            null,
            null,
            limit,
            offset,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Ticket>> GetFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int? requesterId,
        DateTime? startDate,
        DateTime? endDate,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var (sql, parameters) = BuildFilterQuery(
            TicketQueries.BaseProjection,
            assigneeId,
            serviceId,
            requesterId,
            startDate,
            endDate,
            limit,
            offset);

        var command = new CommandDefinition(
            sql,
            parameters,
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var rows = await connection.QueryAsync<Ticket>(command);
        return rows.AsList();
    }

    public Task<long> CountFilteredAsync(
        int? assigneeId,
        int? serviceId,
        CancellationToken cancellationToken) =>
        CountFilteredAsync(assigneeId, serviceId, null, cancellationToken);

    public async Task<long> CountFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int? requesterId,
        CancellationToken cancellationToken)
    {
        return await CountFilteredAsync(
            assigneeId,
            serviceId,
            requesterId,
            null,
            null,
            cancellationToken);
    }

    public async Task<long> CountFilteredAsync(
        int? assigneeId,
        int? serviceId,
        int? requesterId,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var (sql, parameters) = BuildFilterQuery(
            "SELECT COUNT(*) FROM glpi_tickets t\n",
            assigneeId,
            serviceId,
            requesterId,
            startDate,
            endDate,
            limit: null,
            offset: null);

        var command = new CommandDefinition(
            sql,
            parameters,
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<long>(command);
    }

    private static (string Sql, DynamicParameters Parameters) BuildFilterQuery(
        string baseSql,
        int? assigneeId,
        int? serviceId,
        int? requesterId,
        DateTime? startDate,
        DateTime? endDate,
        int? limit,
        int? offset)
    {
        var parameters = new DynamicParameters();
        var sql = new StringBuilder(baseSql);

        if (assigneeId.HasValue)
        {
            sql.AppendLine("INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id AND tu.type = 2");
            parameters.Add("AssigneeId", assigneeId.Value);
        }

        if (requesterId.HasValue)
        {
            sql.AppendLine("INNER JOIN glpi_tickets_users tu_req ON tu_req.tickets_id = t.id AND tu_req.type = 1");
            parameters.Add("RequesterId", requesterId.Value);
        }

        var conditions = new List<string> { "t.is_deleted = 0" };

        if (assigneeId.HasValue)
        {
            conditions.Add("tu.users_id = @AssigneeId");
        }

        if (requesterId.HasValue)
        {
            conditions.Add("tu_req.users_id = @RequesterId");
        }

        if (serviceId.HasValue)
        {
            conditions.Add("""
                (
                    t.itilcategories_id = @ServiceId 
                    OR t.itilcategories_id IN (
                        SELECT id FROM glpi_itilcategories WHERE itilcategories_id = @ServiceId
                    )
                )
                """);
            parameters.Add("ServiceId", serviceId.Value);
        }

        // Date range over the creation date. Bounds are UTC (normalized by the service
        // layer) so they line up with MariaDB's UTC session clock and GLPI's NOW().
        if (startDate.HasValue)
        {
            conditions.Add("t.date >= @StartDate");
            parameters.Add("StartDate", startDate.Value);
        }

        if (endDate.HasValue)
        {
            conditions.Add("t.date <= @EndDate");
            parameters.Add("EndDate", endDate.Value);
        }

        sql.Append("WHERE ").AppendLine(string.Join(" AND ", conditions));

        if (limit.HasValue && offset.HasValue)
        {
            // Priority is deliberately NOT a sort key: it is only a visual indicator.
            // Active work is listed oldest-first (FIFO); resolved/closed tickets are
            // pushed to the end and listed most-recent-first (LIFO). The Kanban re-sorts
            // per column, but this keeps the flat list predictable too.
            sql.AppendLine("ORDER BY (t.status >= 5) ASC, CASE WHEN t.status >= 5 THEN 0 ELSE t.date END ASC, CASE WHEN t.status >= 5 THEN t.date ELSE NULL END DESC");
            sql.AppendLine("LIMIT @Limit OFFSET @Offset;");
            parameters.Add("Limit", limit.Value);
            parameters.Add("Offset", offset.Value);
        }
        else
        {
            sql.AppendLine(";");
        }

        return (sql.ToString(), parameters);
    }

    public Task<Ticket?> GetByIdAsync(int ticketId, CancellationToken cancellationToken) =>
        GetByIdAsync(ticketId, true, cancellationToken);

    public async Task<Ticket?> GetByIdAsync(int ticketId, bool canSeePrivate, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            TicketQueries.DetailFiltered,
            new { TicketId = ticketId, CanSeePrivate = canSeePrivate ? 1 : 0 },
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
        ticket.Solutions = (await reader.ReadAsync<TicketSolution>()).AsList();

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
        return await GetDashboardStatsAsync(null, cancellationToken);
    }

    public async Task<DashboardStats> GetDashboardStatsAsync(DashboardScope? scope, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var query = TicketQueries.BuildDashboardQuery(scope);
        var command = new CommandDefinition(
            query,
            new { ScopeUserId = scope?.UserId ?? 0, ScopeGroupIds = scope?.GroupIds ?? Array.Empty<int>() },
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
            "SELECT COUNT(*) FROM glpi_tickets t INNER JOIN glpi_groups_tickets gt ON t.id = gt.tickets_id WHERE gt.groups_id = @GroupId AND gt.type = 2 AND t.status IN (1, 2) AND t.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM glpi_tickets_users tu WHERE tu.tickets_id = t.id AND tu.type = 2)",
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
        var rawConn = _connectionFactory.CreateConnection();
        if (rawConn is DbConnection dbConn)
        {
            await using (dbConn.ConfigureAwait(false))
            {
                await dbConn.OpenAsync(cancellationToken).ConfigureAwait(false);
                await using var tx = await dbConn.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
                try
                {
                    // 1. UPDATE condicional: solo reclama si status=1 y sin assignee
                    var rowsAffected = await dbConn.ExecuteAsync(new CommandDefinition(
                        TicketQueries.ClaimConditionalUpdate,
                        new { TicketId = ticketId, UpdatedBy = updatedBy },
                        transaction: tx,
                        commandTimeout: _options.CommandTimeoutSeconds,
                        cancellationToken: cancellationToken)).ConfigureAwait(false);

                    if (rowsAffected == 0)
                    {
                        // Ticket ya no está disponible (alguien lo reclamó, o ya no es status 1)
                        await tx.RollbackAsync(cancellationToken).ConfigureAwait(false);
                        return false;
                    }

                    // 2. INSERT de asignación (dentro de la misma transacción)
                    await dbConn.ExecuteAsync(new CommandDefinition(
                        TicketQueries.InsertAssignee,
                        new { TicketId = ticketId, UserId = userId },
                        transaction: tx,
                        commandTimeout: _options.CommandTimeoutSeconds,
                        cancellationToken: cancellationToken)).ConfigureAwait(false);

                    await tx.CommitAsync(cancellationToken).ConfigureAwait(false);
                    return true;
                }
                catch
                {
                    await tx.RollbackAsync(cancellationToken).ConfigureAwait(false);
                    throw;
                }
            }
        }
        else
        {
            using (rawConn)
            {
                rawConn.Open();
                using var tx = rawConn.BeginTransaction();
                try
                {
                    var rowsAffected = await rawConn.ExecuteAsync(new CommandDefinition(
                        TicketQueries.ClaimConditionalUpdate,
                        new { TicketId = ticketId, UpdatedBy = updatedBy },
                        transaction: tx,
                        commandTimeout: _options.CommandTimeoutSeconds,
                        cancellationToken: cancellationToken));

                    if (rowsAffected == 0)
                    {
                        tx.Rollback();
                        return false;
                    }

                    await rawConn.ExecuteAsync(new CommandDefinition(
                        TicketQueries.InsertAssignee,
                        new { TicketId = ticketId, UserId = userId },
                        transaction: tx,
                        commandTimeout: _options.CommandTimeoutSeconds,
                        cancellationToken: cancellationToken));

                    tx.Commit();
                    return true;
                }
                catch
                {
                    tx.Rollback();
                    throw;
                }
            }
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

    public async Task<IReadOnlyList<int>> GetGroupIdsForTicketAsync(int ticketId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            "SELECT groups_id FROM glpi_groups_tickets WHERE tickets_id = @TicketId AND type = 2",
            new { TicketId = ticketId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var result = await connection.QueryAsync<int>(command);
        return result.AsList();
    }

    public async Task<int?> GetAssignmentGroupForCategoryAsync(int categoryId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = """
            SELECT CAST(ra.value AS SIGNED)
            FROM glpi_rules r
            INNER JOIN glpi_rulecriterias rc ON rc.rules_id = r.id
            INNER JOIN glpi_ruleactions ra ON ra.rules_id = r.id
            WHERE r.sub_type = 'RuleTicket'
              AND r.is_active = 1
              AND rc.criteria = 'itilcategories_id'
              AND rc.pattern = @CategoryId
              AND ra.action_type = 'assign'
              AND ra.field = '_groups_id_assign'
            ORDER BY r.ranking ASC
            LIMIT 1;
            """;
        return await connection.ExecuteScalarAsync<int?>(new CommandDefinition(
            sql,
            new { CategoryId = categoryId.ToString() },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken));
    }

    public async Task<bool> IsUserAssignedToTicketAsync(int userId, int ticketId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            @"SELECT COUNT(*) > 0
              FROM glpi_tickets_users
              WHERE tickets_id = @TicketId
                AND users_id = @UserId
                AND type = 2",
            new { TicketId = ticketId, UserId = userId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var result = await connection.QueryFirstOrDefaultAsync<bool>(command);
        return result;
    }

    public async Task<bool> IsUserRequesterOfTicketAsync(int userId, int ticketId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            @"SELECT COUNT(*) > 0
              FROM glpi_tickets_users
              WHERE tickets_id = @TicketId
                AND users_id = @UserId
                AND type = 1",
            new { TicketId = ticketId, UserId = userId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var result = await connection.QueryFirstOrDefaultAsync<bool>(command);
        return result;
    }

    public async Task<bool> HasAssigneeAsync(int ticketId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var command = new CommandDefinition(
            "SELECT COUNT(*) > 0 FROM glpi_tickets_users WHERE tickets_id = @TicketId AND type = 2",
            new { TicketId = ticketId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken);

        var result = await connection.QueryFirstOrDefaultAsync<bool>(command);
        return result;
    }

    public async Task EnsureTicketGroupAssignedAsync(int ticketId, int groupId, CancellationToken cancellationToken)
    {
        if (ticketId <= 0 || groupId <= 0)
        {
            return;
        }

        using var connection = _connectionFactory.CreateConnection();
        const string sql = """
            INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type)
            SELECT @TicketId, @GroupId, 2
            WHERE NOT EXISTS (
                SELECT 1
                FROM glpi_groups_tickets
                WHERE tickets_id = @TicketId
                  AND type = 2
            );
            """;

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { TicketId = ticketId, GroupId = groupId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken));
    }
}
