# ADR-018 — Notificaciones en tiempo real mediante SignalR

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-018 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


## Estado
Accepted

## Contexto
Actualmente, la sincronización de la cola de tickets y el tablero Kanban depende de un ciclo de auto-refresco periódico en el cliente (cada 30 segundos) o de la navegación manual entre pantallas. Cuando múltiples técnicos trabajan en una cola concurrida de call center:
- Un técnico puede intentar autoasignarse un ticket que otro compañero ya reclamó segundos antes (generando un conflicto 409).
- Las resoluciones y cambios de estado no se reflejan instantáneamente en los monitores o paneles de supervisión.

## Decisión
Adoptar **ASP.NET Core SignalR** con WebSockets para la capa de notificaciones en tiempo real:

1. **Hub centralizado**: `/hubs/tickets` expuesto en `GlpiTicketManager.Api`.
2. **Autenticación**: JWT transmitido mediante query string (`?access_token=...`) durante el handshake HTTP previo a la actualización a WebSocket.
3. **Canales de suscripción lógicos**:
   - `user-{userId}`: Para eventos dirigidos al técnico.
   - `group-{groupId}`: Para eventos de tickets en colas grupales, con validación de membresía vía `ITicketAccessPolicy`.
4. **Política de emisión desacoplada (Best-effort)**: La emisión de eventos se produce al finalizar con éxito las operaciones transaccionales (`ClaimAsync`, `UpdateStatusAsync`, `SolutionInsertAsync`). Si la notificación falla por indisponibilidad de clientes o red, se registra una advertencia en Serilog (`LogWarning`), pero la operación de negocio nunca se revierte.

## Alternativas Rechazadas

1. **Server-Sent Events (SSE)**:
   - *Motivo de rechazo*: Es unidireccional (servidor a cliente). No permite que el cliente gestione dinámicamente suscripciones a grupos de tickets sin llamadas HTTP adicionales por separado.
2. **Short Polling agresivo (cada 3-5 segundos)**:
   - *Motivo de rechazo*: Incrementaría masivamente la carga de lectura sobre MariaDB y saturaría las cuotas del rate limiting (`expensive`), además de consumir ancho de banda innecesario en conexiones móviles.
3. **Long Polling sin WebSockets**:
   - *Motivo de rechazo*: Introduce mayor latencia y consumo de hilos en el servidor en comparación con un socket TCP persistente.

## Consecuencias
- **Infraestructura**: Tanto el proxy de desarrollo de Vite como los proxies de producción (Nginx) deben habilitar la actualización a WebSockets (`Upgrade` / `Connection: Upgrade`).
- **Arquitectura**: Se introduce la abstracción `ITicketNotificationService` en la capa de aplicación, implementada en la capa API con `IHubContext<TicketHub>`.
- **Evolución gradual**: Bloque 8a implementa el backend y tests de integración; Bloque 8b conectará los hooks del frontend con TanStack Query.

## Referencias
- ADR-002 (Integración API y modelo de escritura)
- ADR-006 (Autoasignación y solución obligatoria)
- ADR-017 (Estrategia de escrituras híbridas)
