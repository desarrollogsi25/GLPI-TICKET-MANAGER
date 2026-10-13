# Tickets module

- **Layer:** `GlpiTicketManager.Application` + `GlpiTicketManager.Api`
- **Writes via:** GLPI REST API (`IGlpiApiClient`)
- **Reads via:** MariaDB + Dapper (`ITicketRepository`)
- **Auth:** API-issued JWT (see `docs/01-architecture/ADR-002-api-glpi-integration.md`)

## Purpose

Expose GLPI ticket data to the custom frontend without reimplementing GLPI's
workflow. Reads come straight from the GLPI database for speed; every mutation goes
through the GLPI REST API so notifications, logs, SLAs and plugins keep working.

## Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tickets?assigneeId={id}&limit=&offset=` | JWT | Tickets assigned to a technician (`glpi_tickets_users.type = 2`) |
| `GET` | `/api/tickets/{id}` | JWT | Full detail: description, follow-ups and user links |
| `POST` | `/api/tickets` | JWT | Create a ticket through GLPI |
| `PATCH` | `/api/tickets/{id}/status` | JWT | Change ticket status through GLPI |
| `GET` | `/api/dashboard/stats` | JWT | Aggregated metrics |
| `POST` | `/api/auth/login` | anonymous, rate-limited | Exchange credentials for a JWT |
| `GET` | `/api/auth/me` | JWT | Profile encoded in the current token |

Interactive documentation: **Scalar** at `/scalar/v1`; the raw OpenAPI document is at
`/openapi/v1.json`.

## Domain model

Enums are defined in `GlpiTicketManager.Domain/Enums` and match GLPI's numeric codes.

| Concept | Source | Values |
|---|---|---|
| Ticket status | `glpi_tickets.status` | 1 New, 2 Assigned, 3 Planned, 4 Waiting, 5 Solved, 6 Closed |
| Ticket type | `glpi_tickets.type` | 1 Incident, 2 Request |
| Priority | `glpi_tickets.priority` | 1 VeryLow … 5 VeryHigh, 6 Major |
| User role | `glpi_tickets_users.type` | 1 Requester, 2 Assigned, 3 Observer |

DTOs (`TicketSummaryDto`, `TicketDetailDto`, `TicketFollowupDto`) carry both the
numeric code and a `…Label` string so the frontend does not duplicate the mapping.

## Flows

### GLPI write chain

Every write is a short, stateless session against GLPI's legacy REST API
(`apirest.php`). The sequence is always the same:

```
GET  {GlpiApi:BaseUrl}initSession   headers: App-Token + Authorization: user_token <token>
                                      → { "session_token": "..." }
POST {GlpiApi:BaseUrl}Ticket        headers: App-Token + Session-Token      (create)
PUT  {GlpiApi:BaseUrl}Ticket/{id}   headers: App-Token + Session-Token      (update)
GET  {GlpiApi:BaseUrl}killSession   headers: App-Token + Session-Token      (always)
```

`initSession` and `killSession` are issued by `GlpiApiClient`; `killSession` runs in a
`finally` block so a session is never left orphaned, even when the write throws. The
`session_token` returned by GLPI is used only as the `Session-Token` header and is
never exposed to clients of this API.

### Create a ticket

```
Frontend ──POST /api/tickets──► TicketService.CreateAsync
                                   │ validates (title, type, urgency, impact)
                                   ▼
                              IGlpiApiClient.CreateTicketAsync
                                   │ GET  initSession  (App-Token + user_token)
                                   │ POST Ticket       (Session-Token)  → { "id": N }
                                   │ GET  killSession  (finally)
                                   ▼
                              201 Created { "id": N }
```

Request body (note: `urgency`/`impact`, singular `requesterId`/`assigneeId`):

```json
{
  "title": "TEST escritura desde API",
  "content": "Ticket creado para validar integración de escritura.",
  "type": 1,
  "urgency": 3,
  "impact": 3,
  "requesterId": 9,
  "assigneeId": 7
}
```

GLPI derives `priority` from `urgency × impact`. `requesterId` maps to
`_users_id_requester` (requester, `glpi_tickets_users.type = 1`) and `assigneeId`
maps to `_users_id_assign` (assigned technician, `type = 2`), so the created ticket
appears under `/api/tickets?assigneeId={assigneeId}`.

Validation failures never reach GLPI and return `400` with an `errors` dictionary.

### Change status

```
PATCH /api/tickets/{id}/status { "status": 2 }
  → validates status ∈ [1..6]
  ▼
GlpiApiClient.UpdateTicketStatusAsync
  │ GET  initSession            (App-Token + user_token)
  │ PUT  Ticket/{id}            { "input": { "status": 2 } }   (Session-Token)
  │ GET  killSession            (finally)
  ▼
204 No Content   (404 if GLPI reports the ticket is gone)
```

### Frontend write flows

The React app consumes the two write endpoints above. There is no direct database
access from the browser; the axios instance (`frontend/src/lib/apiClient.ts`) always
posts to same-origin `/api`, which Vite proxies to the API in development and Nginx in
production.

