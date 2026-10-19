# Query: tickets assigned to a technician

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-04-DB-QUERY-TICKETS_BY_ASSIGNEE | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


- **Consumer:** `GET /api/tickets?assigneeId={id}`
- **Repository:** `TicketRepository.GetByAssigneeAsync` / `CountByAssigneeAsync`
- **Source:** `Infrastructure/Persistence/Queries/TicketQueries.cs` → `ByAssignee` / `CountByAssignee`
- **Access:** read-only (`SELECT`)

## Clarifying "type = 2"

There are **two different `type` values** in the GLPI schema and they are easy to confuse:

- `glpi_tickets.type` — the *nature* of the ticket: `1` = Incident, `2` = Request.
- `glpi_tickets_users.type` — the *role of a user on the ticket*:
  `1` = Requester, `2` = **Assigned technician**, `3` = Observer.

The requirement "tickets assigned to a technician (type = 2)" refers to
**`glpi_tickets_users.type = 2`**. The assignee relationship is a many-to-many
table (`glpi_tickets_users`), not a column on `glpi_tickets`. Filtering
`glpi_tickets.type = 2` would incorrectly return all *requests* regardless of
who they are assigned to.

## Query

```sql
SELECT
    t.id                AS Id,
    t.name              AS Name,
    t.content           AS Content,
    t.status            AS Status,
    t.type              AS Type,
    t.priority          AS Priority,
    t.urgency           AS Urgency,
    t.impact            AS Impact,
    t.itilcategories_id AS CategoryId,
    t.date              AS CreatedAt,
    t.date_mod          AS UpdatedAt,
    t.solvedate         AS SolvedAt,
    t.closedate         AS ClosedAt,
    t.is_deleted        AS IsDeleted
FROM glpi_tickets t
INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id
WHERE tu.users_id = @AssigneeId
  AND tu.type = 2                 -- 2 = assigned technician
  AND t.is_deleted = 0            -- never expose soft-deleted tickets
ORDER BY t.status ASC, t.priority DESC, t.date DESC
LIMIT @Limit OFFSET @Offset;
```

Total count (for pagination):

```sql
SELECT COUNT(*)
FROM glpi_tickets t
INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id
WHERE tu.users_id = @AssigneeId
  AND tu.type = 2
  AND t.is_deleted = 0;
```

## Parameters

| Name | Type | Notes |
|---|---|---|
| `@AssigneeId` | `int` | `glpi_users.id` of the technician. Required, `> 0`. |
| `@Limit` | `int` | Page size. Default 20, capped at 100 by `TicketService`. |
| `@Offset` | `int` | Rows to skip (`>= 0`). |

## Ordering rationale

`status ASC` groups the kanban columns (New → Assigned → … → Closed);
`priority DESC` surfaces urgent tickets first within a column; `date DESC` breaks
ties with the most recent. The `(users_id, tickets_id, type)` index on
`glpi_tickets_users` and the primary key on `glpi_tickets` keep this cheap.

## Dapper usage

```csharp
var command = new CommandDefinition(
    TicketQueries.ByAssignee,
    new { AssigneeId = assigneeId, Limit = limit, Offset = offset },
    commandTimeout: _options.CommandTimeoutSeconds,
    cancellationToken: cancellationToken);

var rows = await connection.QueryAsync<Ticket>(command);
```

Column aliases match the `Ticket` entity property names exactly, so no custom type
handler is required. User links (assignees/requesters) are hydrated by a follow-up
`WHERE tickets_id IN @TicketIds` query to avoid row multiplication in the main join.

## Indexes to verify on a large instance

```sql
-- should already exist in a stock GLPI install
SHOW INDEX FROM glpi_tickets_users;   -- expect (tickets_id, users_id, type)
SHOW INDEX FROM glpi_tickets;         -- expect PRIMARY(id), index on is_deleted
```

## Follow-ups: the GLPI 9.4 rename trap

The ticket detail endpoint (`GET /api/tickets/{id}`) also reads a ticket's
follow-ups. This is **the most common integration trap** when querying a GLPI
database directly: the table and its foreign key changed in GLPI 9.4 and never
went back.

| GLPI ≤ 9.3 | GLPI ≥ 9.4 (incl. 10 and 11) |
|---|---|
| table `glpi_ticketfollowups` | table `glpi_itilfollowups` |
| FK `tickets_id` | FK `itemtype = 'Ticket'` **and** `items_id` |

Follow-ups became generic ITIL items, shared by tickets, problems and changes, so
the parent is now a polymorphic `(itemtype, items_id)` pair. The column
`tickets_id` **does not exist** in GLPI 11 — a query that still uses it fails with
*table `glpi.glpi_ticketfollowups` doesn't exist*.

Correct query (`TicketQueries.FollowupsByTicket`):

```sql
SELECT
    f.id             AS id,
    f.date           AS createdAt,
    f.content        AS content,
    f.users_id       AS userId,
    f.is_private     AS isPrivate,
    f.sourceitems_id AS sourceItemId
FROM glpi_itilfollowups f
WHERE f.itemtype = 'Ticket'
  AND f.items_id = @TicketId
ORDER BY f.date ASC, f.id ASC;
```

The same polymorphic pattern applies to the other ITIL child tables (for example
`glpi_itilsolutions`): always filter by `itemtype = 'Ticket'` and `items_id`, and
never assume a `tickets_id` column.
