# Módulo de Tiempo Real (SignalR Real-Time Notifications)

## Descripción
El módulo de tiempo real proporciona notificaciones instantáneas bidireccionales entre el backend .NET y los clientes frontend mediante **ASP.NET Core SignalR** sobre WebSockets.

Permite que cuando un técnico reclama un ticket, cambia su estado o agrega una solución, todos los demás técnicos conectados en las colas de grupo o vistas Kanban reciban la actualización de inmediato sin esperar al ciclo de auto-refresco periódico.

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
- **Limpieza de recursos**: Al desmontar o cerrar sesión, cancela la conexión de forma segura (`connection.stop()`).

### 2. Mapeo de Eventos a Invalidación de TanStack Query
Cuando el hub recibe un evento del servidor, invalida selectivamente las claves de caché para desencadenar un refetch silencioso en la UI:

| Evento | Queries Invalidadas | Efecto en la Interfaz |
|---|---|---|
| `TicketClaimed` | `queryKeys.tickets.byGroupQueue(groupId)`, `queryKeys.tickets.all`, `['dashboard']` | El ticket desaparece de la cola del grupo para otros técnicos sin refrescar la página. |
| `TicketStatusChanged` | `queryKeys.tickets.detail(ticketId)`, `queryKeys.tickets.all`, `['dashboard']` | Actualiza la columna correspondiente en el Kanban y el detalle del ticket. |
| `SolutionAdded` | `queryKeys.tickets.detail(ticketId)` | Carga la solución recién registrada en la vista del ticket. |

### 3. Indicador Visual: `ConnectionIndicator`
Ubicado en `frontend/src/components/layout/ConnectionIndicator.tsx`:
- Renderizado en el footer del `AppSidebar` (desktop) y en el header móvil (`AppLayout`).
- **Estados**:
  - `connected`: Dot verde pulsante (`bg-emerald-500`) con tooltip *"Conectado en tiempo real"*.
  - `connecting`: Dot ámbar (`bg-amber-500`) con tooltip *"Conectando al servidor..."*.
  - `disconnected`: Dot rojo (`bg-rose-500`) con tooltip *"Desconectado de tiempo real"*.
- **Atributos de accesibilidad y testing**: `data-testid="connection-indicator"` y `data-state="connected|connecting|disconnected"`.

