# Preguntas Frecuentes (FAQ)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-10-KB-FAQ | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Preguntas Generales

### ¿Por qué existe esta aplicación si ya tenemos GLPI?
GLPI Ticket Manager proporciona una interfaz moderna, reactiva y especializada para call centers y mesas de ayuda de alta rotación. Elimina la sobrecarga de navegación tradicional de GLPI ofreciendo un tablero Kanban con transiciones fluidas, soporte móvil optimizado con gestos y sincronización en tiempo real vía SignalR.

### ¿Se modifican los datos en GLPI directamente?
Sí. El sistema utiliza GLPI como fuente de verdad mediante su API REST y consultas de alto rendimiento en lectura directa a PostgreSQL, garantizando integridad bidireccional y consistencia total con los registros de GLPI.

## 2. Operaciones y Flujo de Trabajo

### ¿Qué ocurre si un ticket cerrado vuelve a requerir atención?
A través de la funcionalidad de Reapertura (ADR-019), un técnico o supervisor puede reactivar el mismo ticket (manteniendo su historial y trazabilidad) en lugar de crear un ticket duplicado.

### ¿Quién puede ver un seguimiento privado?
Solo los administradores, los supervisores asignados a los grupos del ticket y el técnico específicamente asignado. Los solicitantes externos y observadores nunca tienen acceso a notas privadas (auditoría H-08).

### ¿Cómo funciona la asignación concurrente?
El sistema utiliza control de concurrencia optimista y transacciones atómicas. Si dos técnicos intentan asignarse el mismo ticket de forma simultánea, solo uno tiene éxito (HTTP 200) y el segundo recibe una respuesta controlada de conflicto (HTTP 409 Conflict).

### ¿Por qué no podía resolver un ticket con una solución corta (como "OK")?
Era un bug histórico ([BUG-031](../11-incidentes/BUG-031-resolucion-ticket-solucion-corta.md), corregido en H-31 / [ADR-020](../01-architecture/decisions/ADR-020-resolucion-atomic-de-ticket.md)). El servidor exigía al menos 10 caracteres y GLPI 11 resolvía el ticket al crear la solución, lo que generaba `422`. Ahora se usa `POST /api/tickets/{id}/resolve` (atómico): se permiten soluciones cortas y los errores se devuelven como `409` en español. Ver [KB — Resolución de tickets](resolucion-de-tickets.md).
