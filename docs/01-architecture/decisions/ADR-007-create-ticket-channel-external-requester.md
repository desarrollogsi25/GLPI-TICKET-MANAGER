# ADR-007 - Canal y solicitante interno/externo en creación de tickets

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-007 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


> ⚠️ **Superseded by ADR-009 (2026-10-14)**

## Estado
Superseded by ADR-009 (2026-10-14). Anteriormente Aceptado.

## Decisiones
- El DTO `CreateTicketRequest` incorpora `RequestTypeId`, `ExternalRequesterEmail`, `ExternalRequesterName`,
  `ExternalRequesterPhone`, `ExternalRequesterCompany`.
- El canal se propaga como `requesttypes_id` al input del Ticket de GLPI.
- Solicitante interno: se envía `_users_id_requester` (GLPI crea el link type=1).
- Solicitante externo: en frontend se arma el content con formato ADR-005
  ("Llamante: ... · Tel: ... · Empresa: ...") y, en el backend, tras crear el Ticket se crea
  el vínculo `Ticket_User` (type=1, users_id=0, alternative_email=<email>) vía GLPI REST.

## Alcance
- Sin nuevas dependencias frontend. Sin cambios de esquema DB.
- El frontend mantiene la lógica de armado del content (ADR-005).
- La corrección de los canales reales (requesttypes_id != 1 en BD) queda para un ajuste posterior.