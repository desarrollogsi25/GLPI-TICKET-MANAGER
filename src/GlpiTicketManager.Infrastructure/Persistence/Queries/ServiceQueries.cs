namespace GlpiTicketManager.Infrastructure.Persistence.Queries;

public static class ServiceQueries
{
    public const string GetAll = """
        SELECT 
            id AS Id,
            name AS Name,
            NULLIF(itilcategories_id, 0) AS ParentId,
            completename AS CompleteName,
            level AS Level
        FROM glpi_itilcategories
        ORDER BY completename ASC;
        """;
}
