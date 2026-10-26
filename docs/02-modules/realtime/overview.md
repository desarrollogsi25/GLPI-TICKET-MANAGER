# Módulo de Tiempo Real (SignalR Real-Time Notifications)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-02-MOD-REALTIME | **Versión:** 1.1.0 | **Fecha:** 2026-10-22 | **Autor:** GLPI Ticket Manager Team

> **Enmienda 1.1.0 (2026-10-22 — BUG-032).** Se documenta el modelo de polling
> condicional (SignalR primario + fallback de 30 s sólo con el hub caído), el estado
> `reconnecting`, la re-suscripción al grupo tras reconectar y el tratamiento del
> `429` con `Retry-After` en el cliente.


## Descripción
El módulo de tiempo real proporciona notificaciones instantáneas bidireccionales entre el backend .NET y los clientes frontend mediante **ASP.NET Core SignalR** sobre WebSockets.

Permite que cuando un técnico reclama un ticket, cambia su estado o agrega una solución, todos los demás técnicos conectados en las colas de grupo o vistas Kanban reciban la actualización de inmediato, sin esperar al ciclo de auto-refresco periódico.

El canal en tiempo real es **primario**: mientras la conexión está activa, el cliente
**no consulta** la cola de forma periódica. Existe un **fallback de 30 s** que sólo se
activa cuando la conexión con el hub está caída (ver §2 «Modelo de polling»).

---

## Hub Principal: `/hubs/tickets`

- **Ruta**: `/hubs/tickets`
- **Transporte preferido**: WebSockets (con fallback automático gestionado por SignalR).
- **Autenticación**: JWT emitido por el API. Debido a que el handshake inicial de WebSockets en navegadores estándar no permite adjuntar headers `Authorization: Bearer`, el token se transmite en el query string:
  ```
  ws://localhost:5173/hubs/tickets?access_token=<JWT_TOKEN>
  ```
- **Identidad de Usuario**: SignalR mapea automáticamente el claim `ClaimTypes.NameIdentifier` (añadido en `JwtTokenService`) a `Context.UserIdentifier`.

---

## Grupos de Suscripción

Al conectar, el Hub organiza a los clientes en grupos lógicos:

| Grupo | Criterio de Membresía | Propósito |
|---|---|---|
| `user-{userId}` | Automático en `OnConnectedAsync` | Notificaciones directas al usuario (p. ej. si le asignan un ticket). |
| `group-{groupId}` | Dinámico mediante invocación de `SubscribeToGroup(groupId)` | Notificaciones de actividad sobre la cola de un grupo de técnicos. Requiere autorización (`ITicketAccessPolicy.CanViewGroupQueueAsync`). |

### Métodos del Hub invocables por el cliente

- `SubscribeToGroup(int groupId)`: Valida permisos del usuario y lo añade al canal `group-{groupId}`.
- `UnsubscribeFromGroup(int groupId)`: Remueve al cliente del canal `group-{groupId}`.

---

## Eventos Emitidos por el Backend

Las notificaciones son emitidas de forma desacoplada y con política *best-effort* (si la emisión falla, se registra en Serilog con `LogWarning` sin abortar la operación de negocio).

### 1. `TicketClaimed`
Emitido a los clientes del grupo (`group-{groupId}`):
```json
{
  "ticketId": 11,
  "assignedUserId": 7,
  "groupId": 1,
  "timestamp": "2026-10-16T19:30:00Z"
}
```

### 2. `TicketStatusChanged`
Emitido a todos los clientes (`Clients.All`):
```json
{
  "ticketId": 11,
  "newStatus": 2,
  "assigneeId": 7,
  "timestamp": "2026-10-16T19:30:00Z"
}
```

### 3. `SolutionAdded`
Emitido a todos los clientes (`Clients.All`):
```json
{
  "ticketId": 11,
  "authorUserId": 7,
  "timestamp": "2026-10-16T19:30:00Z"
}
```

---

## Integración con Frontend (Bloque 8b)

### 1. Hook `useRealtimeTicketHub`
Ubicado en `frontend/src/hooks/useRealtimeTicketHub.ts`, gestiona el ciclo de vida de la conexión SignalR con el backend:
- **Autenticación condicional**: Conecta únicamente si el usuario cuenta con un token JWT válido (`useAuthStore`).
- **Reconexión con backoff exponencial**:
  ```typescript
  delays: [1000, 2000, 4000, 8000, 16000, 30000] // 1s a 30s max
  ```
