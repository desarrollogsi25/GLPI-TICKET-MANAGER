# ADR-018 — Notificaciones en tiempo real mediante SignalR

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-018 | **Versión:** 1.1.0 | **Fecha:** 2026-10-22 | **Autor:** GLPI Ticket Manager Team


## Estado
Accepted (enmendado por ADR-018-bis — 2026-10-22, ver §Enmienda)

- **Enmienda:** ADR-018-bis — Señal como canal primario y presupuesto de llamadas
- **Incidencia relacionada:** [BUG-032](../../11-incidents/BUG-032.md)

## Enmienda 018-bis (2026-10-22)

> [!IMPORTANT]
> **La decisión original nombraba el polling como mecanismo de sincronización («un ciclo
> de auto-refresco periódico en el cliente (cada 30 segundos)»).** La implementación
> posterior convirtió ese polling en **incondicional**, y además el cliente pidió la cola
> **cada 1,5 s**, el doble de lo que la política de rate limiting `Expensive` permite en
> producción (20 peticiones/minuto). El servidor respondía `429` a un tercio de las
> peticiones y el tablero dejaba de refrescarse.
>
> **La cuota de producción no se modificó**: la regla de negocio es «20 peticiones por
> minuto y usuario» y el defecto estaba en el cliente.

Esta enmienda fija el **contrato de sincronización** que debe cumplir el cliente:

1. **SignalR es el canal primario.** Mientras la conexión con el hub está
   `connected`, el cliente **no** consulta periódicamente los endpoints de lectura.
   Las actualizaciones llegan por evento (`TicketClaimed`, `TicketStatusChanged`,
   `SolutionAdded`) y disparan invalidaciones selectivas de TanStack Query.
2. **El polling es un fallback, y es condicional.** La cadencia de polling vive en un
   único sitio (`useGroupQueueQuery`) y su `refetchInterval` devuelve `false` mientras
   la conexión esté activa. Sólo cuando el hub está caído entra el fallback de **30 s**
   (≈ 2 peticiones/minuto), muy por debajo de la cuota.
3. **Un solo temporizador.** No puede existir un segundo temporizador de polling
   fuera de la configuración de la librería: el Kanban no debe tener su propio
   `setInterval` llamando a `refetch()`.
4. **Presupuesto de llamadas.** Todo endpoint de lectura bajo la política `Expensive`
   tiene un presupuesto de llamadas por minuto y **no se puede superar desde el
   cliente**. Si un endpoint nuevo entra en esa política, se revisa el número de
   llamadas que el cliente le hace por minuto.
5. **El `429` es accionable.** La respuesta de rate limiting incluye `Retry-After` y
   un cuerpo `ProblemDetails`; el cliente **no reintenta** ante `4xx` (reintentar
   consume tokens y no mejora nada).
6. **Reconectar no es lo mismo que estar suscrito.** Tras `onreconnected` el cliente
   debe re-suscribirse a su grupo e invalidar las consultas afectadas: si no, el
   tablero queda «conectado» pero mudo.

Verificación asociada: `frontend/tests/e2e/kanban-polling.spec.ts` falla si el Kanban
vuelve a consultar periódicamente la cola con el hub conectado.

## Contexto
Inicialmente, la sincronización de la cola de tickets y el tablero Kanban depende de un ciclo de auto-refresco periódico en el cliente (cada 30 segundos) o de la navegación manual entre pantallas. Cuando múltiples técnicos trabajan en una cola concurrida de call center:
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
- **Contrato de polling (enmienda 018-bis)**: el frontend debe mantener **una sola** cadencia de polling, condicional al estado de la conexión, y el presupuesto de llamadas de los endpoints bajo la política `Expensive` es un límite de diseño, no un detalle de implementación. Un `429` en producción es un defecto del cliente salvo que la cuota de negocio se modifique explícitamente.

## Referencias
- ADR-002 (Integración API y modelo de escritura)
- ADR-006 (Autoasignación y solución obligatoria)
- ADR-017 (Estrategia de escrituras híbridas)
- [BUG-032 — Inestabilidad 429 en el Kanban y confirmación de estado contra GLPI](../../11-incidents/BUG-032.md)
- [Módulo de tiempo real](../../02-modules/realtime/overview.md)
- [Estrategia de testing](../../13-testing/strategy.md)
