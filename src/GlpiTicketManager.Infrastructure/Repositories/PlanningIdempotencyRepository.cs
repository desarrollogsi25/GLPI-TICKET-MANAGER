using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure.Persistence;

namespace GlpiTicketManager.Infrastructure.Repositories;

/// <summary>PostgreSQL-backed operation ledger shared by every API instance.</summary>
public sealed class PlanningIdempotencyRepository : IPlanningIdempotencyRepository
{
    private const string InsertReservation = """
        INSERT INTO ticket_planning_idempotency
            (idempotency_key, ticket_id, payload_sha256, state, lease_expires_at)
        VALUES
            (@Key, @TicketId, @PayloadSha256, 'pending', NOW() + INTERVAL '5 minutes')
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING 1;
        """;

    private const string ReacquireExpiredReservation = """
        UPDATE ticket_planning_idempotency
        SET lease_expires_at = NOW() + INTERVAL '5 minutes', updated_at = NOW()
        WHERE idempotency_key = @Key
          AND ticket_id = @TicketId
          AND payload_sha256 = @PayloadSha256
          AND state = 'pending'
          AND lease_expires_at <= NOW()
        RETURNING 1;
        """;

    private const string ReadReservation = """
        SELECT ticket_id AS TicketId,
               payload_sha256 AS PayloadSha256,
               state AS State,
               glpi_task_id AS GlpiTaskId
        FROM ticket_planning_idempotency
        WHERE idempotency_key = @Key;
        """;

    private const string CompleteReservation = """
        UPDATE ticket_planning_idempotency
        SET state = 'completed', glpi_task_id = @GlpiTaskId,
            lease_expires_at = NULL, updated_at = NOW()
        WHERE idempotency_key = @Key
          AND ticket_id = @TicketId
          AND payload_sha256 = @PayloadSha256
          AND state = 'pending';
        """;

    private const string ReleaseReservation = """
        DELETE FROM ticket_planning_idempotency
        WHERE idempotency_key = @Key
          AND ticket_id = @TicketId
          AND payload_sha256 = @PayloadSha256
          AND state = 'pending';
        """;

    private readonly IAppDbConnectionFactory _factory;

    public PlanningIdempotencyRepository(IAppDbConnectionFactory factory) => _factory = factory;

    public async Task<PlanningReservation> AcquireAsync(
        string idempotencyKey,
        int ticketId,
        string payloadSha256,
        CancellationToken cancellationToken)
    {
        using var connection = await _factory.CreateAsync(cancellationToken);

        var inserted = await connection.QuerySingleOrDefaultAsync<int?>(new CommandDefinition(
            InsertReservation,
            new { Key = idempotencyKey, TicketId = ticketId, PayloadSha256 = payloadSha256 },
            cancellationToken: cancellationToken));
        if (inserted.HasValue)
        {
            return new PlanningReservation(PlanningReservationDisposition.Acquired, ticketId, payloadSha256, null);
        }

        var reclaimed = await connection.QuerySingleOrDefaultAsync<int?>(new CommandDefinition(
            ReacquireExpiredReservation,
            new { Key = idempotencyKey, TicketId = ticketId, PayloadSha256 = payloadSha256 },
            cancellationToken: cancellationToken));
        if (reclaimed.HasValue)
        {
            return new PlanningReservation(PlanningReservationDisposition.Acquired, ticketId, payloadSha256, null);
        }

        var existing = await connection.QuerySingleOrDefaultAsync<ReservationRow>(new CommandDefinition(
            ReadReservation,
            new { Key = idempotencyKey },
            cancellationToken: cancellationToken));
        if (existing is null || existing.TicketId != ticketId
            || !string.Equals(existing.PayloadSha256, payloadSha256, StringComparison.OrdinalIgnoreCase))
        {
            return new PlanningReservation(PlanningReservationDisposition.PayloadConflict, ticketId, payloadSha256, null);
        }

        return string.Equals(existing.State, "completed", StringComparison.Ordinal)
            ? new PlanningReservation(PlanningReservationDisposition.Completed, ticketId, payloadSha256, existing.GlpiTaskId)
            : new PlanningReservation(PlanningReservationDisposition.InProgress, ticketId, payloadSha256, existing.GlpiTaskId);
    }

    public async Task CompleteAsync(
        string idempotencyKey,
        int ticketId,
        string payloadSha256,
        int glpiTaskId,
        CancellationToken cancellationToken)
    {
        using var connection = await _factory.CreateAsync(cancellationToken);
        var affected = await connection.ExecuteAsync(new CommandDefinition(
            CompleteReservation,
            new { Key = idempotencyKey, TicketId = ticketId, PayloadSha256 = payloadSha256, GlpiTaskId = glpiTaskId },
            cancellationToken: cancellationToken));
        if (affected > 0)
        {
            return;
        }

        var current = await connection.QuerySingleOrDefaultAsync<int?>(new CommandDefinition(
            "SELECT glpi_task_id FROM ticket_planning_idempotency WHERE idempotency_key = @Key AND ticket_id = @TicketId AND payload_sha256 = @PayloadSha256 AND state = 'completed';",
            new { Key = idempotencyKey, TicketId = ticketId, PayloadSha256 = payloadSha256 },
            cancellationToken: cancellationToken));
        if (current != glpiTaskId)
        {
            throw new InvalidOperationException("The planning operation reservation could not be completed consistently.");
        }
    }

    public async Task ReleaseAsync(
        string idempotencyKey,
        int ticketId,
        string payloadSha256,
        CancellationToken cancellationToken)
    {
        using var connection = await _factory.CreateAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            ReleaseReservation,
            new { Key = idempotencyKey, TicketId = ticketId, PayloadSha256 = payloadSha256 },
            cancellationToken: cancellationToken));
    }

    private sealed record ReservationRow(int TicketId, string PayloadSha256, string State, int? GlpiTaskId);
}
