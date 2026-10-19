# Integración de Tiempo Real con SignalR

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-05-INT-SIGNALR | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Propósito

Describe la arquitectura del hub de comunicación bidireccional en tiempo real basado en ASP.NET Core SignalR (`/hubs/tickets`) y su consumo en el frontend.

## 2. Eventos del Hub

| Evento | Payload | Disparador | Acción del Cliente |
|---|---|---|---|
| `TicketClaimed` | `{ ticketId, assignedUserId, groupId, timestamp }` | Un técnico reclama un ticket de la cola de grupo. | Invalida query de cola y listas de tickets; resalta tarjeta. |
| `TicketStatusChanged` | `{ ticketId, newStatus, assigneeId, timestamp }` | Se modifica el estado o se reabre un ticket. | Invalida detalle y listas; anima la tarjeta entre columnas. |
| `SolutionAdded` | `{ ticketId, authorUserId, timestamp }` | Se registra una solución en un ticket. | Invalida el detalle del ticket para actualizar vista de resolución. |

## 3. Autenticación y Seguridad

- El hub `/hubs/tickets` exige autenticación JWT válida mediante `[Authorize]`.
- El token JWT se envía mediante el `accessTokenFactory` en la negociación de WebSocket.
- No se transmiten datos sensibles en los payloads de eventos; únicamente identificadores y marcas temporales.

## 4. Gestión de Conexión en Frontend

- Hook `useRealtimeTicketHub`: Implementa reconexión automática con backoff exponencial (1s, 2s, 4s, 8s, 16s, 30s) y patrón de conexión compartida por referencia para evitar duplicación de sockets.
- Suscripción contextual a grupos de trabajo mediante el método de hub `SubscribeToGroup(groupId)`.
