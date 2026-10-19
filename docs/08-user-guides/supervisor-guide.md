# Guía de Usuario: Perfil Supervisor

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-08-GUIDE-SUPERVISOR | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Propósito y Alcance

Esta guía describe las responsabilidades operativas, permisos y flujos de trabajo habilitados para los usuarios con rol **Supervisor** (`supervisor`) en GLPI Ticket Manager.

## 2. Permisos y Matriz de Acceso (RBAC)

Los supervisores cuentan con visibilidad y control sobre tickets de todos los grupos técnicos a los que pertenecen:

| Operación | Permiso | Restricción / Condición |
| :--- | :---: | :--- |
| **Visualizar Kanban** | Sí | Filtrado a grupos técnicos del supervisor |
| **Reclamar Ticket** | Sí | Reclamo directo a nombre propio |
| **Reasignar Ticket** | Sí | Asignar a cualquier técnico de su grupo |
| **Cambiar Estado** | Sí | Transiciones permitidas (En progreso, Pendiente, Resuelto) |
| **Añadir Seguimientos** | Sí | Públicos o privados |
| **Ver Seguimientos Privados** | Sí | Habilitado para tickets de sus grupos asignados |
| **Reapertura de Tickets** | Sí | Puede reabrir tickets cerrados o resueltos con motivo justificado |
| **Configuración del Sistema** | No | Reservado exclusivamente para rol `admin` |

## 3. Flujo de Supervisión en el Tablero Kanban

### 3.1 Monitoreo de Colas
- **Columna "Cola del grupo":** Muestra incidencias no asignadas en los grupos del supervisor.
- **Acción de Asignación:** El supervisor puede arrastrar la tarjeta o abrir el detalle para asignar un técnico específico o autoasignarse el ticket.

### 3.2 Desbloqueo y Reasignación
1. Si un técnico se encuentra ausente o bloqueado, el supervisor puede reasignar el ticket a otro miembro activo del grupo técnico.
2. Cada reasignación emite un evento en tiempo real a través de SignalR (`TicketUpdated`), actualizando la interfaz de todos los agentes conectados instantáneamente.

### 3.3 Gestión de Seguimientos Privados (Auditoría H-08)
- Los supervisores pueden redactar y consultar notas internas marcadas como privadas (`is_private = true`).
- Estas notas están protegidas a nivel backend y nunca se exponen a solicitantes externos u observadores.

### 3.4 Reapertura de Casos
- En caso de que una solución provista no resuelva satisfactoriamente el requerimiento, el supervisor puede invocar la acción **Reabrir Ticket** desde el menú contextual o detalle.
- El sistema solicita motivo de reapertura obligatorio (mínimo 10 caracteres) y devuelve el ticket a estado `Asignado` (Status = 2).
