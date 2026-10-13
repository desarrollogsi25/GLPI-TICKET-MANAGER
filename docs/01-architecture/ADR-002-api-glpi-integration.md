# ADR-002: API ↔ GLPI integration strategy (hybrid)

- **Status:** Accepted
- **Date:** 2026-10-13
- **Supersedes:** —
- **Related:** ADR-001 (GLPI Docker setup), `docs/02-modules/tickets/overview.md`, `docs/04-database/queries/tickets-by-assignee.md`

## Context

We need a backend that lets a custom React frontend manage GLPI 11 tickets: list the
tickets assigned to a technician, show full ticket detail, expose dashboard metrics,
and create tickets or change their status.

GLPI is a mature ITSM product. It already owns the ticket schema, the workflow
(assignment, status transitions, SLA), notifications, the audit log and the plugin
ecosystem. Two integration styles are available:

1. **Direct database access** to the `glpi_*` tables.
2. **GLPI REST API** (`/apirest.php`), which wraps GLPI's `CommonDBTM` business logic.

Both are legitimate; each is good at something different.

## Decision

Use a **hybrid** approach:

- **Reads → MariaDB through Dapper.**
  Listing tickets by assignee, ticket detail and dashboard aggregates are read
  directly from the database. These are high-volume, latency-sensitive, and
  read-only operations. A single indexed `JOIN` beats an N+1 sequence of REST
  calls, and Dapper keeps the mapping explicit and fast.

- **Writes → GLPI REST API through a typed `HttpClient`.**
  Creating tickets and changing status go through GLPI. Writes must trigger GLPI's
  own rules: notification emails, `glpi_logs` entries, SLA/OLA timers, automatic
  status transitions, plugin hooks and entity/permission checks. Bypassing GLPI with
  direct `INSERT`/`UPDATE` would desynchronise all of that.

- **Authentication → our own JWT.**
  The API authenticates frontend users and mints its **own** JWT. It never returns a
  GLPI `session_token` to the browser. The API's JWT is the only credential the
  frontend ever handles.

### Direction of each flow

| Operation | Source of truth | Mechanism |
|---|---|---|
| List tickets by assignee | MariaDB | Dapper (`glpi_tickets` ⨝ `glpi_tickets_users`) |
| Ticket detail + follow-ups | MariaDB | Dapper |
| Dashboard stats | MariaDB | Dapper (aggregates) |
| Create ticket | GLPI | REST `POST /Ticket` |
| Change status | GLPI | REST `PUT /Ticket/{id}` |
| Login | GLPI users table | Dapper + BCrypt → API JWT |

## Alternatives considered

### A. All reads through the GLPI REST API
- ➖ Every list triggers several HTTP round-trips (ticket, then follow-ups, then users).
- ➖ Aggregations (dashboard) are not exposed by the API and would require paging the
  whole ticket set.
- ➖ Couples read availability and latency to the GLPI HTTP endpoint.
- ➕ No knowledge of the schema required.
- **Rejected** for reads: too chatty and cannot express our aggregates.

### B. All access direct to the database (reads *and* writes)
- ➕ Simplest and fastest data path.
- ➖ Silently breaks GLPI: no notifications, no audit trail, no SLA timers, no plugin
  hooks, no permission/entity enforcement. Ticket state can drift out of sync with
  GLPI's own rules.
- ➖ We would have to reimplement GLPI workflow logic — and keep reimplementing it.
- **Rejected** for writes: correctness and maintainability risk.

### C. Hybrid (chosen)
- ➕ Fast, expressive reads; correct, rule-aware writes.
- ➕ Clear seam: repositories own reads, `IGlpiApiClient` owns writes.
- ➖ Two integration paths to understand, and a short propagation delay before a
  freshly written change is visible in a read.
- **Accepted.**

## Consequences

**Positive**
- The frontend's hot paths (lists, detail, dashboard) are a single indexed query each.
- All mutations go through GLPI, so notifications, logs, SLAs and plugins keep working.
- The read side can point at a read-only database account.
- The browser never sees a GLPI token, reducing the blast radius of a frontend leak.

**Negative / mitigations**
- **Read-after-write delay:** a ticket created via the API may not appear immediately
  in a list if a replica lag existed. Mitigated by reading from the primary; GLPI
  writes complete synchronously before the API returns `201`.
- **Schema coupling:** the read queries depend on GLPI's schema. Mitigated by keeping
  every query in `Persistence/Queries/*` as a single, documented, version-pinned
  location (`GlpiTicketManager.Infrastructure/Persistence/Queries/TicketQueries.cs`).
- **Two failure domains:** MariaDB must be up for reads, GLPI for writes. The API
  fails independently per direction and surfaces `502` for GLPI errors.

## Implementation notes

- `IGlpiApiClient` opens a short-lived GLPI session per write (`initSession` →
  operation → `killSession`), so no GLPI session token is cached or leaked. See
  `Infrastructure/Glpi/GlpiApiClient.cs`.
- Read queries live in `Infrastructure/Persistence/Queries/`; repositories in
  `Infrastructure/Repositories/`. Both are Dapper-based.
- Status codes: `glpi_tickets.status` (1 New … 6 Closed) and
  `glpi_tickets_users.type` (1 Requester, 2 Assigned, 3 Observer) are mapped by the
  enums in `Domain/Enums/`.
- Business errors are translated to ProblemDetails: validation → `400`,
  missing GLPI resource → `404`, GLPI failure → `502`.
