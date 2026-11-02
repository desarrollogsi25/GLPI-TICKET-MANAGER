using System.Data.Common;
using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure.Persistence;

namespace GlpiTicketManager.Infrastructure.Repositories;

/// <summary>
/// INSERT ON CONFLICT is atomic across API replicas using the shared PostgreSQL DB.
/// </summary>
public sealed class TicketPlanningRequestStore : ITicketPlanningRequestStore
{
    private readonly IAppDbConnectionFactory _factory;

    public TicketPlanningRequestStore(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task<PlanningRequestClaim> ClaimAsync(
        Guid requestId, int ticketId, int userId, string payloadHash, CancellationToken cancellationToken)
    {
        await using var connection = (DbConnection)await _factory.CreateAsync(cancellationToken);
        var inserted = await connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO ticket_planning_requests (request_id, ticket_id, user_id, payload_hash)
            VALUES (@RequestId, @TicketId, @UserId, @PayloadHash)
            ON CONFLICT (request_id) DO NOTHING
            """, new { RequestId = requestId, TicketId = ticketId, UserId = userId, PayloadHash = payloadHash },
            cancellationToken: cancellationToken));

        if (inserted == 1) return new PlanningRequestClaim(PlanningRequestState.Started);

        var existing = await connection.QuerySingleAsync<PlanningRecord>(new CommandDefinition(
            """
            SELECT ticket_id AS TicketId, user_id AS UserId,
                   payload_hash AS PayloadHash, task_id AS TaskId
            FROM ticket_planning_requests WHERE request_id = @RequestId
            """, new { RequestId = requestId }, cancellationToken: cancellationToken));

        if (existing.TicketId != ticketId || existing.UserId != userId ||
            !string.Equals(existing.PayloadHash, payloadHash, StringComparison.Ordinal))
        {
            return new PlanningRequestClaim(PlanningRequestState.Mismatched);
        }

        return existing.TaskId is > 0
            ? new PlanningRequestClaim(PlanningRequestState.Completed, existing.TaskId)
            : new PlanningRequestClaim(PlanningRequestState.InProgress);
    }

    public async Task CompleteAsync(Guid requestId, int taskId, CancellationToken cancellationToken)
    {
        await using var connection = (DbConnection)await _factory.CreateAsync(cancellationToken);
        var updated = await connection.ExecuteAsync(new CommandDefinition(
            """
            UPDATE ticket_planning_requests
            SET task_id = @TaskId, completed_at = NOW()
            WHERE request_id = @RequestId AND (task_id IS NULL OR task_id = @TaskId)
            """, new { RequestId = requestId, TaskId = taskId }, cancellationToken: cancellationToken));
        if (updated != 1) throw new InvalidOperationException("Could not persist GLPI task id for planning request.");
    }

    public async Task CancelAsync(Guid requestId, CancellationToken cancellationToken)
    {
        await using var connection = (DbConnection)await _factory.CreateAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM ticket_planning_requests WHERE request_id = @RequestId AND task_id IS NULL",
            new { RequestId = requestId }, cancellationToken: cancellationToken));
    }

    private sealed class PlanningRecord
    {
        public int TicketId { get; set; }
        public int UserId { get; set; }
        public string PayloadHash { get; set; } = string.Empty;
        public int? TaskId { get; set; }
    }
}
