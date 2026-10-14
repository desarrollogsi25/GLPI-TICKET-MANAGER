# ADR-003: Ticket creation DTO — urgency/impact/assigneeId/requesterId (singular)

> ⚠️ **Superseded by ADR-009 (2026-10-14)**

- **Status:** Superseded by ADR-009
- **Date:** 2026-10-13
- **Supersedes:** —
- **Related:** ADR-002 (API ↔ GLPI integration), `docs/02-modules/tickets/overview.md`,
  `src/GlpiTicketManager.Application/Dtos/Tickets/CreateTicketRequest.cs`

## Context

Creating a ticket is a **write**, so it goes through the GLPI REST API
(`POST /apirest.php/Ticket`, see ADR-002). The shape of our request DTO is not free:
GLPI's input schema already dictates much of it.

Relevant facts about the GLPI REST contract (verified against GLPI 11.0):

- GLPI derives a ticket's **priority** from **urgency × impact** using its own
  matrix (`$CFG_GLPI['priority_matrix']`). `priority` is an *output* that GLPI
  computes; posting it directly is redundant and can be overwritten by GLPI's rules.
- To set the assigned technician and the requester, the legacy REST endpoint accepts
  the **singular** pseudo-fields `_users_id_assign` and `_users_id_requester`
  (an int, `0` meaning "unassigned"). This is what GLPI's own front office posts.
- Ticket `type` is `1 = Incident`, `2 = Request`.

We therefore need to decide what the **API's public DTO** looks like: whether it
mirrors GLPI's singular fields, exposes arrays, or lets callers set `priority`
directly.

## Decision

`CreateTicketRequest` exposes:

| API field | Type | GLPI mapping | Notes |
|---|---|---|---|
| `title` | string | `name` | |
| `content` | string? | `content` | |
| `type` | int | `type` | `1` Incident, `2` Request |
| `urgency` | int | `urgency` | `1..6`, default `3` |
| `impact` | int | `impact` | `1..6`, default `3` |
| `categoryId` | int? | `itilcategories_id` | |
| `requesterId` | int? | `_users_id_requester` | **singular** |
| `assigneeId` | int? | `_users_id_assign` | **singular** |

`priority` is **not** an input. It is computed by GLPI from `urgency × impact` and is
surfaced only as a **read-only, calculated field** in responses (ticket detail /
lists). The MCP/DTO contract keeps `urgency` and `impact` singular and the actor ids
singular, matching the GLPI payload one-to-one with no translation table.

## Alternatives considered

### A. Accept `priority` as an input field
- ➕ Some callers intuitively think in terms of "priority".
- ➖ **Rejected.** GLPI owns the urgency × impact → priority matrix. Accepting
  `priority` on input would either (a) be silently ignored/overwritten by GLPI when
  `urgency`/`impact` are present, or (b) require us to reimplement GLPI's matrix and
  keep it in sync with GLPI configuration. Both leak GLPI internals into our API and
  produce surprising, non-idempotent behaviour.
- ➖ It also creates two sources of truth for the same outcome (the couple
  `urgency`/`impact` and the scalar `priority`), which can disagree.

### B. Accept arrays `assigneeIds` / `requesterIds`
- ➕ Would model the ability to assign several technicians or register several
  requesters.
- ➖ **Rejected for now.** GLPI's `_users_id_assign` / `_users_id_requester`
  pseudo-fields are **singular**; truly multi-actor tickets require writing to
  `glpi_tickets_users` with per-actor `type` (1 Requester, 2 Assigned, 3 Observer),
  which the legacy REST surface does not do through these fields. Exposing arrays
  whose second element is silently dropped would be a lie.
- ➖ Multi-actor support, if needed, is a **separate, explicit** operation (its own
  endpoint/use case) rather than a widened field on creation.

### C. Mirror GLPI field names verbatim (`name`, `_users_id_assign`, …)
- ➕ Literal mapping, no translation.
- ➖ **Rejected.** Leaks GLPI's legacy field naming (`_users_id_*`) and its `name`
  (which is really the title) into our public contract, coupling the frontend to
  GLPI's quirks. Our DTO is a deliberate, thin, camelCase facade over that payload.

### D. Chosen: `urgency` + `impact` + singular `assigneeId` / `requesterId`
- ➕ **Accepted.** Honest about GLPI's capabilities, no dropped data, no duplicated
  source of truth for priority.
- ➕ Keeps the API stable if we later add a proper multi-actor endpoint.
- ➖ The frontend can no longer pick a "priority" directly; it must choose urgency
  and impact. This is intended (see Consequences).

## Consequences

**Positive**
- The DTO maps 1:1 onto the GLPI payload with a minimal, documented translation
  (`urgency`/`impact`/`assigneeId`/`requesterId` → `urgency`/`impact`/
  `_users_id_assign`/`_users_id_requester`).
- Priority always reflects GLPI's own matrix; GLPI's configuration stays the single
  source of truth.
- The contract does not promise multi-assignee behaviour it cannot deliver.

**Negative / mitigations**
- **Frontend UX:** the create form must collect **urgency** and **impact**, not a
  single "priority" dropdown. If product wants a friendly label, the UI may present
  presets that map to an `(urgency, impact)` pair, but it must send the pair.
- **Multi-actor tickets** (several assignees / requesters) are out of scope for this
  endpoint. Adding them is a new use case (write `glpi_tickets_users` with explicit
  `type`), not an extension of these singular fields.
- **Validation:** `urgency`/`impact` are validated to `1..6` server-side before the
  GLPI call (`TicketService`), so an out-of-range value fails with `400` rather than
  reaching GLPI.

## Implementation notes

- DTO: `src/GlpiTicketManager.Application/Dtos/Tickets/CreateTicketRequest.cs`.
- Validation + mapping: `src/GlpiTicketManager.Application/Services/TicketService.cs`
  (`CreateAsync`), field mapping in
  `src/GlpiTicketManager.Infrastructure/Glpi/GlpiApiClient.cs`.
- `priority` is returned in read responses as a calculated field; it is never read
  from the create/update request.
