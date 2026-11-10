# ADR-017 — Estrategia de escritura contra GLPI: API vs SQL directo

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-017 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


## Estado
Accepted (enmendado por resolución de hallazgo P1 — 2026-11-09)

> [!IMPORTANT]
> **Enmienda de Concurrencia y API Nativa (2026-11-09):**
> La asignación (`Claim`) ha sido migrada de SQL directo a la **API REST oficial de GLPI** (`POST /Ticket/{id}/Ticket_User` y `PUT /Ticket/{id}`), eliminando la omisión de `glpi_logs`, reglas de negocio y notificaciones nativas de GLPI.
> La atomicidad y protección contra condiciones de carrera concurrentes entre réplicas de la API se garantiza mediante un **bloqueo consultivo distribuido de PostgreSQL** (`pg_advisory_lock` en namespace exclusivo de Claim sobre `ticketId`), validando estado y asignación antes de invocar a GLPI.

## Contexto
ADR-002 estableció que las escrituras deben ir vía GLPI REST API para preservar sus reglas de negocio (notificaciones, hooks, plugins, logs). Sin embargo, la implementación inicial mezclaba API REST con SQL directo en endpoints mutables.

## Decisión
Se define una estrategia híbrida explícita por operación:

| Operación | Mecanismo | Justificación |
|---|---|---|
| Cambio de estado del ticket | GLPI REST (`PUT /Ticket/{id}`) | Sin concurrencia crítica; GLPI maneja las reglas y transiciones |
| Creación de solución | GLPI REST (`POST /ITILSolution`) | Sin concurrencia crítica; GLPI maneja validación, autor y ciclo de vida de la solución |
| **Claim (asignación)** | **GLPI REST (`POST /Ticket/{id}/Ticket_User` + `PUT /Ticket/{id}`)** | **Protegido con `pg_advisory_lock` en PostgreSQL. Preserva `glpi_logs`, notificaciones nativas, reglas de negocio y SLA de GLPI.** |
| Lecturas (listas, detalle, dashboard) | SQL directo (Dapper) | Rendimiento; no hay reglas de negocio a preservar en lecturas |

## Trade-offs

### Beneficios de migrar solutions a API
- GLPI ejecuta sus reglas de negocio nativas para soluciones.
- Se preservan notificaciones a usuarios, hooks y plugins de GLPI asociados a la resolución.
- Consistencia total con el modelo de datos de GLPI sin acoplar campos internos en base de datos.

### Trade-offs del claim en SQL
- GLPI no ejecuta sus reglas automáticas durante el claim.
- Notificaciones internas de GLPI al técnico asignado no se emiten de manera nativa por su motor de eventos.
- Los logs históricos nativos de GLPI no registran el evento de asignación.

### Mitigaciones del claim en SQL
- Nuestra propia auditoría (`audit_log` en PostgreSQL) registra el evento `claim` con ID de usuario, timestamp y ticket.
- El estado del ticket y la relación técnico-ticket se actualizan atómicamente en la base de datos de GLPI (`glpi_tickets` y `glpi_tickets_users`).
- Si en el futuro GLPI agrega un endpoint con semántica atómica condicional (compare-and-swap), se evaluará la migración.

## Revisión
Revisar esta decisión si:
- GLPI agrega un endpoint REST con garantía de atomicidad para asignación de tickets.
- El negocio requiere notificaciones nativas de GLPI en el claim.
- Se detecta una condición de carrera que SQL no logre prevenir.

## Referencias
- ADR-002 (API como mecanismo de escritura)
- ADR-006 (Solución obligatoria para resolver)
- ADR-009 (Sistema gestor, no creador)