**Create a ticket**

| Step | Location |
|---|---|
| "Nuevo ticket" button opens the dialog | `frontend/src/features/tickets/List.tsx` (`<CreateTicketDialog />`) |
| Form + payload | `frontend/src/features/tickets/CreateTicketDialog.tsx` |
| Mutation + invalidation | `frontend/src/hooks/useTickets.ts` → `useCreateTicketMutation` |
| HTTP call | `frontend/src/lib/api/tickets.ts` → `createTicket` |

Payload sent (matches the DTO in `frontend/src/lib/api/types.ts` → `CreateTicketInput`):

```json
{ "title": "…", "content": "…", "type": 1, "urgency": 3, "impact": 3, "assigneeId": 7, "requesterId": 7 }
```

The dialog has a **"Asignarme este ticket"** checkbox (checked by default). When checked
the payload includes `"assigneeId": <authenticated user id>`; when unchecked `assigneeId`
is omitted and GLPI leaves the ticket in status `1` (New, unassigned). `requesterId` is
always the authenticated user's id.

On success the mutation invalidates `['tickets']` and `['dashboard','stats']`, the
dialog shows a toast, closes, and the app navigates to `/tickets/{id}` (the new
detail page).

**Change status (Kanban drag & drop and detail buttons)**

| Step | Location |
|---|---|
| Drag handler | `frontend/src/features/tickets/Kanban.tsx` → `handleDragEnd` (`@dnd-kit/core`) |
| Detail buttons | `frontend/src/features/tickets/Detail.tsx` → `changeStatus` |
| Mutation + invalidation | `frontend/src/hooks/useTickets.ts` → `useUpdateTicketStatusMutation` |
| HTTP call | `frontend/src/lib/api/tickets.ts` → `updateTicketStatus` |

Payload/response: `PATCH /api/tickets/{id}/status` with `{ "status": N }` → `204 No
Content`. On success the mutation invalidates `['tickets']`, `['tickets','detail',id]`
and `['dashboard','stats']`, so the Kanban re-renders the card in its new column
without a manual refresh. Drops onto the same status are ignored client-side before
the request is sent.

**Error surfacing**

Both mutations pass the error to `getApiErrorMessage`
(`frontend/src/lib/api/errors.ts`), which reads `ProblemDetails.detail`. The API puts
the GLPI error message (`GlpiApiException.Message`) there, so the real GLPI text
appears in the toast for a `502` (and `404` for a ticket GLPI no longer has).

### Notes on the create form

- **"Asignarme este ticket"** (checked by default) controls `assigneeId`. GLPI assigns
  status `2` (Assigned) automatically when a ticket is created with an assignee
  (`_users_id_assign`); with the checkbox unchecked no assignee is sent and the ticket
  is created in status `1` (New).
- `priority` is never sent by the frontend (ADR-003); it is computed by GLPI from
  `urgency × impact` and only read back.
- **Known limitation:** `requesterId` is always the authenticated user. There is no
  requester picker yet (pending for a next iteration), so a technician creating a ticket
  on behalf of someone else cannot set that person as the requester.

### GLPI connection settings

Bound from the `GlpiApi` configuration section (`GlpiOptions`):

| Key | Meaning |
|---|---|
| `GlpiApi:BaseUrl` | Must include `apirest.php/`, e.g. `http://localhost:8081/apirest.php/` |
| `GlpiApi:AppToken` | Application token of an *API client* (`glpi_apiclients`) |
| `GlpiApi:UserToken` | Personal API token of the account used for writes (`glpi_users.api_token`) |
| `GlpiApi:TimeoutSeconds` | `HttpClient` timeout, default `30` |

See `docs/12-security/secrets.md` for where these values live and how to rotate them.

## Authentication

`POST /api/auth/login` verifies the credentials against `glpi_users` (BCrypt hash,
normalising the `$2y$` prefix GLPI uses) and returns a JWT minted by the API. The
token is validated with HMAC-SHA256; `Jwt:Key` must be at least 32 bytes and is
required at startup.

The login endpoint is protected by the native .NET 9 rate limiter
(`RateLimitPolicies.Login`): **5 attempts per minute per IP**, then `429`. All other
ticket endpoints require a valid JWT and return `401` otherwise.

## Error contract

RFC 7807 `ProblemDetails` for every failure:

| Condition | Status |
|---|---|
| Validation error | `400` |
| Missing/invalid JWT | `401` |
| Ticket not found (GLPI reports it gone) | `404` |
| Too many login attempts | `429` |
| GLPI REST API failure | `502` |
| Anything else | `500` |

## Related files

- Entities/enums: `src/GlpiTicketManager.Domain`
- Use cases + DTOs: `src/GlpiTicketManager.Application`
- Dapper queries/repositories + GLPI client: `src/GlpiTicketManager.Infrastructure`
- Minimal API endpoints: `src/GlpiTicketManager.Api/Endpoints`
- Assignee query reference: `docs/04-database/queries/tickets-by-assignee.md`
