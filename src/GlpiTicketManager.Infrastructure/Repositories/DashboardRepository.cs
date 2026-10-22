using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using MySqlConnector;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class DashboardRepository : IDashboardRepository
{
    private readonly IDbConnectionFactory _factory;

    public DashboardRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IReadOnlyList<TeamMemberDto>> GetTeamMembersByGroupAsync(int groupId, CancellationToken ct = default)
    {
        using var conn = _factory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
            await mysqlConn.OpenAsync(ct);
        else
            conn.Open();

        var result = await conn.QueryAsync<TeamMemberDto>(
            new CommandDefinition(
                DashboardQueries.TeamMembersByGroup,
                new { GroupId = groupId },
                cancellationToken: ct));

        return result.ToList();
    }

    public async Task<IReadOnlyList<GroupSummaryDto>> GetAdminGroupSummariesAsync(CancellationToken ct = default)
    {
        using var conn = _factory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
            await mysqlConn.OpenAsync(ct);
        else
            conn.Open();

        var result = await conn.QueryAsync<GroupSummaryDto>(
            new CommandDefinition(
                DashboardQueries.AdminGroupSummaries,
                cancellationToken: ct));

        return result.ToList();
    }

    public async Task<GlpiTicketGroupInfo?> GetTicketGroupAssignmentAsync(int ticketId, CancellationToken ct = default)
    {
        using var conn = _factory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
            await mysqlConn.OpenAsync(ct);
        else
            conn.Open();

        return await conn.QueryFirstOrDefaultAsync<GlpiTicketGroupInfo>(
            new CommandDefinition(
                DashboardQueries.TicketGroupAssignment,
                new { TicketId = ticketId },
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<int>> GetTechnicianUserIdsInGroupAsync(int groupId, CancellationToken ct = default)
    {
        using var conn = _factory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
            await mysqlConn.OpenAsync(ct);
        else
            conn.Open();

        var result = await conn.QueryAsync<int>(
            new CommandDefinition(
                DashboardQueries.TechnicianUserIdsInGroup,
                new { GroupId = groupId },
                cancellationToken: ct));

        return result.ToList();
    }
}
