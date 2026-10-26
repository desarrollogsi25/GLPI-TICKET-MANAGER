# ADR-006: Self-assign and mandatory solution to close

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-006 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


- **Status:** Accepted (partially amended by ADR-020)
- **Date:** 2026-10-13
- **Supersedes:** —
- **Amended by:** [ADR-020 — Resolución atómica de ticket](ADR-020-resolucion-atomic-de-ticket.md) (2026-10-21)
- **Related:** ADR-002 (API ↔ GLPI integration), ADR-004 (call centre scope),
  ADR-005 (external requester model)

> [!IMPORTANT]
> **Enmienda ADR-020 (2026-10-21).** La premisa de la *Decision 2* —«**Does not change
> the ticket status by itself**»— es **empíricamente falsa en GLPI 11**: la creación de
> una `ITILSolution` deja el ticket en `Resuelto (5)` por su cuenta. En consecuencia:
>
> - El endpoint de cierre pasa a ser **`POST /api/tickets/{id}/resolve`** (una sola
>   llamada atómica: escribe la solución, relee el estado, cierra a `6` y emite un único
>   evento SignalR). Los endpoints `POST /solutions` y `PATCH /status` se **mantienen**
>   por compatibilidad.
> - El guard de cierre (`422` si no hay solución) deja de exigir una longitud mínima:
>   el contrato válido es **«contenido no vacío»**. Ver
>   [BUG-031](../../11-incidents/BUG-031-resolucion-ticket-solucion-corta.md).
> - El conflicto «el ticket ya está resuelto» se devuelve como `409 Conflict` en lugar
>   del `400` opaco de GLPI.

## Context

Two operational rules come directly from the business (answers 5 and 6 of
ADR-004):

5. **Self-assign** — the technician claims the ticket themselves; they already
   belong to a group and an entity. There is no automatic queue dispatcher.
6. **Mandatory solution** — closing a ticket **requires a written solution**; a
   ticket cannot be closed without one.

Both are *write* flows, so they go through our API (ADR-002: writes via the GLPI
REST API / services, reads via Dapper). This ADR fixes the contract and the
enforcement point. **No code here** — this is the decision record.

Verified schema facts (GLPI 11.0 test instance):

- `glpi_groups_users`: `id`, `users_id`, `groups_id`, `is_dynamic`, `is_manager`,
  `is_userdelegate` — membership of a user in a group.
- `glpi_groups_tickets`: `tickets_id`, `groups_id`, `type` (2 = *assigned*).
- `glpi_tickets_users`: `tickets_id`, `users_id`, `type` (2 = *assigned*),
  `alternative_email`.
- `glpi_itilsolutions`: `id`, `itemtype`, `items_id`, `solutiontypes_id`,
  `content`, `date_creation`, `date_mod`, `users_id`, `status`, … The task's
  `date` maps to the real columns **`date_creation`** / **`date_mod`**.
- Today `glpi_itilsolutions` has **0 rows** — the rule is not yet exercised.

## Decision 1 — Self-assign (`claim`)

**Endpoint:** `POST /api/tickets/{id}/claim`

**Preconditions (all validated server-side):**

1. The caller is authenticated.
2. The authenticated user **belongs to the ticket's assigned group** — i.e. a row
   exists in `glpi_groups_users` linking the user to the group stored in
   `glpi_groups_tickets` (`type = 2`) for this ticket. Same entity.
3. The ticket is in **status = 1 (New)** and has **no assignee yet**.

**Effect (single write flow):**

- Insert a `glpi_tickets_users` row with `type = 2` (*assigned*) and the
  authenticated user's `users_id`.
- Change the ticket **status 1 → 2** (*Assigned*).
- Return the **updated ticket**.

**Rejection:** any precondition failure → `409 Conflict` (or `403` for the
membership check). No partial write.

## Decision 2 — Mandatory solution to close

**Endpoint:** `POST /api/tickets/{id}/solutions`

- Inserts one row into `glpi_itilsolutions`:
  `itemtype = 'Ticket'`, `items_id = {id}`, `content = <text>`,
  `users_id = <authenticated user>`, `date_creation = NOW()` (and `date_mod`).
- **In GLPI 11 this moves the ticket to Solved (5) automatically.** The API must
  account for that side effect (see [ADR-020](ADR-020-resolucion-atomic-de-ticket.md));
  writing a solution and closing are no longer independent.

**Closing guard:**

- `PATCH /api/tickets/{id}/status` with `{ "status": 5 }` (Solved) is
  **rejected with `422 Unprocessable Entity`** unless **at least one**
  `glpi_itilsolutions` row exists for that ticket
  (`itemtype = 'Ticket' AND items_id = {id}`) with **non-empty content**
  (`TRIM(content) <> ''`). Solutions obsolete (`status = 4`) do **not** satisfy
  the guard. The minimum length requirement was removed by
  [BUG-031](../../11-incidents/BUG-031-resolucion-ticket-solucion-corta.md)
  (the valid contract is «non-empty»).
- The guard lives in the **service layer**, not only in the frontend: the API
  refuses the transition regardless of client. The frontend may also hide/disable
  the action, but that is a convenience, not the enforcement.
- **Preferred flow:** use `POST /api/tickets/{id}/resolve` (atomic). It handles
  GLPI's auto-solve, auto-closes to `6`, emits one SignalR event and translates
  GLPI errors into the API's error contract.

## Alternatives rejected

- **Automatic assignment via GLPI business rules.** Rejected: the business wants
  **human control** — the technician chooses to claim the ticket. A rules engine
  would assign work without the agent's decision.
- **Closing with a follow-up (ITIL followup) instead of a solution.** Rejected:
  the business requires a **formal solution** (`glpi_itilsolutions`), not a
  comment, as the closing artefact.

## Consequences

Positive:

- Claiming is bounded: only a group member can take the ticket, and only while it
  is New and unassigned — no races overwriting an existing assignee.
- The mandatory-solution rule is enforced where it is authoritative (the API), so
  no client can bypass it.
- A solution is a first-class GLPI record, visible in GLPI and in our UI.

Negative / accepted:

- The agent cannot close a ticket without writing a solution; solving becomes a
  deliberate step (intended).
- `claim` requires a group-role read (`glpi_groups_users` +
  `glpi_groups_tickets`) before the write; slightly more work per claim.
- The 422 policy must be kept in sync with the solution-existence query if the
  schema ever changes.

## Out of scope

- Re-assignment **between** groups (who authorises it) — not part of this ADR.
- Solution approval workflow (`status`/`date_approval` on `glpi_itilsolutions`) —
  not required by the business today.
