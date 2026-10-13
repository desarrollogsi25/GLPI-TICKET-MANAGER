# Call Centre Gap Analysis

ISO Header: Business Scope

**Status:** Draft — awaiting business answers (see
[`call-center-questions.md`](call-center-questions.md))

Scope: a **call centre service desk**. No shifts, no N1/N2/N3 tiers (flat groups only),
SLAs not yet defined, internal (GLPI users) **and** external (non-GLPI callers)
requesters, no CTI, no email, manual entry channels only (in person, phone, chat), no
reporting (BI is external). The product is **actionable, not analytical**.

Every statement below was verified against the running GLPI 11.0 test instance
(`glpi-db` / `glpi` containers) via SQL and the GLPI web UI.

## Business answers → proposed action

Proposed action ∈ {**Exponer**, **Configurar en GLPI UI**, **Construir**, **Fuera de alcance**}.

| Topic | Business answer | GLPI capability today | Proposed action | Evidence |
|---|---|---|---|---|
| Shifts / rosters | Out of scope | GLPI has no shift model; only groups | **Fuera de alcance** | — |
| N1 / N2 / N3 tiers | Out of scope — flat groups only | `glpi_groups` is flat (nesting exists but unused) | **Fuera de alcance** (keep groups flat) | PASO 2: `glpi_groups` = 0 rows |
| SLA | Pending definition | GLPI SLA engine exists but is unconfigured | **Fuera de alcance** until defined | Do not build yet |
| Requesters — internal | GLPI users | `glpi_tickets_users.type = 1` with `users_id` | **Exponer** (create DTO already has `requesterId`) | PASO 3-A → ticket #9 |
| Requesters — external | Non-GLPI callers | (B) `alternative_email` **or** (C) generic user + data in `content` | **Decisión pendiente** (trade-offs below) | PASO 3-B/#10, 3-C/#11 |
| CTI | Out of scope | — | **Fuera de alcance** | Manual capture only |
| Email (collector/notifications) | Out of scope | GLPI mail collector exists but unused | **Fuera de alcance** | — |
| Entry channels (in person / phone / chat) | Manual | `glpi_requesttypes` has 6 rows | **Configurar en GLPI UI** + **Exponer** in the form | PASO 2 |
| Reporting | Out of scope — external BI | GLPI reports exist | **Fuera de alcance** | BI reads the DB separately |
| Group ownership of tickets | Groups own the work | `glpi_groups_tickets.type = 2` = assigned | **Exponer / Construir** (assign-by-group) | PASO 4 verified |

## External requester options — trade-offs (decision left open)

The call centre must represent **non-GLPI callers**. GLPI supports two viable mechanisms.
Both were inserted and observed live; **no option is chosen here** — the business decides.

### Option A — existing GLPI user as requester
- **SQL:** ticket + `glpi_tickets_users(type=1, users_id=9)`.
- **UI:** the list shows `Usuario Uno`; filterable by `users_id` (structured).
- **When:** the caller is a known internal user (has a GLPI account).

### Option B — `alternative_email` (no account)
- **SQL:** `glpi_tickets_users(type=1, users_id=0, alternative_email='juan@ext.com')`
  (`alternative_email varchar(255) NULL`).
- **UI:** the list shows `juan@ext.com`; the ticket detail shows `Solicitante: ×juan@ext.com`.
  **It renders, lists and filters correctly.**
- **Queryable:** yes, structured — `WHERE alternative_email = ?`.
- **Cost:** requires an **email**, which a phone call may not collect. No name/phone field.
- **Verified:** ticket #10.

### Option C — generic "External Caller" user + caller data in `content`
- **SQL:** create user `external-caller` (id 10); ticket requester = that user; the real
  caller's name/phone/company go into the ticket `content`.
- **UI:** the list shows `External Caller`; the detail shows the generic actor; the caller
  identity lives in the description. **It renders fine.**
- **Queryable:** only by free text — `WHERE content LIKE '%Juan Perez%'`. **Not a structured field.**
- **Cost:** every external caller collapses onto one requester, so you cannot segment or
  de-duplicate **recurring** callers, and you cannot filter per caller structurally.
- **Verified:** ticket #11.

> Note: the two mechanisms are not mutually exclusive (a placeholder account *and* an
> `alternative_email` can coexist), but that doubles the bookkeeping. Choose based on how
> the business answers the questions in
> [`call-center-questions.md`](call-center-questions.md).

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
