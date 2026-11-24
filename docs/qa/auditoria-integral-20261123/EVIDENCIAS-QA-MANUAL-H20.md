# Evidencias de QA Manual en Laboratorio Aislado H-20 (GLPI 11.0.13 + PHP 8.5.13)

> **Estado del Laboratorio:** ACTIVO (En ejecución continua como background daemon)  
> **GLPI URL:** `http://127.0.0.1:57053`  
> **API URL:** `http://127.0.0.1:57054`  
> **Frontend URL:** `http://127.0.0.1:57055`  
> **Run ID / Fixture:** `89aaacec995f9f6df2ab85a4df7288d9` (Memoria `tmpfs`, bases aisladas H-20)  
> **Seguridad de Credenciales:** Solo se documentan los nombres de usuario sintéticos. Ninguna contraseña o token confidencial es revelado en este informe.

---

## 1. Verificación de los 8 Perfiles Sintéticos y Aislamiento RBAC

| # | Perfil / Rol | Usuario Sintético | Grupo GLPI | Rutas Permitidas | Aislamiento y Restricciones Verificadas | Estado |
|---|---|---|---|---|---|---|
| 1 | **Administrador** | `admin_test` | Todos | `/administracion`, `/equipo`, `/dashboard`, `/tickets`, `/kanban`, `/services`, `/preferences` | Acceso completo. Auditoría de Watcher, resumen de colas y métricas globales. | **PASS** |
| 2 | **Líder Desarrollo** | `lider_dev` | Grupo 1 (Desarrollo) | `/equipo`, `/dashboard`, `/tickets`, `/kanban`, `/queue`, `/services` | Restringido a Grupo 1. Denegado acceso a `/administracion` (`403 Forbidden`). | **PASS** |
| 3 | **Líder BI** | `lider_bi` | Grupo 2 (BI) | `/equipo`, `/dashboard`, `/tickets`, `/kanban`, `/queue`, `/services` | Restringido a Grupo 2. Denegado acceso a `/administracion` (`403 Forbidden`). | **PASS** |
| 4 | **Líder Service Desk** | `lider_sd` | Grupo 3 (Service Desk) | `/equipo`, `/dashboard`, `/tickets`, `/kanban`, `/queue`, `/services` | Restringido a Grupo 3. Denegado acceso a `/administracion` (`403 Forbidden`). | **PASS** |
| 5 | **Técnico Desarrollo** | `tech_dev` | Grupo 1 (Desarrollo) | `/kanban`, `/tickets`, `/queue`, `/services`, `/preferences` | Solo opera tickets de Desarrollo. Denegado `/equipo` y `/administracion`. | **PASS** |
| 6 | **Técnico BI** | `tech_bi` | Grupo 2 (BI) | `/kanban`, `/tickets`, `/queue`, `/services`, `/preferences` | Solo opera tickets de BI. Denegado `/equipo` y `/administracion`. | **PASS** |
| 7 | **Técnico Service Desk**| `tech_sd` | Grupo 3 (Service Desk)| `/kanban`, `/tickets`, `/queue`, `/services`, `/preferences` | Solo opera tickets de Service Desk. Denegado `/equipo` y `/administracion`. | **PASS** |
| 8 | **Solicitante** | `user_test` | — (Autoservicio) | Portal GLPI (`/Form/Render/*`), `/tickets` (propios), `/preferences` | **Denegado por defecto:** `/kanban`, `/queue`, `/dashboard`, `/equipo`, `/administracion`, `/services`. No ve tickets ajenos. | **PASS** |

---

## 2. Validación de los 8 Formularios Corporativos y Enrutamiento Automático

Verificado en GLPI 11.0.13 con motor de reglas `RuleTicket` (`glpi_rules` con `condition = 3` para ejecución inmediata en adición y actualización):

1. **Requerimiento Service Desk (Form 3):** Solicitud -> Categoría fija `7` (Service Desk) -> Asignación automática a Grupo `3`.
2. **Requerimiento BI (Form 4):** Solicitud -> Categoría fija `14` (BI > Requerimiento BI) -> Asignación automática a Grupo `2`.
3. **Aplicaciones GSI (Form 5):** Incidencia -> Categoría fija `9` (Desarrollo > Aplicaciones GSI) -> Asignación automática a Grupo `1`.
4. **Periféricos (Form 6):** Incidencia -> Categoría fija `19` (Service Desk > Periféricos) -> Asignación automática a Grupo `3`.
5. **Hardware (Form 7):** Incidencia -> Categoría fija `16` (Service Desk > Hardware) -> Asignación automática a Grupo `3`.
6. **Software (Form 8):** Incidencia -> Categoría fija `4` (Desarrollo > Software) -> Asignación automática a Grupo `1`.
7. **Informes (Form 9):** Incidencia -> Categoría fija `18` (BI > Informes) -> Asignación automática a Grupo `2`.
8. **Acceso a sistema (Form 10):** Solicitud -> Categoría fija `3` (Requerimiento > Acceso a sistema) -> Asignación automática a Grupo `3`.

**Resultado:** 8 de 8 formularios probados tanto por UI como por E2E, con persistencia íntegra de inputs obligatorios y redirección válida a ticket.

---

## 3. Ciclo de Vida y Transiciones de Estado GLPI

Conforme a la matriz de ciclo de vida de GLPI y las políticas del repositorio:
- **Nuevo (1) → Asignado (2):** Mediante claim del técnico asignado (`POST /api/tickets/{id}/claim`) o asignación de grupo por API REST (`Group_Ticket`).
- **Asignado (2) → En Proceso / Planificado (3):** Implementación real con `TicketTask` (`POST /api/tickets/{id}/planning/plan`). No simulación de estado: crea el registro de tarea planificada con inicio y fin respetando concurrencia e idempotencia.
- **En Proceso (3) → Resuelto (5):** Creación formal de `ITILSolution` mediante API oficial de GLPI (`POST /api/tickets/{id}/solutions`).
- **Resuelto (5) → Cerrado (6):** Cierre formal de ticket o reapertura controlada (`POST /api/tickets/{id}/reopen`) según rol y SLA.
- **Pendiente (4):** Registro de motivo estructurado con seguimiento.

---

## 4. SignalR y Notificaciones en Tiempo Real

- Conexión WebSocket a `/hubs/tickets` con JWT verificado.
- Aislamiento de grupos: un técnico del Grupo 1 solo recibe eventos de SignalR dirigidos a su grupo o tickets asignados.
- Notificaciones de escritorio / WebPush VAPID probadas con clave persistente y deduplicación.

---

## 5. Diseño Responsive y Accesibilidad (WCAG 2.2 AA)

- **Móvil (< 768px):** Kanban móvil con bottom sheet (`KanbanMobileSheet.tsx`), navegación táctil fluida y filtros adaptados (`TicketFiltersSheet.tsx`).
- **Desktop (>= 1024px):** Vista Kanban multicolumna con scroll horizontal independiente y filtros por técnicos (`TechnicianFilter.tsx`).
- **Contraste y Semántica:** Indicadores de estado accesibles, etiquetas ARIA completas y navegación por teclado en modales de acción.

---

## 6. Estado del Laboratorio

El laboratorio H-20 permanece activo en segundo plano (`task-320`) con el servidor GLPI 11.0.13, API .NET y Frontend disponibles para cualquier inspección interactiva requerida. Prohibido apagarlo hasta indicación explícita del usuario.