- **Estado de conexión compartido**: el hook expone `useRealtimeConnectionState()`, que devuelve el estado actual a cualquier componente (el polling condicional lo consume).
- **Limpieza de recursos**: Al desmontar o cerrar sesión, cancela la conexión de forma segura (`connection.stop()`).

### 1.1 Estados de la conexión

```typescript
export type ConnectionState = 'disconnected' | 'connecting' | 'reconnecting' | 'connected'
```

| Estado | Significado | Consecuencia en el polling |
|---|---|---|
| `connected` | El hub está conectado y el usuario suscrito al grupo. | **No hay polling**: SignalR es el canal primario. |
| `reconnecting` | Se perdió la conexión y SignalR está reintentando con backoff. | Entra el **fallback** de 30 s. |
| `connecting` | Conexión inicial o reconexión en curso. | Entra el **fallback** de 30 s. |
| `disconnected` | Sin conexión (sesión cerrada, logout o error fatal). | No se consulta nada. |

> [!IMPORTANT]
> **`reconnecting` es un estado propio** (BUG-032). Antes, una reconexión se reportaba como
> `connecting`, indistinguible del arranque en frío. `onreconnecting` marca
> `reconnecting` y `onreconnected` vuelve a `connected`.

### 1.2 Re-suscripción al grupo tras reconectar

Al reconectar, el cliente **pierde la pertenencia al grupo** del hub: la suscripción a
`group-{groupId}` no sobrevive a la caída de la conexión. Por eso `onreconnected`:

1. Vuelve a establecer la conexión (`connection.start()`).
2. Vuelve a invocar `SubscribeToGroup(groupId)`.
3. Invalida `byGroupQueue` y `tickets.all` para recuperar el estado missed durante el corte.

Sin este paso, el tablero queda «conectado» pero mudo: no llegan eventos y no hay
polling que compense la pérdida.

### 2. Modelo de polling: SignalR primario con fallback condicional
Ubicado en `frontend/src/hooks/useTickets.ts`, `useGroupQueueQuery(groupId, options)`:
la cadencia de polling vive **en un único sitio** y es **condicional** al estado de la
conexión.

```typescript
export const QUEUE_FALLBACK_POLL_MS = 30_000

refetchInterval: () => {
  if (!sessionValid) return false
  if (connectionState === 'connected') return false   // SignalR es el canal primario
  if (fallbackIntervalMs === false) return false
  return fallbackIntervalMs                           // 30 s sólo si el hub está caído
},
refetchIntervalInBackground: false,
```

| Escenario | Peticiones a `GET /tickets/by-group` | Sustento |
|---|---:|---|
| Hub conectado | **0 periódicas** (sólo la carga inicial y las invalidaciones por evento) | Medido: 1 petición en 180 s |
| Hub caído (degradado) | 1 cada 30 s ⇒ **≈ 2/min** | Medido: 4 peticiones en 100 s (separaciones de ~30,2 s) |
| Sesión caducada | 0 | `useSessionValidity` desactiva la query |

> [!IMPORTANT]
> **Presupuesto de llamadas (BUG-032).** `GET /api/tickets/by-group` está bajo la
> política de rate limiting `Expensive`, cuya cuota de **producción** es de
> **20 peticiones/minuto por usuario** (20 tokens, 1 token cada 3 s). El diseño
> anterior pedía la cola **cada 1,5 s (40/min)**, el doble de lo sostenible: el
> servidor respondía `429` a un tercio de las peticiones y el tablero dejaba de
> refrescarse. La cuota de producción **no se modificó**; se corrigió el cliente.
> Cualquier endpoint bajo esta política debe revisarse contra el presupuesto de
> llamadas del cliente antes de añadirse.

### 3. Mapeo de Eventos a Invalidación de TanStack Query
Cuando el hub recibe un evento del servidor, invalida selectivamente las claves de caché para desencadenar un refetch silencioso en la UI:

| Evento | Queries Invalidadas | Efecto en la Interfaz |
|---|---|---|
| `TicketClaimed` | `queryKeys.tickets.byGroupQueue(groupId)`, `queryKeys.tickets.all`, `['dashboard']` | El ticket desaparece de la cola del grupo para otros técnicos sin refrescar la página. |
| `TicketStatusChanged` | `queryKeys.tickets.detail(ticketId)`, `queryKeys.tickets.all`, `['dashboard']` | Actualiza la columna correspondiente en el Kanban y el detalle del ticket. |
| `SolutionAdded` | `queryKeys.tickets.detail(ticketId)` | Carga la solución recién registrada en la vista del ticket. |

