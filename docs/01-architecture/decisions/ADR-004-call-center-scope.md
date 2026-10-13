# ADR-004: Call centre scope — reduced scope and open decisions

- **Status:** Proposed (draft — awaiting business answers)
- **Date:** 2026-10-13
- **Supersedes:** —
- **Related:** ADR-002 (API ↔ GLPI integration), ADR-003 (ticket create DTO),
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

## Decision (reduced scope)

Adopt the following scope now. Items marked *Pendiente* are **not** decided and
must not be built until the business answers.

| Area | Decision |
|---|---|
| Shifts / rosters | **Out of scope.** |
| N1/N2/N3 tiers | **Out of scope.** Use **flat groups** (`glpi_groups`) as the only organisational unit. |
| SLA | **Pendiente.** Do not build until the business defines targets. |
| Requester — internal | In scope. `glpi_tickets_users.type = 1` with a real `users_id`. Already exposed via the create DTO (`requesterId`). |
| Requester — external | **Pendiente** (mechanism TBD). Two verified mechanisms exist (see below); the business must choose. |
| Entry channels | In scope. Map to `glpi_requesttypes` and let the agent pick (`Phone`, `Direct`, etc.). Configuration, not code. |
| Group assignment | In scope. `glpi_groups_tickets.type = 2` = *assigned*. Our API should be able to read/filter by group. |
| CTI | **Out of scope.** |
| Email (collector/notifications) | **Out of scope.** |
| Reporting | **Out of scope.** BI is external. |

### External requester — mechanism left open

Two GLPI-native mechanisms were inserted and observed live. **This ADR does not
choose between them.**

- **Option B — `alternative_email`.** `glpi_tickets_users(type=1, users_id=0,
  alternative_email='…')`. Structured and filterable; renders and lists
  correctly. **Requires an email**, which a phone call may not collect.
- **Option C — generic user + data in `content`.** A placeholder GLPI user
  (`external-caller`) is the requester; the real caller's name/phone/company go
  into the ticket description. Anonymous-friendly; but every external caller
  collapses onto one account, so callers cannot be segmented or de-duplicated.

The choice depends on how the caller is identified (a question for the
business, not engineering). See
[`call-center-questions.md`](../../00-overview/call-center-questions.md) §1.

### Consequences

Positive:

- Small, honest surface: we only expose what the business confirmed.
- Group ownership works natively via `glpi_groups_tickets`; no schema changes.
- Channels need configuration in the GLPI UI, not code.

Negative / accepted:

- No escalation tiers means routing quality depends entirely on group hygiene.
- `alternative_email` carries **no phone or company field**; if Option C is
  chosen, caller search is free-text only.
- Deferring SLA keeps the system simple but must be revisited explicitly.

### Open decisions (blocking)

- External requester mechanism (B vs C vs both) — **Pendiente**.
- Whether a ticket can be assigned to a group **and** a technician, or group only.
- Who may re-assign across groups, and whether authorisation is required.
- Final list of entry channels exposed in the form.
- The definitive list of business groups (none exist yet: `glpi_groups` = 0 rows).

These are tracked as questions, not as tasks, until answered:
[`../../00-overview/call-center-questions.md`](../../00-overview/call-center-questions.md).

## Status of this document

**Draft.** It records the reduced scope and the open points. It must not be
promoted to *Accepted* until the business answers the blocking questions above.
