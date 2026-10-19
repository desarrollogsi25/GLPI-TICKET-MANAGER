# Registro de Cambios (Changelog)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-14-CHANGELOG | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

Todas las modificaciones notables de este proyecto están documentadas en este archivo según el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y siguen [Conventional Commits](https://www.conventionalcommits.org/).

## [1.2.0] - 2026-10-19
### Corregido
- **Concurrencia en Reclamos:** Ajuste en el orden de validación en `TicketAccessPolicy` para priorizar el estado del ticket y permitir que reclamos simultáneos devuelvan HTTP 409 Conflict en lugar de 403 Forbidden (PR #8).
- **Control Documental:** Estandarización de la jerarquía de carpetas en `docs/` y adición de encabezados ISO 9001 / ISO 27001 en todas las especificaciones técnicas (H-18).

## [1.1.0] - 2026-10-18
### Añadido
- **Reapertura de Tickets (ADR-019):** Endpoint `POST /api/tickets/{id}/reopen` y modal de usuario para reactivar tickets resueltos o cerrados conservando el historial.
- **Privacidad de Seguimientos (H-08):** Filtrado seguro en backend para que notas privadas solo sean accesibles por Administradores, Supervisores del grupo y el Técnico asignado.
- **Animaciones Fluidas en Kanban:** Transiciones fluidas tipo spring en desktop y pestañas táctiles con gestos en dispositivos móviles.

## [1.0.0] - 2026-10-15
### Añadido
- **Tablero Kanban Interactivo:** Vistas por columnas (`Cola del grupo`, `Mis tickets`, `En progreso`, `Pendiente`, `Resuelto`).
- **Autenticación JWT:** Emisión y revocación de tokens JWT respaldados por la base de datos de GLPI y PostgreSQL.
- **Sincronización en Tiempo Real:** Canal SignalR para actualización de eventos de tickets en vivo.
- **Validación de Soluciones (H-24):** Rechazo de contenidos vacíos o con espacios al resolver incidencias.
- **Filtro de Registros Eliminados (H-25):** Exclusión estricta de registros con `is_deleted = 1`.
