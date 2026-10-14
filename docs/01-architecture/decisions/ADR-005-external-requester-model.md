# ADR-005: External requester model

> ⚠️ **Superseded by ADR-010 (2026-10-14)**

- **Status:** Superseded by ADR-010
- **Date:** 2026-10-13
- **Supersedes:** —
- **Related:** ADR-002 (API ↔ GLPI integration), ADR-004 (call centre scope),
  ADR-006 (self-assign and solution required),
  `docs/00-overview/call-center-gap-analysis.md`

## Context

The call centre handles two kinds of requester:

- **Internal** — a real GLPI user (has an account in `glpi_users`). Represented by
  `glpi_tickets_users(type = 1, users_id = <real id>)`. Already covered by the
  create DTO (`requesterId`, ADR-003).
- **External** — a caller who is **not** a GLPI user (reached by phone or in
  person). There is no account, and often no email.

The business confirmed (answer 1 of ADR-004) that **there is no recurring-caller
grouping**: each external caller arrives individually, per call. So we do **not**
need a stable identity that spans tickets; we need to (a) not require an account
per caller and (b) not lose the caller's name and phone.

GLPI 11 offers three native ways to attach an external requester, all verified
live against the test instance:

| # | Mechanism | Renders in UI | Structured? | Keeps name/phone? |
|---|---|---|---|---|
| A | Create a GLPI user per external caller | yes | yes | yes (if filled) |
| B | `alternative_email` only (`users_id=0`) | yes | yes (email) | **no** |
| C | One generic user (`external-caller`) | yes | no | **no** (everyone identical) |

## Decision

Adopt **Option D**: **`glpi_tickets_users(type = 1, users_id = 0,
alternative_email)` combined with a structured caller block in the ticket
`content`.**

- The ticket's requester actor is written with **`users_id = 0`** and the caller's
  email in **`alternative_email`** (when an email is available; otherwise the
  column is left empty). This is the GLPI-native "external email" actor and it
  renders and lists correctly.
- Because `alternative_email` cannot carry a name or phone, the **caller identity
  is written into `content`** using a fixed, parseable header line, followed by
  the actual problem description.

### `content` format (normative)

```
Llamante: <nombre> · Tel: <teléfono> · Empresa: <empresa opcional>

<descripción del problema>
```

- The header line is always the **first line**.
- Fields are separated by ` · ` (space, U+00B7 middle dot, space).
- `Empresa` is optional; when absent the header ends after `Tel`.
- The blank line separates header from description.

Example:

```
Llamante: Juan Pérez · Tel: +34 600 111 222 · Empresa: ACME

No puede entrar al ERP desde la VPN; le da error de credenciales.
```

## Alternatives rejected

- **A — a GLPI account per external caller.**
  Rejected: operational overhead (create/maintain an account for every caller)
  with no payoff, because the business confirmed there is **no aggregatable
  recurrence**. We would be modelling an identity we do not need.
- **B — `alternative_email` only.**
  Rejected: loses the caller's **name and phone**, which the agent must record for
  a phone call. An email is frequently unavailable at call time.
- **C — single generic user (`external-caller`) only.**
  Rejected: every external caller is displayed identically, so the ticket loses
  the caller's identity and agents cannot tell two external tickets apart.

Option D keeps B's structured, renderable actor while recovering the identity
(name/phone) that B and C drop.

## Consequences

Positive:

- No account per caller; the agent records name/phone directly on the ticket.
- The actor is GLPI-native (`users_id = 0` + `alternative_email`), so the ticket
  renders and lists correctly in GLPI and is queryable by email when present.
- Matches the confirmed business reality (per-call, non-recurring callers).

Negative / accepted:

- **The caller's name is not a structured column.** It lives in `content`, so
  searching by caller is free-text: `WHERE content LIKE '%<nombre>%'` (or by the
  header prefix `content LIKE 'Llamante:%'` to find external-requester tickets).
- If an email is not captured, only the free-text name identifies the caller.
- **Migration trigger:** if the business ever needs recurring callers
  (cross-ticket identity, per-caller history), migrate to **Option A** (a real
  account per caller). The `content` header can be parsed to backfill names.

## Implementation notes (no code in this ADR)

- The create flow writes one `glpi_tickets_users` row with `type = 1`,
  `users_id = 0`, `alternative_email` = caller email (or empty).
- The header format above is the contract; parsing is a simple split on the
  separators. Do not reorder the fields.
