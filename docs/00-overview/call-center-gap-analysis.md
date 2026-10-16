# Call Centre Gap Analysis

ISO Header: Business Scope

**Status:** Decided — business answers received 2026-10-13. Mechanics recorded in
[ADR-004](../01-architecture/decisions/ADR-004-call-center-scope.md) (scope),
[ADR-005](../01-architecture/decisions/ADR-005-external-requester-model.md)
(external requesters) and
[ADR-006](../01-architecture/decisions/ADR-006-self-assign-and-solution-required.md)
(self-assign + mandatory solution).

Scope: a **call centre service desk**. No shifts, no N1/N2/N3 tiers (flat groups only),
SLAs not yet defined, internal (GLPI users) **and** external (non-GLPI callers)
requesters, no CTI, no email, manual entry channels only (in person, phone, chat), no
reporting (BI is external). The product is **actionable, not analytical**.

Every statement below was verified against the running GLPI 11.0 test instance
(`glpi-db` / `glpi` containers) via SQL and the GLPI web UI.

## Business answers → action

Action ∈ {**Exponer**, **Configurar en GLPI UI**, **Construir**, **Fuera de alcance**, **Decidido**}.

| Topic | Business answer | GLPI capability today | Action | Evidence |
|---|---|---|---|---|
| Shifts / rosters | Out of scope | GLPI has no shift model; only groups | **Fuera de alcance** | — |
| N1 / N2 / N3 tiers | Out of scope — flat groups only | `glpi_groups` is flat (nesting exists but unused) | **Fuera de alcance** (keep groups flat) | PASO 2: `glpi_groups` = 0 rows |
| SLA | Out of scope (not defined) | GLPI SLA engine exists but is unconfigured | **Fuera de alcance** (revisit if defined) | Do not build now |
| Requesters — internal | GLPI users | `glpi_tickets_users.type = 1` with `users_id` | **Exponer** (create DTO already has `requesterId`) | PASO 3-A → ticket #9 |
| Requesters — external | Per call, **no** recurring caller | (A) account/caller, (B) `alternative_email`, (C) generic user | **Decidido** → **Option D** (ADR-005): `alternative_email` + caller name/phone in structured `content` | PASO 3-B/#10, 3-C/#11 |
| Entry channels (in person / phone / chat) | Dynamic, per `glpi_requesttypes` (`is_active=1`) | `glpi_requesttypes` has 6 rows | **Decidido** — read dynamically at runtime; **Configurar en GLPI UI** | PASO 2 |
| Groups | Dynamic, per `glpi_groups` | `glpi_groups` (flat) | **Decidido** — read dynamically at runtime; never hardcode names | PASO 2 |
| Agent view | Only request list + detail, **no** full history | Ticket list + ticket detail | **Exponer** (list + detail; no history view) | — |
| Self-assign | Technician claims the ticket (already in group + entity) | `glpi_groups_users` + `glpi_groups_tickets` + `glpi_tickets_users.type=2` | **Construir** (ADR-006) | — |
| Closure | Mandatory written solution — cannot close without one | `glpi_itilsolutions` | **Construir** (ADR-006) | `glpi_itilsolutions` = 0 rows |
| CTI | Out of scope | — | **Fuera de alcance** | Manual capture only |
| Email (collector/notifications) | Out of scope | GLPI mail collector exists but unused | **Fuera de alcance** | — |
| Reporting | Out of scope — external BI | GLPI reports exist | **Fuera de alcance** | BI reads the DB separately |
| Group ownership of tickets | Groups own the work | `glpi_groups_tickets.type = 2` = assigned | **Exponer / Construir** (assign-by-group) | PASO 4 verified |

No **Pendiente** rows remain: every item is either decided or out of scope.

## External requester — decision (Option D)

The business confirmed (ADR-004, answer 1) that external callers arrive **per call
with no recurring-caller grouping**. Based on that, the options below were
evaluated live and the decision is **Option D** — full reasoning in
[ADR-005](../01-architecture/decisions/ADR-005-external-requester-model.md).

### Option A — existing GLPI user as requester
- **SQL:** ticket + `glpi_tickets_users(type=1, users_id=9)`.
- **UI:** the list shows `Usuario Uno`; filterable by `users_id` (structured).
- **Rejected for externals:** requires an account per caller; no aggregatable
  recurrence to justify the overhead. (Still correct for **internal** requesters.)

### Option B — `alternative_email` (no account)
- **SQL:** `glpi_tickets_users(type=1, users_id=0, alternative_email='juan@ext.com')`
  (`alternative_email varchar(255) NULL`).
