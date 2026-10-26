# Diagnóstico y Resolución de Problemas GLPI (Troubleshooting)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-10-KB-TROUBLESHOOTING | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Problemas Frecuentes y Diagnóstico

### 1.1 Error de Autenticación o Sesión Expirada en API GLPI
- **Síntoma:** Endpoints retornan `ERROR_SESSION_TOKEN_INVALID` o HTTP 401.
- **Causa:** El session token generado durante el login expiró por inactividad en GLPI o los contenedores se reiniciaron.
- **Solución:**
  1. El cliente `GlpiApiClient` reintenta automáticamente la inicialización de sesión con `App-Token` y credenciales de servicio.
  2. Verificar que `GLPI_APP_TOKEN` y `GLPI_USER_TOKEN` estén vigentes en las variables de entorno de `glpi-api`.
  3. Ejecutar `docker logs glpi-api --tail 100` para inspeccionar la traza exacta de comunicación.

### 1.2 Bloqueo por Concurrencia en Reclamo de Ticket (HTTP 409 Conflict)
- **Síntoma:** Al presionar "Asignarme", el usuario recibe un diálogo de conflicto (409).
- **Causa Esperada:** Dos técnicos intentaron reclamar el mismo ticket simultáneamente. El primer técnico tomó la asignación atómica; el segundo recibe HTTP 409 Conflict.
- **Acción:** No requiere intervención técnica. El tablero Kanban actualizará la interfaz en tiempo real vía SignalR removiendo el ticket de la columna o mostrando al nuevo técnico asignado.

### 1.3 Desconexión de SignalR (Fallback a Polling)
- **Síntoma:** El indicador de conexión muestra reconexión periódica.
- **Causa:** Red inestable o proxy intermedio cerrando WebSockets prolongados.
- **Solución:**
  1. El cliente frontend implementa reconexión exponencial automática (`withAutomaticReconnect`).
  2. Si WebSockets no está disponible, SignalR degrada limpiamente a Server-Sent Events o Long Polling.
  3. Verificar que el reverse proxy (Nginx/Traefik) mantenga headers `Upgrade: websocket` y `Connection: Upgrade`.

### 1.4 Inconsistencia de Datos en Caché
- **Síntoma:** La lista de tickets no refleja un cambio efectuado directamente en la base de datos de GLPI.
- **Solución:** Invocar el endpoint de invalidación de caché o reiniciar el pod/contenedor de la API (`docker restart glpi-api`).

### 1.5 No se puede resolver un ticket con solución corta (BUG-031)
- **Síntoma:** Al escribir `OK` o una solución breve y pulsar «Resolver», el sistema responde `422 "Ticket no puede marcarse como resuelto sin solución escrita"`, o tras un reintento `400 "El elemento ya está resuelto"`.
- **Causa:** Corregida en H-31 / [ADR-020](../01-architecture/decisions/ADR-020-resolucion-atomic-de-ticket.md). El guard exigía al menos 10 caracteres y GLPI 11 marca el ticket como Resuelto al crear la `ITILSolution`.
- **Solución:** Actualizar a la versión con la corrección. Usar el botón **«Resolver»** del Kanban (flujo atómico `POST /api/tickets/{id}/resolve`). Las soluciones cortas ya son válidas y los errores se traducen a `409 Conflict` en español.
- **Referencias:** [BUG-031](../11-incidents/BUG-031-resolucion-ticket-solucion-corta.md) · [KB — Resolución de tickets](resolucion-de-tickets.md)
