# ADR-004: Call centre scope

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-004 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


- **Status:** Accepted
- **Date:** 2026-10-13
- **Supersedes:** —
- **Related:** ADR-002 (API ↔ GLPI integration), ADR-003 (ticket create DTO),
  ADR-005 (external requester model), ADR-006 (self-assign and solution required),
  `docs/00-overview/call-center-gap-analysis.md`,
  `docs/00-overview/call-center-questions.md`

## Context

The product is being pointed at a **call centre service desk**. The business has
narrowed the scenario in a way that removes several features a general-purpose
ITSM tool would normally imply:

- **No shifts**, **no N1/N2/N3 escalation tiers** — organisational work happens in
  **flat groups** only.
- **No SLA** yet — the business has not defined targets, so nothing is built.
- **No CTI**, **no email** integration — channels are **manual**: in person, phone,
  chat.
- **No reporting** inside this system — BI reads the database separately. The
  product is **actionable, not analytical**.
- Requesters are **both internal** (existing GLPI users) **and external**
  (non-GLPI callers reached by phone/in person).

The current stack (GLPI 11.0 + our API + frontend) already covers the internal,
single-technician ticket flow (ADR-002/ADR-003). The gap is representing
**external callers** and **group ownership** of tickets. Investigation of the
GLPI 11 data model was carried out against the running test instance
(`glpi-db` / `glpi`). Details and raw evidence:
[`../../00-overview/call-center-gap-analysis.md`](../../00-overview/call-center-gap-analysis.md).

## Decision (scope)

The business has answered the open questions. The scope below is now **decided**
and references the ADR that details each flow.

| Area | Decision |
|---|---|
| Shifts / rosters | **Out of scope.** |
| N1/N2/N3 tiers | **Out of scope.** Use **flat groups** (`glpi_groups`) as the only organisational unit. |
| SLA | **Out of scope** (for now). Revisit explicitly if the business defines targets. |
| Requester — internal | In scope. `glpi_tickets_users.type = 1` with a real `users_id`. Already exposed via the create DTO (`requesterId`). |
| Requester — external | **Decided** → **Option D** (ADR-005): `glpi_tickets_users(type=1, users_id=0, alternative_email)` **plus** caller name/phone/company in a structured `content` block. |
| Entry channels | In scope. Channels are **dynamic**: read `glpi_requesttypes WHERE is_active = 1`. Configuration, not code. |
| Groups | In scope. Groups are **dynamic**: read `glpi_groups`; never hardcode names. `glpi_groups_tickets.type = 2` = *assigned*. |
| Agent view | In scope. The agent sees **only the request list + ticket detail**; no full-history view. |
| Self-assign | In scope (ADR-006). A technician already in the ticket's group/entity can **claim** the ticket. |
| Closure | In scope (ADR-006). Closing (status → 5) **requires a written solution** in `glpi_itilsolutions`. |
| CTI | **Out of scope.** |
| Email (collector/notifications) | **Out of scope.** |
| Reporting | **Out of scope.** BI is external. |

## Decisiones tomadas

Literal answers from the business, with their technical interpretation.

1. **Solicitantes externos: cada uno llega individual por llamada, no hay
   agrupación por llamante recurrente.**
   → There is no recurring-caller model. Each external caller is represented
   **per ticket**; identity travels with the ticket, not with a shared account.
   This rules out a single generic account and points to **Option D** (ADR-005).

2. **Grupos: dinámicos, variarán según lo registrado en `glpi_groups`.**
   → Group lists are read at runtime from `glpi_groups`; group names are never
   hardcoded. A group can be renamed/added/removed without a code change.

3. **Canales: dinámicos, según `glpi_requesttypes` (`is_active=1`).**
   → Entry-channel lists are read at runtime from `glpi_requesttypes` filtered by
   `is_active = 1`; the active set can change without a code change.

4. **Vista del agente: solo ticket de solicitud + detalle. No histórico completo.**
   → The agent UI is limited to the request list and a single-ticket detail view.
   No global/history browsing is built.

5. **Self-assign: el técnico se auto-asigna. Ya pertenece a grupo y entidad.**
   → A technician claims a ticket themselves. The eligibility check is
   "authenticated user ∈ `glpi_groups_users` of the ticket's assigned group
   (same entity)". Detail and endpoint: **ADR-006**.

6. **Cierre: OBLIGATORIO con solución escrita. No se puede cerrar sin solución.**
   → Status transition to *Solved* (5) is rejected unless a solution row exists in
   `glpi_itilsolutions`. Enforced in the service, not only in the frontend.
   Detail and endpoint: **ADR-006**.

### Consequences

Positive:

- Small, honest surface: we only expose what the business confirmed.
- Groups and channels are **data-driven**, so the business can evolve them in the
  GLPI UI without a release.
- Group ownership works natively via `glpi_groups_tickets`; no schema changes.
- External callers are individually identified without creating GLPI accounts.

Negative / accepted:

- No escalation tiers means routing quality depends entirely on group hygiene.
- The caller's name is **not** a structured column (see ADR-005); caller search is
  free-text (`content LIKE`). If recurring callers ever matter, migrate to a real
  account per caller.
- Mandatory solution means an agent cannot close a ticket as a shortcut; this is
  intentional (ADR-006).

### Follow-ups

- External requester mechanism: **decided** → ADR-005.
- Self-assign + mandatory solution: **decided** → ADR-006.
- Rolling business data (groups, channels): no code coupling — configured in the
  GLPI UI.

## Status of this document

**Accepted.** The business answered the blocking questions on 2026-10-13. The
mechanics are detailed in ADR-005 and ADR-006; remaining questions are closed in
[`../../00-overview/call-center-questions.md`](../../00-overview/call-center-questions.md).
