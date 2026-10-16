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
| `GET` | `/api/tickets?assigneeId={id}&serviceId={id}&limit=&offset=` | JWT | Tickets list with optional assignee and service filters |
| `GET` | `/api/tickets/{id}` | JWT | Full detail: description, follow-ups and user links |
| `PATCH` | `/api/tickets/{id}/status` | JWT | Change ticket status through GLPI |
| `GET` | `/api/dashboard/stats` | JWT | Aggregated metrics |
| `POST` | `/api/auth/login` | anonymous, rate-limited | Exchange credentials for a JWT |
| `GET` | `/api/auth/me` | JWT | Profile encoded in the current token |

### Filtros disponibles

El endpoint `GET /api/tickets` admite los siguientes filtros opcionales (query parameters):
- `assigneeId`: Filtra por técnico asignado (`glpi_tickets_users.type = 2`). Si no se proporciona ni `assigneeId` ni `serviceId`, por defecto se utiliza el ID del usuario autenticado.
- `groupId`: Filtra por grupo asignado (`glpi_groups_tickets`).
- `unassigned`: Filtra tickets sin técnico asignado.
- `serviceId`: Filtra por categoría ITIL (`glpi_itilcategories`) incluyendo subcategorías directas (1 nivel de profundidad: `t.itilcategories_id = @ServiceId OR t.itilcategories_id IN (SELECT id FROM glpi_itilcategories WHERE itilcategories_id = @ServiceId)`).

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

> [!NOTE]
> La creación de tickets se hace 100% en GLPI. Este sistema NO crea tickets (ADR-009).

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

The React app consumes mutation endpoints through the API. There is no direct database
access from the browser; the axios instance (`frontend/src/lib/apiClient.ts`) always
posts to same-origin `/api`, which Vite proxies to the API in development and Nginx in
production.

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

Mutations pass the error to `getApiErrorMessage` (`frontend/src/lib/api/errors.ts`),
which reads `ProblemDetails.detail`. The API puts the GLPI error message
(`GlpiApiException.Message`) there, so the real GLPI text appears in the toast for a
`502` (and `404` for a ticket GLPI no longer has).

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
- Preferences module: `docs/02-modules/preferences/overview.md`
- Audit module: `docs/02-modules/audit/overview.md`

## Auditoría automática

Las operaciones operativas clave (`claim` al autoasignarse un ticket y `resolve` al cambiar a estado 5) se registran automáticamente de manera asíncrona y no bloqueante en la tabla `audit_log` de PostgreSQL (ver [Audit Overview](../audit/overview.md)).

## Modelo de autorización estricto (BOLA Protection)

Para proteger la integridad de los datos y evitar vulnerabilidades de autorización a nivel de objeto (BOLA), el servidor aplica estrictamente las siguientes reglas mediante `TicketAccessPolicy`:

1. **Técnico (`technician`) — Modelo Estricto**:
   - **Lectura de detalle (`GET /api/tickets/{id}`)**: Solo puede ver un ticket si:
     * Está asignado a él, **O**
     * Está en estado Nuevo (`status = 1`), sin asignar, y pertenece a uno de sus grupos (para poder reclamarlo).
     * Un ticket asignado a otro técnico de su mismo grupo devuelve `403 Forbidden`.
   - **Modificación de estado (`PATCH /api/tickets/{id}/status`)**: Solo si está asignado a él.
   - **Inserción de soluciones (`POST /api/tickets/{id}/solutions`)**: Solo si está asignado a él.
   - **Autoasignación (`POST /api/tickets/{id}/claim`)**: Debe estar en estado Nuevo (`status = 1`), sin técnico asignado y pertenecer a un grupo del usuario.
   - **Listado (`GET /api/tickets`)**: Se ignora cualquier `assigneeId` provisto por el cliente; siempre se fuerza al `userId` del token autenticado.

2. **Supervisor (`supervisor`)**:
   - Puede ver, modificar estado y añadir soluciones a cualquier ticket que pertenezca a sus grupos de trabajo.

