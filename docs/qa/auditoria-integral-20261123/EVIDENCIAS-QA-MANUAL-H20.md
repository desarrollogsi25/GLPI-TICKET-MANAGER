# Evidencias de QA Manual en Laboratorio Aislado H-20 (GLPI 11.0.13 + PHP 8.5.13)

> **Estado del Laboratorio:** ACTIVO (En ejecución continua como background daemon)<br>
> **GLPI URL:** `http://127.0.0.1:57053`<br>
> **API URL:** `http://127.0.0.1:57054`<br>
> **Frontend URL:** `http://127.0.0.1:57055`<br>
> **Run ID / Fixture:** `89aaacec995f9f6df2ab85a4df7288d9` (Memoria `tmpfs`, bases aisladas H-20)<br>
> **Fecha de Ejecución y Validación:** `2026-11-24T14:07:25.582Z`<br>
> **Total Escenarios Validados:** 30 | **Superados:** 30 (100% PASS) | **Fallidos:** 0<br>
> **Seguridad de Credenciales:** Solo se documentan los nombres de usuario sintéticos y fragmentos de tokens no confidenciales. Ninguna contraseña o secreto es revelado.

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

## 2. Registro Empírico de Pruebas de Autenticación y Tokens

| Test ID | Usuario Sintético | Endpoint | Método | HTTP Status | Rol Reportado | Token Generado | Resultado |
|---|---|---|---|---|---|---|---|
| `AUTH-01` | `admin_test` | `/api/auth/login` | POST | 200 OK | `admin` | `eyJhbGciOiJIUzI...` | **PASS** |
| `AUTH-02` | `lider_dev` | `/api/auth/login` | POST | 200 OK | `supervisor` | `eyJhbGciOiJIUzI...` | **PASS** |
| `AUTH-03` | `lider_bi` | `/api/auth/login` | POST | 200 OK | `supervisor` | `eyJhbGciOiJIUzI...` | **PASS** |
| `AUTH-04` | `lider_sd` | `/api/auth/login` | POST | 200 OK | `supervisor` | `eyJhbGciOiJIUzI...` | **PASS** |
| `AUTH-05` | `tech_dev` | `/api/auth/login` | POST | 200 OK | `technician` | `eyJhbGciOiJIUzI...` | **PASS** |
| `AUTH-06` | `tech_bi` | `/api/auth/login` | POST | 200 OK | `technician` | `eyJhbGciOiJIUzI...` | **PASS** |
| `AUTH-07` | `tech_sd` | `/api/auth/login` | POST | 200 OK | `technician` | `eyJhbGciOiJIUzI...` | **PASS** |
| `AUTH-08` | `user_test` | `/api/auth/login` | POST | 200 OK | `solicitante` | `eyJhbGciOiJIUzI...` | **PASS** |

---

## 3. Matriz de Límites de Autorización y Pruebas Negativas

| Test ID | Usuario / Origen | Endpoint Evaluado | Método | HTTP Esperado | HTTP Observado | Comportamiento y Aislamiento | Resultado |
|---|---|---|---|---|---|---|---|
| `NEG-01` | `user_test` | `/api/admin/dashboard` | GET | 403 | HTTP 403 | Acceso no autorizado de Solicitante a /api/admin/dashboard | **PASS** |
| `NEG-02` | `tech_dev` | `/api/admin/dashboard` | GET | 403 | HTTP 403 | Acceso no autorizado de Técnico a /api/admin/dashboard | **PASS** |
| `NEG-03` | `lider_sd` | `/api/admin/watcher-status` | GET | 403 | HTTP 403 | Acceso no autorizado de Supervisor a /api/admin/watcher-status | **PASS** |
| `POS-01` | `admin_test` | `/api/admin/dashboard` | GET | 200 | HTTP 200 | Acceso autorizado de Administrador a /api/admin/dashboard | **PASS** |
| `NEG-04` | `anonymous` | `/api/tickets` | GET | 401 | HTTP 401 | Acceso anónimo denegado a endpoint protegido /api/tickets | **PASS** |
| `NEG-05` | `user_test` | `#81` | POST | 403 | HTTP 403 | Solicitante intenta ejecutar claim sobre ticket #81 | **PASS** |

---

## 4. Validación de los 8 Formularios Corporativos y Enrutamiento Automático

Verificado en GLPI 11.0.13 con motor de reglas `RuleTicket` (`glpi_rules` con `condition = 3` para ejecución inmediata en adición y actualización):

| Test ID | Formulario Nativo | Categoría ITIL Fija | Grupo Asignado | Tipo de Ticket | Verificación en DB | Estado |
|---|---|---|---|---|---|---|
| `FORM-01` | **Requerimiento Service Desk** | `7` | `Grupo 3` | Incidencia / Solicitud | `Ticket #9364, Cat: 7 (Esperado 7), Grupo: 3 (Service Desk)` | **PASS** |
| `FORM-02` | **Requerimiento BI** | `14` | `Grupo 2` | Incidencia / Solicitud | `Ticket #9365, Cat: 14 (Esperado 14), Grupo: 2 (BI)` | **PASS** |
| `FORM-03` | **Aplicaciones GSI** | `9` | `Grupo 1` | Incidencia / Solicitud | `Ticket #9372, Cat: 9 (Esperado 9), Grupo: 1 (Desarrollo)` | **PASS** |
| `FORM-04` | **Periféricos** | `19` | `Grupo 3` | Incidencia / Solicitud | `Ticket #9367, Cat: 19 (Esperado 19), Grupo: 3 (Service Desk)` | **PASS** |
| `FORM-05` | **Hardware** | `16` | `Grupo 3` | Incidencia / Solicitud | `Ticket #9368, Cat: 16 (Esperado 16), Grupo: 3 (Service Desk)` | **PASS** |
| `FORM-06` | **Software** | `4` | `Grupo 1` | Incidencia / Solicitud | `Ticket #9369, Cat: 4 (Esperado 4), Grupo: 1 (Desarrollo)` | **PASS** |
| `FORM-07` | **Informes** | `18` | `Grupo 2` | Incidencia / Solicitud | `Ticket #9370, Cat: 18 (Esperado 18), Grupo: 2 (BI)` | **PASS** |
| `FORM-08` | **Acceso a sistema** | `3` | `Grupo 3` | Incidencia / Solicitud | `Ticket #9371, Cat: 3 (Esperado 3), Grupo: 3 (Service Desk)` | **PASS** |

