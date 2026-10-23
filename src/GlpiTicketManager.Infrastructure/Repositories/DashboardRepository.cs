using System.Net;
using System.Text.RegularExpressions;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Dashboard;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using MySqlConnector;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class DashboardRepository : IDashboardRepository
{
    private static readonly Regex HtmlTagRegex = new("<.*?>", RegexOptions.Compiled);
    private readonly IDbConnectionFactory _factory;

    public DashboardRepository(IDbConnectionFactory factory) => _factory = factory;

    private static string? CleanComment(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var decoded = WebUtility.HtmlDecode(raw);
        var stripped = HtmlTagRegex.Replace(decoded, " ");
        var collapsed = Regex.Replace(stripped, @"\s+", " ").Trim();
        return string.IsNullOrWhiteSpace(collapsed) ? null : collapsed;
    }

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

        return result
            .Select(m => m with { LastComment = CleanComment(m.LastComment) })
            .ToList();
    }

    private sealed record GroupTicketTotalsRow(
        long TotalTickets,
        long QueuedTickets,
        long AssignedTickets,
        long InProgressTickets,
        long PendingTickets,
        long ResolvedTickets,
        long ClosedTickets);

    public async Task<GroupDashboardDto> GetGroupDashboardAsync(int groupId, CancellationToken ct = default)
    {
        using var conn = _factory.CreateConnection();
        if (conn is MySqlConnection mysqlConn)
            await mysqlConn.OpenAsync(ct);
        else
            conn.Open();

        var totals = await conn.QueryFirstOrDefaultAsync<GroupTicketTotalsRow>(
            new CommandDefinition(
                DashboardQueries.GroupTicketTotals,
                new { GroupId = groupId },
                cancellationToken: ct));

        var technicians = await conn.QueryAsync<TeamMemberDto>(
            new CommandDefinition(
                DashboardQueries.TeamMembersByGroup,
                new { GroupId = groupId },
                cancellationToken: ct));

        var total = totals?.TotalTickets ?? 0;
        var queued = totals?.QueuedTickets ?? 0;
        var assigned = totals?.AssignedTickets ?? 0;
        var inProgress = totals?.InProgressTickets ?? 0;
        var pending = totals?.PendingTickets ?? 0;
        var resolved = totals?.ResolvedTickets ?? 0;
        var closed = totals?.ClosedTickets ?? 0;

        var summary = new GroupDashboardSummaryDto(
            total,
            queued,
            assigned,
            inProgress,
            pending,
            resolved,
            closed);

        return new GroupDashboardDto(
            total,
            queued,
            assigned,
            inProgress,
            pending,
            resolved,
            closed,
            technicians.Select(m => m with { LastComment = CleanComment(m.LastComment) }).ToList(),
            summary);
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
