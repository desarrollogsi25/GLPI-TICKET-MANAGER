# Tickets module

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-02-MOD-TICKETS | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


- **Layer:** `GlpiTicketManager.Application` + `GlpiTicketManager.Api`
- **Writes via:** GLPI REST API (`IGlpiApiClient`)
- **Reads via:** MariaDB + Dapper (`ITicketRepository`)
- **Auth:** API-issued JWT (see `docs/01-architecture/ADR-002-api-glpi-integration.md`)

## Purpose

Consola de Service Desk para Técnicos y Administradores. Los tickets ingresan desde GLPI
y se gestionan operativamente en esta interfaz. Reads come straight from the GLPI database
for speed; mutations go through the GLPI REST API / DB transactions according to the write strategy.

## Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tickets?assigneeId={id}&serviceId={id}&startDate={yyyy-MM-dd}&endDate={yyyy-MM-dd}&limit=&offset=` | JWT | Tickets list with optional assignee, service and creation-date filters |
| `GET` | `/api/tickets/{id}` | JWT | Full detail: description, follow-ups and user links |
| `POST` | `/api/tickets/{id}/resolve` | JWT | **Preferred (atomic)**: write the solution and resolve/close the ticket in one call (ADR-020, BUG-031) |
| `POST` | `/api/tickets/{id}/solutions` | JWT | Insert a written solution into glpi_itilsolutions (ADR-006). In GLPI 11 this auto-solves the ticket. |
| `POST` | `/api/tickets/{id}/claim` | JWT | Technician claims an unassigned ticket (ADR-017) |
| `POST` | `/api/tickets/{id}/reopen` | JWT | Reopen a solved or closed ticket (ADR-019) |
| `PATCH` | `/api/tickets/{id}/status` | JWT | Change ticket status (requires a non-empty solution to reach Solved/Closed; see guard below) |
| `GET` | `/api/dashboard/stats` | JWT | Aggregated metrics |
| `POST` | `/api/auth/login` | anonymous, rate-limited | Exchange credentials for a JWT |
| `GET` | `/api/auth/me` | JWT | Profile encoded in the current token |

### Filtros disponibles

El endpoint `GET /api/tickets` admite los siguientes filtros opcionales (query parameters):
- `assigneeId`: Filtra por técnico asignado (`glpi_tickets_users.type = 2`). Si no se proporciona ni `assigneeId` ni `serviceId`, por defecto se utiliza el ID del usuario autenticado.
- `groupId`: Filtra por grupo asignado (`glpi_groups_tickets`).
- `unassigned`: Filtra tickets sin técnico asignado.
- `serviceId`: Filtra por categoría ITIL (`glpi_itilcategories`) incluyendo subcategorías directas (1 nivel de profundidad: `t.itilcategories_id = @ServiceId OR t.itilcategories_id IN (SELECT id FROM glpi_itilcategories WHERE itilcategories_id = @ServiceId)`).
- `startDate`: Cota inferior inclusiva sobre la fecha de creación (`glpi_tickets.date`), en formato `yyyy-MM-dd`. Si se envía una fecha sin hora, se interpreta como **00:00:00 UTC**.
- `endDate`: Cota superior inclusiva sobre la fecha de creación. Si se envía una fecha sin hora, se normaliza al final del día UTC (**23:59:59.9999999**) para que un rango de un solo día cubra el día completo.
- Si `startDate` es posterior a `endDate`, el endpoint devuelve `400 Bad Request` con el detalle del filtro inválido.

#### Zonas horarias en el filtro de fechas

GLPI persiste `glpi_tickets.date` en **UTC**. Para que los rangos no dependan de la zona horaria del navegador, la normalización se realiza en la capa de servicio (`TicketService.ToUtcBound`) antes de llegar a Dapper:

| Kind recibido | Normalización |
|---|---|
| `Utc` | Se usa tal cual. |
| `Local` | Se convierte con `ToUniversalTime()`. |
| `Unspecified` (caso típico al bindear una fecha `yyyy-MM-dd`) | Se asume UTC mediante `DateTime.SpecifyKind(..., Utc)`. |

Las comparaciones SQL (`t.date >= @StartDate` / `t.date <= @EndDate`) se ejecutan por lo tanto siempre contra valores UTC, alineadas con el reloj UTC de la sesión de MariaDB.

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