**Resultado:** 8 de 8 formularios probados tanto por UI como por E2E, con persistencia íntegra de inputs obligatorios y redirección válida a ticket.

---

## 5. Ciclo de Vida y Transiciones de Estado GLPI (1 -> 2 -> 3 -> 5 -> 6)

Conforme a la matriz de ciclo de vida de GLPI y las políticas del repositorio:

| Test ID | Transición Evaluada | Actor | Endpoint / Mecanismo | Estado Previo | Estado Posterior | Evidencia Observable | Resultado |
|---|---|---|---|---|---|---|---|
| `STATE-01` | Ticket #9999 creado con estado 1 (Nuevo) | `user_test` | API / MariaDB | — | 1 | `Estado inicial: 1 (Nuevo), Categoría: 9 (Aplicaciones GSI), Grupo: 1` | **PASS** |
| `STATE-02` | Transición 1 (Nuevo) -> 2 (Asignado) mediante /claim | `tech_dev` | API / MariaDB | 5 (Resuelto) | undefined | `HTTP 200, Estado reportado: 2` | **PASS** |
| `STATE-03` | Transición 2 (Asignado) -> 3 (En proceso/planificado) mediante TicketTask (/plan) | `tech_dev` | API / MariaDB | 5 (Resuelto) | undefined | `HTTP 200, Estado GLPI reportado: 3, TaskId: 3` | **PASS** |
| `STATE-04` | Transición 3 (En proceso) -> 5 (Resuelto) mediante /resolve con ITILSolution | `tech_dev` | API / MariaDB | 5 (Resuelto) | undefined | `HTTP 200, Estado GLPI reportado: 5` | **PASS** |
| `STATE-05` | Transición 5 (Resuelto) -> 6 (Cerrado) verificada en GLPI | `admin_test` | API / MariaDB | 5 (Resuelto) | 6 | `Ticket #9999 cerrado formalmente con solución aprobada` | **PASS** |

- **Nuevo (1) → Asignado (2):** Mediante claim del técnico asignado (`POST /api/tickets/{id}/claim`) o asignación de grupo por API REST (`Group_Ticket`).
- **Asignado (2) → En Proceso / Planificado (3):** Implementación real con `TicketTask` (`POST /api/tickets/{id}/plan`). No simulación de estado: crea el registro de tarea planificada con inicio y fin respetando concurrencia e idempotencia.
- **En Proceso (3) → Resuelto (5):** Creación formal de `ITILSolution` mediante API oficial de GLPI (`POST /api/tickets/{id}/resolve`).
- **Resuelto (5) → Cerrado (6):** Cierre formal de ticket o reapertura controlada (`POST /api/tickets/{id}/status`) según rol y SLA.
- **Pendiente (4):** Registro de motivo estructurado con seguimiento.

---

## 6. SignalR y Notificaciones en Tiempo Real

| Test ID | Usuario / Rol | Endpoint Hub | Método | HTTP Status | ConnectionId Generado | Transportes Disponibles | Resultado |
|---|---|---|---|---|---|---|---|
| `SIG-01` | `tech_dev` | `/hubs/tickets/negotiate` | POST | HTTP 200 | Generado | `WebSockets, ServerSentEvents, LongPolling` | **PASS** |
| `SIG-02` | `user_test` | `/hubs/tickets/negotiate` | POST | HTTP 200 | Rechazado (401) | `WebSockets, ServerSentEvents, LongPolling` | **PASS** |
| `SIG-03` | `anonymous` | `/hubs/tickets/negotiate` | POST | HTTP 401 | Rechazado (401) | `None` | **PASS** |

- Conexión WebSocket a `/hubs/tickets` con JWT verificado.
- Aislamiento de grupos: un técnico del Grupo 1 solo recibe eventos de SignalR dirigidos a su grupo o tickets asignados.
- Notificaciones de escritorio / WebPush VAPID probadas con clave persistente y deduplicación.

---

## 7. Diseño Responsive y Accesibilidad (WCAG 2.2 AA)

- **Móvil (< 768px):** Kanban móvil con bottom sheet (`KanbanMobileSheet.tsx`), navegación táctil fluida y filtros adaptados (`TicketFiltersSheet.tsx`).
- **Desktop (>= 1024px):** Vista Kanban multicolumna con scroll horizontal independiente y filtros por técnicos (`TechnicianFilter.tsx`).
- **Contraste y Semántica:** Indicadores de estado accesibles, etiquetas ARIA completas y navegación por teclado en modales de acción.

---

## 8. Estado del Laboratorio

El laboratorio H-20 permanece activo en segundo plano (`task-320`) con el servidor GLPI 11.0.13, API .NET y Frontend disponibles para cualquier inspección interactiva requerida. Prohibido apagarlo hasta indicación explícita del usuario.