3. **Administrador (`admin`)**:
   - Acceso global irrestricto de lectura y modificación sobre todos los tickets y colas de cualquier grupo.

## Kanban del técnico

El tablero Kanban (`/kanban`) implementa el flujo operativo del técnico en 5 columnas de atención ágil:
1. **Cola del grupo**: Tickets en estado Nuevo (`status = 1`) pertenecientes al grupo técnico del usuario y sin técnico asignado (`GET /api/tickets/by-group?groupId=X&unassigned=true`). Incluye botón directo "Asignarme".
2. **Mis tickets**: Tickets asignados al resolutor en estado Nuevo o Asignado (`status = 1, 2`) listos para comenzar.
3. **En progreso**: Incidencias bajo diagnóstico o resolución activa (`status = 3`).
4. **Pendiente**: Tickets con atención pausada por espera externa (`status = 4`).
5. **Resuelto**: Tickets solucionados con solución documentada obligatoria (`status = 5`, según ADR-006).

### Consultas y partición
- **Cola del grupo**: Se obtiene mediante `useGroupQueueQuery(currentGroupId)`.
- **Columnas personales**: Se obtienen con `useTicketsQuery(currentUserId)` y se particionan en memoria en el cliente según su `status`. Los tickets cerrados (`status = 6`) se omiten del tablero.

### Transiciones permitidas (Drag & Drop)
- `queue → mine`: Dispara autoasignación (`POST /api/tickets/{id}/claim`).
- `mine → in_progress`: Cambia el estado a planificado (`PATCH /api/tickets/{id}/status { status: 3 }`).
- `in_progress → pending`: Pausa la incidencia (`PATCH /api/tickets/{id}/status { status: 4 }`).
- `pending → in_progress`: Reanuda la incidencia (`PATCH /api/tickets/{id}/status { status: 3 }`).
- `in_progress → resolved`: Abre el modal `ResolveTicketDialog` para ingreso mandatorio de solución escrita (`POST /api/tickets/{id}/solutions` y posterior cambio a `status = 5`).
- Las transiciones no permitidas se revierten silenciosamente sin alterar el estado.

Para consultar el diagrama visual completo, consultar el [Flujograma 5: Kanban del Técnico](../../09-visual-docs/flows/kanban-flow.html).

### Kanban móvil (< 768px)

En dispositivos móviles, el tablero Kanban sustituye el scroll horizontal de 5 columnas (1440px) por una experiencia nativa y adaptativa:
- **Segmented Tabs**: Las 5 columnas se presentan como tabs horizontales con desplazamiento suave, targets táctiles mínimos de 44px (`min-h-[44px]`), badges con contador de tickets y animación de pestaña activa con Motion (`layoutId="activeKanbanTabBg"`).
- **Lista vertical unificada**: Solo la columna seleccionada se renderiza a la vez, permitiendo navegación natural vertical con tarjetas compactas de tickets.
- **Acciones inline contextuales**: Se evita el drag & drop táctil en favor de botones directos por columna:
  - Cola: `[Asignarme]` (claim directo al usuario).
  - Mis tickets: `[Empezar]` (cambio a estado 3 / En progreso).
  - En progreso: `[Resolver]` (apertura de `ResolveTicketDialog`).
  - Pendiente: `[Retomar]` (reanudación a estado 3 / En progreso).
  - Resuelto: sin acción (enlace de detalle).
- **Smart default tab**: Selección inteligente de la pestaña activa inicial en móvil: `in_progress` (si se está trabajando activamente) > `queue` (si hay tickets en cola) > `mine` > `pending`.
- **Swipe horizontal entre tabs**: Gesto de arrastre horizontal (swipe) con Motion sobre la lista para alternar ágilmente entre columnas contiguas con retroalimentación elástica.
- **Automatizaciones en cola**: Auto-refresco en segundo plano cada 30 segundos mientras la tab "Cola" está activa, indicador pulsante suave si ingresan nuevos tickets a la cola y badge en el Bottom Tab Bar.