### Escrituras GLPI (Estrategia Híbrida)

Conforme a [ADR-017](../../01-architecture/decisions/ADR-017-glpi-write-strategy.md), las mutaciones se distribuyen según sus requisitos de concurrencia y reglas de negocio:
- **Resolución atómica (`POST /api/tickets/{id}/resolve`) (preferido):** Escrito vía `ITicketService.ResolveAsync`. Requiere ambos permisos (`CanAddSolutionAsync` + `EvaluateStatusTransitionAsync`). Escribe la solución, relee el estado (GLPI 11 auto-resuelve al crearla), cierra automáticamente a `6` si procede, audita `resolve` y emite **un único** evento SignalR `TicketStatusChanged`. Ver [ADR-020](../../01-architecture/decisions/ADR-020-resolucion-atomic-de-ticket.md).
- **Cambio de estado (`PATCH /api/tickets/{id}/status`)**: Vía GLPI REST API (`PUT /Ticket/{id}`). GLPI ejecuta reglas de negocio y transiciones.
- **Creación de solución (`POST /api/tickets/{id}/solutions`)**: Vía GLPI REST API (`POST /ITILSolution`). GLPI valida y persiste la solución con su metadatos y eventos. **En GLPI 11 la creación de `ITILSolution` mueve el ticket a `Resuelto (5)` por su cuenta.**
- **Claim / Autoasignación (`POST /api/tickets/{id}/claim`)**: Vía **SQL directo atómico** (`UPDATE glpi_tickets ... WHERE id = @Id AND status = 1 AND NOT EXISTS (...)`). Justificado en [ADR-017](../../01-architecture/decisions/ADR-017-glpi-write-strategy.md) debido a que la API REST de GLPI no ofrece garantías transaccionales de no-duplicación ante peticiones simultáneas.

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

## Vista de tickets por rol (auto-scoping)

La vista `/tickets` adapta sus filtros al rol del usuario autenticado:

- **Técnico (`technician`)**: La vista se auto-scopea a los tickets asignados al propio técnico. El dropdown de "Técnico" **no se renderiza** (`TechnicianFilter` devuelve `null`), y `useSelectedAssignee` ignora cualquier selección previa persistida en el UI store, devolviendo siempre el `userId` de la sesión. De esta forma el técnico nunca puede caer accidentalmente en la cola de otro compañero.
- **Supervisor (`supervisor`) y Administrador (`admin`)**: El dropdown de "Técnico" permanece visible (`Técnico #N (yo)` / técnicos con carga reportada en `GET /api/dashboard/stats`) para poder auditar el trabajo de otros técnicos.

Independientemente del dropdown, el backend aplica el fix BOLA descrito arriba: el `assigneeId` provisto por el cliente se ignora y el listado siempre se filtra por el `userId` del token, por lo que ocultar el control es una mejora de UX y no la única barrera de autorización.

## Filtros por fecha en la lista de tickets

La lista (`frontend/src/features/tickets/List.tsx`) incorpora dos campos `<input type="date">` ("Desde" / "Hasta") junto a los filtros de Estado y Prioridad:

- En **escritorio** viven en `TicketFiltersBar`, junto al botón **"Limpiar filtros"** que resetea estado, prioridad, rango de fechas y búsqueda.
- En **móvil** se integran en `TicketFiltersSheet` (bottom sheet) como filtros de borrador que se confirman con "Aplicar filtros" o se limpian con "Limpiar todo".
- Los valores se sincronizan con la query string (`?startDate=…&endDate=…`) mediante `react-router`, de modo que una vista filtrada es compartible y recargable.
- Los filtros de fecha se combinan con `serviceId` y `assigneeId`; el conteo de filtros activos (`activeFiltersCount`) los incluye.

## Kanban del técnico

