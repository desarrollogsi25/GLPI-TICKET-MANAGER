namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

/// <summary>
/// SQL para operaciones de usuarios en tickets (claim, etc.).
/// </summary>
public static class TicketUserQueries
{
    /// <summary>
    /// Asigna un usuario técnico a un ticket:
    /// 1. Inserta glpi_tickets_users (type = 2 = assigned)
    /// 2. Cambia el status del ticket a 2 (Assigned)
    /// </summary>
    public const string Claim = """
        INSERT INTO glpi_tickets_users (tickets_id, users_id, type)
        VALUES (@TicketId, @UserId, 2);

        UPDATE glpi_tickets
        SET status = 2,
            users_id_lastupdater = @UpdatedBy
        WHERE id = @TicketId AND status = 1;
        """;
}