> El evento `TicketStatusChanged` publica **el estado que GLPI confirma** (se relee de
> GLPI tras la escritura), no el estado que el API quiso escribir. Si GLPI rechaza la
> transición, el evento refleja el estado real.

### 4. Indicador Visual: `ConnectionIndicator`
Ubicado en `frontend/src/components/layout/ConnectionIndicator.tsx`:
- Renderizado en el footer del `AppSidebar` (desktop) y en el header móvil (`AppLayout`).
- **Estados**:
  - `connected`: Dot verde pulsante (`bg-emerald-500`) con tooltip *"Conectado en tiempo real"*.
  - `connecting`: Dot ámbar (`bg-amber-500`) con tooltip *"Conectando al servidor..."*.
  - `reconnecting`: Dot ámbar con tooltip *"Reconectando al servidor..."*.
  - `disconnected`: Dot rojo (`bg-rose-500`) con tooltip *"Desconectado de tiempo real"*.
- **Atributos de accesibilidad y testing**: `data-testid="connection-indicator"` y `data-state="connected|connecting|reconnecting|disconnected"`.

### 5. Tratamiento del `429` (rate limiting) en el cliente

| Capa | Comportamiento |
|---|---|
| **API** (`Program.cs`, `options.OnRejected`) | El `429` responde con la cabecera `Retry-After` y un cuerpo `ProblemDetails` (RFC 7807) con `title`, `detail` y `retryAfterSeconds`. La **cuota no cambia**: el header sólo informa de cuándo reintentar. |
| **`apiClient.ts`** | Detecta el `429`, **no** lo trata como error de autenticación, lee `Retry-After` y muestra un aviso al usuario **una sola vez cada 10 s** (evita el
spam de toasts cuando la cola está saturada). |
| **`main.tsx`** (`QueryClient`) | `retry: shouldRetry`: **no reintenta** ante `4xx` (incluido `429`). Un `429` no se arregla reintentando más rápido; reintentar consume tokens y empeora la saturación. |
| **`errors.ts`** | `429` forma parte del `STATUS_FALLBACK`: se devuelve un mensaje de negocio en lugar de una excepción técnica. |
| **`useSessionValidity` / `ProtectedRoute`** | Detectan el token caducado y redirigen al login en lugar de insistir con peticiones que serían rechazadas. |

### 6. Cierre de sesión: el socket se cierra antes de revocar el token

El cierre de sesión es una operación **con orden**, y ese orden importa:

```typescript
// frontend/src/lib/api/auth.ts
export async function logout(): Promise<void> {
  await stopRealtimeConnection()      // 1. cerrar el socket
  await apiClient.post('/auth/logout') // 2. revocar el token
}
```

Si el token se revoca primero, cualquier *upgrade* de WebSocket que siga en vuelo
recibe `401` y el navegador lo reporta en consola como
`HTTP Authentication failed; no valid credentials available` — un error que el usuario
no ha provocado (el cliente se está desvalidando a sí mismo).

`stopRealtimeConnection()` (`frontend/src/hooks/useRealtimeTicketHub.ts`) **espera a que
el handshake pendiente se resuelva** antes de cerrar el socket: abortar un WebSocket a
mitad de *upgrade* produce otro mensaje de consola
(«WebSocket is closed before the connection was established») y no elimina el ruido.
Con el orden correcto, el servidor nunca llega a ver un token revocado.

> [!NOTE]
> La condición de carrera **preexistía** a este arreglo (línea base medida en `HEAD`:
> 2 de 6 ejecuciones fallaban). El diseño «SignalR primario» la volvió determinista
> porque multiplica por diez la dependencia del socket en el flujo de cierre de
> sesión. Ver [BUG-032 §6.4](../../11-incidents/BUG-032.md).

### 7. Escalado horizontal (ADR-021)

La implementación actual asume **una sola instancia** del backend. Si el despliegue
supera una instancia, SignalR necesita un backplane de Redis; sin él, los eventos
emitidos en una instancia no llegan a los clientes conectados a otra. La decisión
está documentada en [ADR-021 — Escalado horizontal de SignalR](../../01-architecture/decisions/ADR-021-signalr-scale-out.md)
y es **bloqueante** para el escalado: no se puede escalar sin implementar el
backplane.