El tablero Kanban (`/kanban`) implementa el flujo operativo del técnico en 5 columnas de atención ágil:
1. **Cola del grupo**: Tickets en estado Nuevo (`status = 1`) pertenecientes al grupo técnico del usuario y sin técnico asignado (`GET /api/tickets/by-group?groupId=X&unassigned=true`). Incluye botón directo "Asignarme".
2. **Mis tickets**: Tickets asignados al resolutor en estado Nuevo o Asignado (`status = 1, 2`) listos para comenzar.
3. **En progreso**: Incidencias bajo diagnóstico o resolución activa (`status = 3`).
4. **Pendiente**: Tickets con atención pausada por espera externa (`status = 4`).
5. **Resuelto**: Tickets solucionados o cerrados (`status = 5` y `status = 6`, según ADR-006). La resolución exige una solución documentada; al resolver, el ticket se cierra automáticamente (véase [Reglas de estado](#reglas-de-estado-y-cierre-automático)).

### Consultas y partición
- **Cola del grupo**: Se obtiene mediante `useGroupQueueQuery(currentGroupId)`.
- **Columnas personales**: Se obtienen con `useTicketsQuery(currentUserId)` y se particionan en memoria en el cliente según su `status`. La columna **Resuelto** agrupa los estados Resuelto (5) y Cerrado (6).

### Orden de las tarjetas
- **Columnas activas** (Cola del grupo, Mis tickets, En progreso, Pendiente): orden **FIFO** (ascendente) por fecha de última actualización (o de creación si no hubiera actualización). La tarjeta más antigua aparece arriba.
- **Columna Resuelto**: orden **LIFO** (descendente); el cambio más reciente aparece arriba.
- El ordenamiento se aplica de forma determinista en el cliente mediante `sortTicketsForColumn` (`frontend/src/features/tickets/Kanban.tsx`), usando `updatedAt ?? createdAt` con `id` como desempate.
- **La prioridad no interviene en el orden**; sólo se muestra como color de insignia. Tanto el backend (ORDER BY en `TicketQueries`/`TicketRepository`) como el cliente respetan esta política.

### Transiciones permitidas (Drag & Drop)
- `queue → mine`: Dispara autoasignación (`POST /api/tickets/{id}/claim`).
- `mine → in_progress`: Cambia el estado a planificado (`PATCH /api/tickets/{id}/status { status: 3 }`).
- `in_progress → pending`: Pausa la incidencia (`PATCH /api/tickets/{id}/status { status: 4 }`).
- `pending → in_progress`: Reanuda la incidencia (`PATCH /api/tickets/{id}/status { status: 3 }`).
- `in_progress → resolved`: Abre el modal `ResolveTicketDialog` para ingreso mandatorio de solución escrita (`POST /api/tickets/{id}/solutions` y posterior cambio a `status = 5`). El ticket se cierra automáticamente (`status = 6`).
- `pending → resolved`: Permite resolver directamente desde Pendiente reutilizando el mismo modal de solución.
- **No se permite** `mine → queue` (devolver un ticket asignado a Nuevo) ni mover fuera de Resuelto/Cerrado.
- Las transiciones no permitidas se rechazan en el backend con `403` y un mensaje claro; la interfaz lo muestra en un *toast* de error en lugar de revertir en silencio.

Para consultar el diagrama visual completo, consultar el [Flujograma 5: Kanban del Técnico](../../09-visual-docs/flows/kanban-flow.html).

### Kanban móvil (< 768px)

En dispositivos móviles, el tablero Kanban sustituye el scroll horizontal de 5 columnas (1440px) por una experiencia nativa y adaptativa:
- **Segmented Tabs**: Las 5 columnas se presentan como tabs horizontales con desplazamiento suave, targets táctiles mínimos de 44px (`min-h-[44px]`), badges con contador de tickets y animación de pestaña activa con Motion (`layoutId="kanban-segment-active"`).
- **Lista vertical unificada**: Solo la columna seleccionada se renderiza a la vez, permitiendo navegación natural vertical con tarjetas compactas de tickets.
- **Acciones inline contextuales**: Se evita el drag & drop táctil en favor de botones directos por columna:
  - Cola: `[Asignarme]` (claim directo al usuario con spinner de carga interactivo).
  - Mis tickets: `[Empezar]` (cambio a estado 3 / En progreso).
  - En progreso: `[Resolver]` (apertura de `ResolveTicketDialog`).
  - Pendiente: `[Retomar]` (reanudación a estado 3 / En progreso).
  - Resuelto: sin acción (enlace de detalle).
- **Smart default tab**: Selección inteligente de la pestaña activa inicial en móvil: `in_progress` (si se está trabajando activamente) > `queue` (si hay tickets en cola) > `mine` > `pending`.
- **Swipe horizontal entre tabs**: Gesto de arrastre horizontal (swipe) con Motion sobre la lista para alternar ágilmente entre columnas contiguas con retroalimentación elástica.
- **Automatizaciones en cola**: Auto-refresco en segundo plano cada 30 segundos mientras la tab "Cola" está activa, indicador pulsante suave si ingresan nuevos tickets a la cola y badge en el Bottom Tab Bar.

### Motion y feedback visual (Bloque 11)

El tablero Kanban integra animaciones fluidas con Motion (`motion/react`) para dar continuidad física a los cambios de estado y eventos en tiempo real:

1. **Layout animations en Desktop**:
   - Cada tarjeta está envuelta en un contenedor con prop `layout` y física de resorte (`spring`, `stiffness: 350`, `damping: 30`, `duration: 0.25s`).
   - Al cambiar de columna (por drag & drop o actualización externa), la tarjeta se desliza físicamente a su nueva posición sin desaparecer ni parpadear. Las demás tarjetas de la columna se reacomodan automáticamente con animación suave.
   - Si una columna queda sin tickets, el empty state entra con un fade-in suave (`opacity: 0 → 1`, 300ms) sin colapsar la altura del contenedor.

2. **Transiciones entre tabs y claim en Móvil**:
   - Al alternar entre tabs (por tap o gesto de swipe), la lista saliente sale con desplazamiento lateral suave (`exit: { opacity: 0, x: -20 }`) y la nueva entra desde la dirección opuesta (`initial: { opacity: 0, x: 20 }`, 200ms spring).
   - Al autoasignarse un ticket en la cola móvil (`Asignarme`), la tarjeta realiza un exit animado con escala y desvanecimiento (`exit: { opacity: 0, scale: 0.9 }`), permitiendo que el empty state aparezca fluidamente si era el único elemento.

3. **Feedback táctil y drag inválido**:
   - **Botón Asignarme**: Muestra un spinner de carga y estado deshabilitado durante la mutación de claim, seguido de toast de confirmación.
   - **Drag inválido**: Si el usuario arrastra un ticket hacia una columna de destino no permitida según la máquina de estados, la tarjeta ejecuta una sutil animación de shake (`x: [0, -4, 4, -4, 4, 0]`, 300ms) antes de regresar a su columna original.

4. **Highlight en tiempo real (SignalR)**:
   - Al recibir eventos de `TicketStatusChanged` o `TicketClaimed` emitidos por otros usuarios a través del Hub de SignalR, el sistema identifica el ticket modificado y activa un resaltado temporal mediante anillo de acento (`boxShadow: 0 0 0 2px rgb(109 89 232)`).
   - El highlight permanece visible durante 1.5 segundos y se desvanece suavemente, permitiendo al técnico advertir visualmente la actividad concurrente sin interrumpir su trabajo.

5. **Accesibilidad y `prefers-reduced-motion`**:
   - Todas las animaciones respetan estrictamente la preferencia de movimiento reducido del usuario a través del hook `useReducedMotion()`.
   - Cuando la preferencia está activa, todas las transiciones físicas de spring, desplazamientos de eje X e indicadores pulsantes conmutan a un fallback instantáneo (`duration: 0`), garantizando ergonomía visual y accesibilidad sin degradar la funcionalidad operativa.


## Concurrencia en claim

Para prevenir condiciones de carrera cuando múltiples técnicos intentan autoasignarse el mismo ticket simultáneamente (`POST /api/tickets/{id}/claim`), el sistema implementa atomicidad a nivel de repositorio y base de datos:

- **Modelo optimista con UPDATE condicional**: La operación se ejecuta dentro de una transacción en MariaDB donde el primer paso es un `UPDATE` condicional sobre `glpi_tickets` que verifica atómicamente `WHERE id = @TicketId AND status = 1 AND NOT EXISTS (SELECT 1 FROM glpi_tickets_users WHERE tickets_id = @TicketId AND type = 2)`.
- **Garantía**: Solo un técnico puede reclamar un ticket. El motor transaccional de MariaDB (InnoDB) bloquea la fila durante el `UPDATE`. El primer request modifica la fila y devuelve `rowsAffected = 1`, procediendo con el `INSERT` en `glpi_tickets_users`. Cualquier request concurrente espera el bloqueo o reevalúa la condición encontrando `rowsAffected = 0`.
### Desacoplamiento del badge de cola (Sidebar y Bottom Bar)

Para proteger la política de rate limiting `expensive` (`GET /api/tickets/by-group`):
- Los componentes de layout global (`AppSidebar` y `BottomTabBar`) **no realizan fetch de `by-group` en mount**.
- En su lugar, leen de forma síncrona los datos existentes en la caché de TanStack Query mediante `queryClient.getQueryData(queryKeys.tickets.byGroupQueue(groupId))`.
- Si el usuario no ha visitado `/queue` en la sesión, el badge permanece vacío (`queueCount = 0`).
- Al navegar a `/queue`, `GroupQueuePage` dispara la consulta `useGroupQueueQuery`, poblando la caché.
- El hook `useGroupQueueQuery` cuenta con `staleTime: 60_000`, evitando reconsultas redundantes mientras el usuario navega entre vistas de la aplicación.

## Reglas de negocio de GLPI

- **Contenido obligatorio en tickets para soluciones**: Un ticket debe tener `content` (descripción) no vacío en `glpi_tickets` para poder recibir soluciones vía GLPI REST (`/apirest.php/ITILSolution`). Un ticket sin descripción no es resoluble por API (GLPI rechaza la operación con `Mandatory fields are not filled`).
- **Validación de contenido de soluciones (H-24)**: Toda solución registrada mediante `POST /api/tickets/{id}/solutions` o `POST /api/tickets/{id}/resolve` es validada en el backend antes de su envío a GLPI. Debe ser **no vacía** (`TRIM(content) <> ''`) y **no exceder los 2000 caracteres**. Se permiten soluciones breves (p. ej. "OK", "Listo"); contenidos vacíos o compuestos sólo por espacios devuelven `400 Bad Request`.
- **Guard estricto de resolución (`status = 5`) — BUG-031 (H-31)**: La transición a resuelto (`PATCH /api/tickets/{id}/status { "status": 5 }`) exige la existencia de al menos una solución con contenido **no vacío** en `glpi_itilsolutions` (`TRIM(content) <> ''`). El antiguo requisito de **longitud mínima (10 caracteres)** se eliminó: la consulta `SolutionQueries.Exists` ya no impone ese mínimo. Las soluciones obsoletas (`glpi_itilsolutions.status = 4`) **no** cuentan. Soluciones vacías o con espacios en blanco son rechazadas con `422 Unprocessable Entity`. Ver [ADR-020](../../01-architecture/decisions/ADR-020-resolucion-atomic-de-ticket.md).
- **GLPI 11 auto-resuelve al crear la solución:** Crear una `ITILSolution` mueve el ticket a `Resuelto (5)`. El flujo preferido es `POST /api/tickets/{id}/resolve` (atómico): relee el estado, cierra automáticamente a `6` y emite **un único** evento SignalR. Los errores «el elemento ya está resuelto» de GLPI se traducen a `409 Conflict` en español.
- **Filtrado de grupos por entidad y asignación**: Los grupos que aparecen en el selector son exclusivamente los que pertenecen a la entidad del usuario autenticado (`glpi_groups.entities_id = @EntityId`) y que están habilitados para recibir tickets (`glpi_groups.is_assign = 1`).
- **Canales activos**: Los canales de entrada mostrados en la interfaz corresponden a los tipos de solicitud activos en `glpi_requesttypes` (`is_active = 1`).
- **Exclusión de tickets eliminados lógicamente (H-25)**: Las consultas de la cola de grupo (`TicketQueries.UnassignedByGroup` y su conteo en `TicketRepository.GetUnassignedByGroupAsync`), así como la condición de asignación (`ClaimConditionalUpdate`), filtran explícitamente `is_deleted = 0` para garantizar que tickets eliminados en GLPI no aparezcan en la bandeja de entrada ni puedan ser reclamados.

## Reglas de estado y cierre automático

La máquina de estados se aplica en `TicketAccessPolicy.EvaluateStatusTransitionAsync` y `TicketService.UpdateStatusAsync`:

- **Sin retroceso a Nuevo**: un técnico no puede mover un ticket `Asignado` (2) o `En progreso` (3) al estado `Nuevo` (1). El intento recibe `403` con `No puedes devolver un ticket asignado o en progreso al estado Nuevo.`
- **Cierre automático al resolver**: al registrar una resolución (por técnico o administrador), el ticket pasa inmediatamente a `Cerrado` (6) en la misma operación. Si el cierre automático falla en GLPI, se registra una advertencia y no se revierte la resolución.
- **Flujo atómico recomendado (ADR-020):** usar `POST /api/tickets/{id}/resolve`. El servicio valida autorización, escribe la solución, relee el estado (GLPI 11 auto-resuelve al crear la `ITILSolution`), cierra a `6`, audita `resolve` y emite **un único** evento SignalR `TicketStatusChanged`. Los mensajes de GLPI («El elemento ya está resuelto/cerrado») se traducen a `409 Conflict` en español.
- **Solo el técnico asignado** puede cambiar el estado de un ticket: en caso contrario, `403` con `Solo el técnico asignado puede cambiar el estado de este ticket.`
- **Cierre manual restringido**: enviar `status = 6` sin resolver queda reservado a administradores (`403` para técnicos).
- **Transiciones idempotentes**: confirmar el estado ya vigente (p. ej. `5 → 5`) se permite. Es necesario porque GLPI marca el ticket como `Resuelto` al crear la solución, de modo que la confirmación posterior debe ser aceptada para poder aplicar el cierre automático.
- **Mapeo de errores en la API**: `TicketEndpoints` traduce las reglas a códigos HTTP explícitos — `400` (validación/formato), `403` (prohibido), `404` (no encontrado), `409` (conflicto de estado: ya resuelto/cerrado o doble envío), `422` (regla de dominio / sin solución válida) y `502` (fallo de GLPI). El frontend muestra el `detail` recibido en un *toast* rojo de error.

## Notificaciones en tiempo real (SignalR)

Las operaciones de mutación sobre tickets (`ClaimAsync`, `UpdateStatusAsync`, `SolutionInsertAsync`, `ReopenAsync`) emiten eventos en tiempo real a través del hub `/hubs/tickets` (`ITicketNotificationService`) para notificar a clientes conectados sin depender del ciclo de auto-refresco. Véase [Módulo de Tiempo Real](../realtime/overview.md) y [ADR-018](../../01-architecture/decisions/ADR-018-signalr-realtime.md).

## Reapertura de tickets

La reapertura de tickets cerrados o resueltos permite reactivar el flujo de trabajo sobre el mismo ticket sin fragmentar el historial:

- **Endpoint**: `POST /api/tickets/{id}/reopen`
- **Autorización** (`TicketAccessPolicy.CanReopenAsync`):
  - `Admin`: puede reabrir tanto `Resuelto` (5) como `Cerrado` (6).
  - `Technician` asignado: puede reabrir un ticket `Resuelto` (5).
  - **Un ticket `Cerrado` (6) es terminal para no-administradores**: cualquier otro rol recibe `403 Forbidden` con el mensaje `Solo un administrador puede cambiar el estado de un ticket resuelto o cerrado.`
- **Estados de origen y destino permitidos**:
  - Estado de origen: Exclusivamente `status = 5` (Solved) o `status = 6` (Closed). Si el ticket ya se encuentra abierto (`status ∈ {1, 2, 3, 4}`), devuelve `409 Conflict` ("Ticket ya está abierto").
  - Estado destino: `status = 2` (Assigned).
- **Tratamiento en GLPI**:
  - Se ejecuta `PUT /Ticket/{id}` enviando `status = 2`, `solvedate = null`, `closedate = null` a GLPI REST API.
  - GLPI preserva las soluciones previas en `glpi_itilsolutions` marcándolas con `status = 4` (superseded / histórico).
  - La siguiente resolución del ticket exigirá una nueva solución válida; la solución previa se mantiene como referencia histórica pero no satisface la nueva resolución.
- **Motivo de reapertura (opcional)**:
  - El payload acepta `reason` (hasta 500 caracteres).
  - Si se proporciona un motivo, el backend crea un seguimiento privado en GLPI (`glpi_itilfollowups` con `is_private = 1`), asegurando trazabilidad técnica protegida.
- **Auditoría y eventos**:
  - Se registra entrada en `audit_log` con acción `reopen` y el motivo proporcionado.
  - Se emite notificación SignalR `TicketStatusChanged` con nuevo estado 2.
