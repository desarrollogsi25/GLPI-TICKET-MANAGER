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

## Integración con Frontend (Plan Bloque 8b)
- Cliente instalado: `@microsoft/signalr`.
- Configuración de proxy en Vite: `/hubs` con `ws: true`.
- En el Bloque 8b se implementará el hook `useTicketNotifications` para invalidar consultas de React Query (`queryKeys.tickets.all`, `queryKeys.tickets.byGroupQueue`) al recibir eventos.
