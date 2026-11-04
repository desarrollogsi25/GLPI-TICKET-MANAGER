using Dapper;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Infrastructure.Persistence;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using Microsoft.Extensions.Options;

namespace GlpiTicketManager.Infrastructure.Repositories;

/// <summary>
/// Dapper implementation of the ticket-task read side.
/// </summary>
public sealed class TicketTaskRepository : ITicketTaskRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly DatabaseOptions _options;

    public TicketTaskRepository(IDbConnectionFactory connectionFactory, IOptions<DatabaseOptions> options)
    {
        _connectionFactory = connectionFactory;
        _options = options.Value;
    }

    public async Task<IReadOnlyList<TicketTask>> GetByTicketAsync(
        int ticketId,
        CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var rows = await connection.QueryAsync<TicketTask>(new CommandDefinition(
            TicketTaskQueries.ByTicket,
            new { TicketId = ticketId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken));

        return rows.AsList();
    }

    public async Task<TicketTask?> GetByIdAsync(int taskId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        return await connection.QuerySingleOrDefaultAsync<TicketTask>(new CommandDefinition(
            TicketTaskQueries.ById,
            new { TaskId = taskId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken));
    }

    public async Task<TicketTask?> GetByUuidAsync(
        int ticketId,
        string uuid,
        CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        return await connection.QuerySingleOrDefaultAsync<TicketTask>(new CommandDefinition(
            TicketTaskQueries.ByUuid,
            new { TicketId = ticketId, Uuid = uuid },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<TicketTask>> GetConflictsAsync(
        int technicianId,
        DateTime beginUtc,
        DateTime endUtc,
        int? excludeTaskId,
        CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        var rows = await connection.QueryAsync<TicketTask>(new CommandDefinition(
            TicketTaskQueries.Conflicts,
            new
            {
                TechnicianId = technicianId,
                BeginUtc = beginUtc,
                EndUtc = endUtc,
                ExcludeTaskId = excludeTaskId
            },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken));

        return rows.AsList();
    }

    public async Task<TicketTask?> GetNextPlannedAsync(int ticketId, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.CreateConnection();

        return await connection.QuerySingleOrDefaultAsync<TicketTask>(new CommandDefinition(
            TicketTaskQueries.NextPlanned,
            new { TicketId = ticketId },
            commandTimeout: _options.CommandTimeoutSeconds,
            cancellationToken: cancellationToken));
    }
}
