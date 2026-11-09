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
    private const int ScheduleLockNamespace = 0x474C5049; // "GLPI", scoped per technician
    private const int ClaimLockNamespace = 0x434C414D;    // "CLAM", scoped per ticket
    private readonly IAppDbConnectionFactory _factory;

    public TicketPlanningRequestStore(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task<IAsyncDisposable> AcquireTechnicianScheduleLockAsync(
        int technicianId, CancellationToken cancellationToken)
    {
        if (technicianId <= 0) throw new ArgumentOutOfRangeException(nameof(technicianId));
        var connection = (DbConnection)await _factory.CreateAsync(cancellationToken);
        try
        {
            // Session-level lock spans the MariaDB availability read and GLPI REST
            // write; it works across API replicas sharing this PostgreSQL server.
            await connection.ExecuteAsync(new CommandDefinition(
                "SELECT pg_advisory_lock(@Namespace, @TechnicianId)",
                new { Namespace = ScheduleLockNamespace, TechnicianId = technicianId },
                cancellationToken: cancellationToken));
            return new TechnicianScheduleLock(connection, technicianId);
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }
    }

    public async Task<IAsyncDisposable> AcquireTicketClaimLockAsync(
        int ticketId, CancellationToken cancellationToken)
    {
        if (ticketId <= 0) throw new ArgumentOutOfRangeException(nameof(ticketId));
        var connection = (DbConnection)await _factory.CreateAsync(cancellationToken);
        try
        {
            // Session-level lock spans the claim status verification and GLPI REST
            // write; it works across API replicas sharing this PostgreSQL server.
            await connection.ExecuteAsync(new CommandDefinition(
                "SELECT pg_advisory_lock(@Namespace, @TicketId)",
                new { Namespace = ClaimLockNamespace, TicketId = ticketId },
                cancellationToken: cancellationToken));
            return new TicketClaimLock(connection, ticketId);
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }
    }

    private sealed class TicketClaimLock : IAsyncDisposable
    {
        private readonly DbConnection _connection;
        private readonly int _ticketId;

        public TicketClaimLock(DbConnection connection, int ticketId)
        {
            _connection = connection;
            _ticketId = ticketId;
        }

        public async ValueTask DisposeAsync()
        {
            try
            {
                await _connection.ExecuteAsync(new CommandDefinition(
                    "SELECT pg_advisory_unlock(@Namespace, @TicketId)",
                    new { Namespace = ClaimLockNamespace, TicketId = _ticketId }));
            }
            finally
            {
                await _connection.DisposeAsync();
            }
        }
    }

    private sealed class TechnicianScheduleLock : IAsyncDisposable
    {
        private readonly DbConnection _connection;
        private readonly int _technicianId;

        public TechnicianScheduleLock(DbConnection connection, int technicianId)
        {
            _connection = connection;
            _technicianId = technicianId;
        }

        public async ValueTask DisposeAsync()
        {
            try
            {
                await _connection.ExecuteAsync(new CommandDefinition(
                    "SELECT pg_advisory_unlock(@Namespace, @TechnicianId)",
                    new { Namespace = ScheduleLockNamespace, TechnicianId = _technicianId }));
            }
            finally
            {
                await _connection.DisposeAsync();
            }
        }
    }

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
