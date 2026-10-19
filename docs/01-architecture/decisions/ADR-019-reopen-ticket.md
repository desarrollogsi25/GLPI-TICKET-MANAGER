# ADR-019 — Política y mecanismo de reapertura de tickets

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-019 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


## Estado
Accepted

## Contexto
En la operativa diaria de soporte y helpdesk, incidencias resueltas (`status = 5`) o cerradas (`status = 6`) pueden reaparecer o requerir trabajo adicional si el usuario reporta que la solución no fue efectiva o si una falla intermitente se reproduce poco después de su cierre.

Existían dos caminos arquitectónicos ante esta necesidad:
1. Reabrir el mismo ticket manteniendo la continuidad de la conversación y el historial técnico.
2. Forzar la apertura de un ticket completamente nuevo vinculado al anterior.

## Decisión
Se decide implementar la **reapertura directa sobre el mismo ticket** existente (`POST /api/tickets/{id}/reopen`), en conformidad con la decisión de negocio confirmada:

1. **Endpoint y Semántica**:
   - `POST /api/tickets/{id}/reopen` con payload opcional `{ "reason": string? }` (máximo 500 caracteres).
2. **Autorización (`ITicketAccessPolicy.CanReopenAsync`)**:
   - `Admin`: Puede reabrir cualquier ticket.
   - `Supervisor`: Puede reabrir tickets pertenecientes a sus grupos asignados.
   - `Technician`: Puede reabrir únicamente si es el técnico asignado (`Assignee`) del ticket.
   - Usuarios solicitantes u observadores no tienen autorización para reabrir por este endpoint.
3. **Validación de Estados**:
   - Solo tickets en estado resuelto (`status = 5`) o cerrado (`status = 6`) pueden ser reabiertos.
   - Si el ticket ya se encuentra en curso o sin resolver (`status ∈ {1, 2, 3, 4}`), se rechaza con `409 Conflict` ("Ticket ya está abierto").
4. **Mutación en GLPI REST API**:
   - Se envía `PUT /Ticket/{id}` con `{ "input": { "status": 2, "solvedate": null, "closedate": null } }`.
   - El ticket regresa a estado `Assigned` (2) y pierde sus fechas de resolución y cierre.
5. **Historial de Soluciones Previas**:
   - Las soluciones registradas con anterioridad en `glpi_itilsolutions` son preservadas intactas por GLPI, marcando su estado como cerrado/histórico (`status = 4`).
   - El guard de resolución del sistema (`PATCH /api/tickets/{id}/status { "status": 5 }`) ignora soluciones cerradas históricas (`WHERE status <> 4`), exigiendo una **nueva solución escrita** para que el ticket pueda volver a marcarse como resuelto.
6. **Trazabilidad y Motivo**:
   - Si se especifica un motivo en `reason`, se registra automáticamente un seguimiento privado (`is_private = 1`) en `glpi_itilfollowups`.
   - Se añade una entrada en `audit_log` con acción `reopen`.
   - Se emite una notificación en tiempo real SignalR (`TicketStatusChanged`).

## Alternativas Rechazadas

1. **Creación obligatoria de un ticket nuevo**:
   - *Motivo de rechazo*: Fragmenta la conversación, dispersa el historial de comentarios y soluciones previas, duplica métricas y distorsiona el seguimiento de incidentes recurrentes en auditorías y SLA.

2. **Permitir reapertura a cualquier técnico sin asignación previa**:
   - *Motivo de rechazo*: Violaría el principio de responsabilidad sobre tickets ajenos y podría interferir con el trabajo de otros equipos.

## Consecuencias
- **Persistencia**: La llamada a GLPI REST requiere enviar explícitamente `null` en `solvedate` y `closedate`, para lo cual el cliente serializa estos campos sin omitirlos por la condición `WhenWritingNull`.
- **Integridad**: Se evita que soluciones antiguas satisfagan la siguiente resolución sin nuevo análisis técnico.
- **Frontend**: La interfaz muestra el botón "Reabrir" únicamente a técnicos autorizados en tickets en estado Solved o Closed, desplegando un diálogo de confirmación con motivo opcional.

## Referencias
- Confirmación de decisión de negocio.
- ADR-002 (Integración API y modelo de escritura GLPI)
- ADR-006 (Autoasignación y solución obligatoria)
- ADR-017 (Estrategia de escrituras híbridas)
- ADR-018 (Notificaciones en tiempo real mediante SignalR)
- H-08 (Política de visibilidad de followups privados)