- **UI:** the list shows `juan@ext.com`; the ticket detail shows `Solicitante: ×juan@ext.com`.
  **It renders, lists and filters correctly.**
- **Queryable:** yes, structured — `WHERE alternative_email = ?`.
- **Cost:** requires an **email**, which a phone call may not collect. **No name/phone field.**

### Option C — generic "External Caller" user + caller data in `content`
- **SQL:** create user `external-caller` (id 10); ticket requester = that user; the real
  caller's name/phone/company go into the ticket `content`.
- **UI:** the list shows `External Caller`; the detail shows the generic actor; the caller
  identity lives in the description. **It renders fine.**
- **Queryable:** only by free text — `WHERE content LIKE '%Juan Perez%'`. **Not a structured field.**
- **Cost:** every external caller collapses onto one requester — identity is lost.

### Option D — chosen
`glpi_tickets_users(type=1, users_id=0, alternative_email)` **plus** a structured
caller block in `content`:

```
Llamante: <nombre> · Tel: <teléfono> · Empresa: <empresa opcional>

<descripción del problema>
```

Keeps B's native, renderable actor and recovers the identity that B and C drop.
Caller search is free-text (`content LIKE`). If recurring callers are ever needed,
migrate to Option A. See ADR-005.

## Data model inventory (PASO 1)

| Table | Purpose (1 line) | Key columns |
|---|---|---|
| `glpi_groups` | Technician groups (flat here); flags what a group can be used as | `id`, `entities_id`, `name`, `completename`, `level`, `groups_id` (parent), `is_requester`, `is_watcher`, `is_assign`, `is_notify`, `is_usergroup`, `is_manager` |
| `glpi_groups_tickets` | Ticket ↔ group link, with role `type` | `id`, `tickets_id`, `groups_id`, `type` (**1=requester, 2=assigned, 3=observer**) |
| `glpi_tickets_users` | Ticket ↔ user actor link, with role and optional external email | `id`, `tickets_id`, `users_id`, `type` (1=requester, 2=assigned, 3=observer), `use_notification`, `alternative_email` |
| `glpi_requesttypes` | Entry channel catalogue | `id`, `name`, `is_helpdesk_default`, `is_mail_default`, `is_active`, `is_ticketheader`, `is_itilfollowup` |

## Current data (PASO 2)

| Table | Count | Notes |
|---|---|---|
| `glpi_groups` | **0** | No groups defined by the business yet |
| `glpi_groups_tickets` | **0** | No ticket had ever been group-assigned |
| `glpi_requesttypes` | **6** | Helpdesk(1), E-Mail(2), Phone(3), Direct(4), Written(5), Other(6) — all active |
| `glpi_tickets_users` with non-empty `alternative_email` | **0** | Nobody had used the external-email mechanism yet |

## Filter by group (PASO 4)

"Tickets currently assigned to a group" (exclude solved=5 / closed=6):

```sql
SELECT t.*
FROM glpi_tickets t
INNER JOIN glpi_groups_tickets gt ON t.id = gt.tickets_id
WHERE gt.groups_id = @GroupId
  AND gt.type = 2          -- 2 = assigned
  AND t.status NOT IN (5, 6);
```

Verified with two throwaway groups: group `Call Center` (id 1) → ticket #11; group
`Soporte Nivel 1` (id 2) → ticket #9. The GLPI UI detail for #11 shows `Asignado a:
Call Center`.

## Test artefacts created during this investigation

These live only in the local test database and are **not** part of any migration:

| Artefact | Id | Purpose |
|---|---|---|
| Ticket | 9 | Pattern A — internal requester (`user1`) |
| Ticket | 10 | Pattern B — external requester via `alternative_email` |
| Ticket | 11 | Pattern C — generic `external-caller` user + data in `content` |
| User | 10 | `external-caller` (realname `External`, firstname `Caller`) |
| Groups | 1, 2 | `Call Center`, `Soporte Nivel 1` |

## Hallazgos de auditoría resueltos (H-05 / H-06)

- **H-05 (Grupos dinámicos)**: `GroupEndpoints` devolvía grupos hardcodeados. Resuelto en Bloque 6: ahora consulta `glpi_groups` filtrando por la entidad del usuario y `is_assign = 1` vía `IGroupRepository`.
- **H-06 (Canales dinámicos)**: `ChannelEndpoints` devolvía canales hardcodeados. Resuelto en Bloque 6: ahora consulta `glpi_requesttypes` con `is_active = 1` vía `IChannelRepository`.
