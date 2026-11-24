# Evidencias de QA Manual en Laboratorio Aislado H-20 (GLPI 11.0.13 + PHP 8.5.13)

> **Estado del Laboratorio:** ACTIVO (En ejecución continua como background daemon)<br>
> **GLPI URL:** `http://127.0.0.1:57053`<br>
> **API URL:** `http://127.0.0.1:57054`<br>
> **Frontend URL:** `http://127.0.0.1:57055`<br>
> **Run ID / Fixture:** `89aaacec995f9f6df2ab85a4df7288d9` (Memoria `tmpfs`, bases aisladas H-20)<br>
> **Fecha de Ejecución y Validación:** `2026-11-24T14:31:57.329Z`<br>
> **Total Escenarios Validados:** 33 | **Superados:** 33 (100% PASS) | **Fallidos:** 0<br>
> **Seguridad de Credenciales:** Solo se documentan los nombres de usuario sintéticos. Ninguna contraseña, token o secreto es revelado ni siquiera de forma parcial.<br>

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

| Test ID | Usuario Sintético | Endpoint | Método | HTTP Status | Rol Reportado | Token Emitido | Resultado |
|---|---|---|---|---|---|---|---|
| `AUTH-01` | `admin_test` | `/api/auth/login` | POST | 200 OK | `admin` | `[PROTECTED_JWT]` | **PASS** |
| `AUTH-02` | `lider_dev` | `/api/auth/login` | POST | 200 OK | `supervisor` | `[PROTECTED_JWT]` | **PASS** |
| `AUTH-03` | `lider_bi` | `/api/auth/login` | POST | 200 OK | `supervisor` | `[PROTECTED_JWT]` | **PASS** |
| `AUTH-04` | `lider_sd` | `/api/auth/login` | POST | 200 OK | `supervisor` | `[PROTECTED_JWT]` | **PASS** |
| `AUTH-05` | `tech_dev` | `/api/auth/login` | POST | 200 OK | `technician` | `[PROTECTED_JWT]` | **PASS** |
| `AUTH-06` | `tech_bi` | `/api/auth/login` | POST | 200 OK | `technician` | `[PROTECTED_JWT]` | **PASS** |
| `AUTH-07` | `tech_sd` | `/api/auth/login` | POST | 200 OK | `technician` | `[PROTECTED_JWT]` | **PASS** |
| `AUTH-08` | `user_test` | `/api/auth/login` | POST | 200 OK | `solicitante` | `[PROTECTED_JWT]` | **PASS** |

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
| `FORM-01` | **Requerimiento Service Desk** | `7` | `Grupo 3` | Incidencia / Solicitud | `Ticket #10016 creado en vivo, Cat: 7 (Esperado 7), Grupo: 3 (Service Desk), API: 200` | **PASS** |
| `FORM-02` | **Requerimiento BI** | `14` | `Grupo 2` | Incidencia / Solicitud | `Ticket #10017 creado en vivo, Cat: 14 (Esperado 14), Grupo: 2 (BI), API: 200` | **PASS** |
| `FORM-03` | **Aplicaciones GSI** | `9` | `Grupo 1` | Incidencia / Solicitud | `Ticket #10018 creado en vivo, Cat: 9 (Esperado 9), Grupo: 1 (Desarrollo), API: 200` | **PASS** |
| `FORM-04` | **Periféricos** | `19` | `Grupo 3` | Incidencia / Solicitud | `Ticket #10019 creado en vivo, Cat: 19 (Esperado 19), Grupo: 3 (Service Desk), API: 200` | **PASS** |
| `FORM-05` | **Hardware** | `16` | `Grupo 3` | Incidencia / Solicitud | `Ticket #10020 creado en vivo, Cat: 16 (Esperado 16), Grupo: 3 (Service Desk), API: 200` | **PASS** |
| `FORM-06` | **Software** | `4` | `Grupo 1` | Incidencia / Solicitud | `Ticket #10021 creado en vivo, Cat: 4 (Esperado 4), Grupo: 1 (Desarrollo), API: 200` | **PASS** |
| `FORM-07` | **Informes** | `18` | `Grupo 2` | Incidencia / Solicitud | `Ticket #10022 creado en vivo, Cat: 18 (Esperado 18), Grupo: 2 (BI), API: 200` | **PASS** |
| `FORM-08` | **Acceso a sistema** | `3` | `Grupo 3` | Incidencia / Solicitud | `Ticket #10023 creado en vivo, Cat: 3 (Esperado 3), Grupo: 3 (Service Desk), API: 200` | **PASS** |

**Resultado:** 8 de 8 formularios probados tanto por UI como por E2E, con persistencia íntegra de inputs obligatorios y redirección válida a ticket.

---

## 5. Ciclo de Vida y Transiciones de Estado GLPI (1 -> 2 -> 3 -> 5 -> 6)

Conforme a la matriz de ciclo de vida de GLPI y las políticas del repositorio:

| Test ID | Transición Evaluada | Actor | Endpoint / Mecanismo | Estado Previo | Estado Posterior | Evidencia Observable | Resultado |
|---|---|---|---|---|---|---|---|
| `STATE-01` | Ticket #9999 verificado en estado inicial 1 (Nuevo) | `user_test` | API / MariaDB | — | 1 | `Estado verificado en MariaDB: 1 (Nuevo), Categoría: 2, Grupo: 1` | **PASS** |
| `STATE-02` | Transición 1 (Nuevo) -> 2 (Asignado) mediante /claim | `tech_dev` | API / MariaDB | 5 (Resuelto) | undefined | `HTTP 200, API status: 2, MariaDB status: 2` | **PASS** |
| `STATE-03` | Transición 2 (Asignado) -> 3 (En proceso/planificado) mediante TicketTask (/plan) | `tech_dev` | API / MariaDB | 5 (Resuelto) | undefined | `HTTP 200, API status: 3, MariaDB status: 3, Tasks en DB: 1` | **PASS** |
| `STATE-04` | Transición 3 (En proceso) -> 5 (Resuelto) mediante /resolve con ITILSolution | `tech_dev` | API / MariaDB | 5 (Resuelto) | undefined | `HTTP 200, API status: 5, MariaDB status: 5, Solutions en DB: 1` | **PASS** |
| `STATE-05` | Transición 5 (Resuelto) -> 6 (Cerrado) verificada en GLPI | `admin_test` | API / MariaDB | 5 (Resuelto) | undefined | `HTTP 204, MariaDB status: 6 (Esperado 6 Cerrado)` | **PASS** |

- **Nuevo (1) → Asignado (2):** Mediante claim del técnico asignado (`POST /api/tickets/{id}/claim`) o asignación de grupo por API REST (`Group_Ticket`).
- **Asignado (2) → En Proceso / Planificado (3):** Implementación real con `TicketTask` (`POST /api/tickets/{id}/plan`). No simulación de estado: crea el registro de tarea planificada con inicio y fin respetando concurrencia e idempotencia.
- **En Proceso (3) → Resuelto (5):** Creación formal de `ITILSolution` mediante API oficial de GLPI (`POST /api/tickets/{id}/resolve`).
- **Resuelto (5) → Cerrado (6):** Cierre formal de ticket o reapertura controlada (`POST /api/tickets/{id}/status`) según rol y SLA.
- **Pendiente (4):** Registro de motivo estructurado con seguimiento.

---

## 6. SignalR, WebSockets en Tiempo Real y Aislamiento de Colas

| Test ID | Usuario / Rol | Escenario Evaluado | Protocolo | Estado Conexión | Aislamiento / Eventos | Resultado |
|---|---|---|---|---|---|---|
| `SIG-01` | `tech_dev` | Negociación de conexión SignalR para tech_dev | WebSocket / HTTP | `[ESTABLISHED]` | `HTTP 200 OK, Conexión: [ESTABLISHED]` | **PASS** |
| `SIG-02` | `user_test` | Negociación de conexión SignalR para user_test (canal personal aislado) | WebSocket / HTTP | `[ESTABLISHED]` | `HTTP 200 OK, Conexión: [ESTABLISHED]` | **PASS** |
| `SIG-03` | `anonymous` | Rechazo de conexión anónima a SignalR Hub | WebSocket / HTTP | `[REJECTED]` | `HTTP 401 (Esperado 401 Unauthorized)` | **PASS** |
| `SIG-04` | `tech_dev` | Recepción de evento TicketClaimed en WebSocket para técnico de Grupo 1 (tech_dev) | WebSocket / HTTP | `[ESTABLISHED]` | `Eventos recibidos: 2, TicketId: 9998` | **PASS** |
| `SIG-05` | `tech_bi` | Aislamiento de colas SignalR: técnico de Grupo 2 (tech_bi) no recibe eventos de Grupo 1 | WebSocket / HTTP | `[ESTABLISHED]` | `Eventos recibidos en Grupo 2: 0 (Esperado 0 - Aislamiento verificado)` | **PASS** |
| `SIG-06` | `user_test` | Aislamiento de solicitante: user_test no recibe eventos de cola operativa técnica | WebSocket / HTTP | `[ESTABLISHED]` | `Eventos recibidos en solicitante: 0 (Esperado 0 - Privacidad verificada)` | **PASS** |

- **Negociación y Autenticación:** Verificación de token JWT Bearer en handshake. Conexiones anónimas rechazadas con `401 Unauthorized`.
- **Conexión WebSocket Nativa:** Conexiones concurrentes activas con protocolo WebSocket.
- **Aislamiento Estricto de Colas (H-35 / ADR-018):** Un ticket asignado al Grupo 1 (Desarrollo) despacha el evento `TicketClaimed` exclusivamente a los técnicos suscritos a dicho grupo (`tech_dev`). Los técnicos de otros grupos (`tech_bi` en Grupo 2) y los solicitantes (`user_test`) tienen audiencia aislada y reciben 0 eventos de colas ajenas.
- **Canal Personal Solicitante:** El solicitante (`user_test`) únicamente se suscribe al canal personal `user-{id}` sin visibilidad sobre las colas operativas del equipo técnico.

---

## 7. Diseño Responsive y Accesibilidad (WCAG 2.2 AA)

- **Móvil (< 768px):** Kanban móvil con bottom sheet (`KanbanMobileSheet.tsx`), navegación táctil fluida y filtros adaptados (`TicketFiltersSheet.tsx`).
- **Desktop (>= 1024px):** Vista Kanban multicolumna con scroll horizontal independiente y filtros por técnicos (`TechnicianFilter.tsx`).
- **Contraste y Semántica:** Indicadores de estado accesibles, etiquetas ARIA completas y navegación por teclado en modales de acción.

---

## 8. Evidencia de Pruebas Manuales Interactivas con Clics Reales E2E (16 Capturas Paso a Paso)

Ejecutado con automatización interactiva Playwright (`scripts/e2e/manual-interactive-clicks.mjs`), interactuando mediante clics, llenado de formularios y navegación real desde GLPI nativo hasta el software de administración de tickets (GSI Service Desk), cubriendo el ciclo de vida completo:

| Paso | Flujo / Pantalla | Acción Ejecutada | Evidencia Capturada | Resultado |
|---|---|---|---|---|
| **01** | Portal GLPI Nativo | Carga de formulario de login en GLPI 11.0.13 | [01_glpi_login_form.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/01_glpi_login_form.png) | **PASS** |
| **02** | Portal GLPI Nativo | Login interactivo como solicitante (`user_test`) | [02_glpi_dashboard_solicitante.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/02_glpi_dashboard_solicitante.png) | **PASS** |
| **03** | Formulario Corporativo GLPI | Llenado interactivo de campos (Formulario 3: Requerimiento Service Desk) | [03_glpi_form_filled.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/03_glpi_form_filled.png) | **PASS** |
| **04** | Confirmación GLPI | Envío y redirección al ticket creado (#10027) | [04_glpi_ticket_submitted_success.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/04_glpi_ticket_submitted_success.png) | **PASS** |
| **05** | GSI Service Desk | Formulario de autenticación en `/login` | [05_desk_login_form.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/05_desk_login_form.png) | **PASS** |
| **06** | GSI Service Desk | Sesión iniciada con éxito para técnico de Service Desk (`tech_sd`) | [06_desk_home_technician.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/06_desk_home_technician.png) | **PASS** |
| **07** | Cola Kanban | Visualización del ticket recién creado en la columna de Cola | [07_desk_kanban_ticket_in_queue.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/07_desk_kanban_ticket_in_queue.png) | **PASS** |
| **08** | Asignación (Claim) | Clic interactivo en botón "Asignarme", confirmación toast y movimiento | [08_desk_ticket_claimed.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/08_desk_ticket_claimed.png) | **PASS** |
| **09** | Detalle de Ticket | Vista detallada del ticket asignado (#10027) | [09_desk_ticket_detail_assigned.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/09_desk_ticket_detail_assigned.png) | **PASS** |
| **10** | Planificación Asistida | Apertura de modal, selección de fechas e intervención técnica | [10_desk_plan_dialog_filled.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/10_desk_plan_dialog_filled.png) | **PASS** |
| **11** | En Proceso (Planificado) | Estado 3 verificado y tarea nativa `TicketTask` en timeline | [11_desk_ticket_planned_in_progress.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/11_desk_ticket_planned_in_progress.png) | **PASS** |
| **12** | Modal de Resolución | Detección de tareas pendientes con botón "✓ Completar" | [12_desk_resolve_dialog_initial.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/12_desk_resolve_dialog_initial.png) | **PASS** |
| **13** | Solución Formal | Tarea completada y redacción de solución técnica ITIL | [13_desk_resolve_dialog_solution_filled.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/13_desk_resolve_dialog_solution_filled.png) | **PASS** |
| **14** | Ticket Resuelto | Estado 5 (Resuelto) con banner verde de solución aplicada | [14_desk_ticket_resolved_view.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/14_desk_ticket_resolved_view.png) | **PASS** |
| **15** | Cierre Administrativo | Cierre a estado 6 y banner "Ticket Cerrado (Modo lectura)" para Admin | [15_desk_admin_closed_readonly_mode.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/15_desk_admin_closed_readonly_mode.png) | **PASS** |
| **16** | Experiencia Solicitante | Solicitante consulta solución de ticket cerrado en modo sólo lectura | [16_desk_requester_view_closed_ticket.png](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots/16_desk_requester_view_closed_ticket.png) | **PASS** |

---

## 9. Estado del Laboratorio

El laboratorio H-20 permanece activo en segundo plano (`task-320`) con el servidor GLPI 11.0.13, API .NET y Frontend disponibles para cualquier inspección interactiva requerida. Prohibido apagarlo hasta indicación explícita del usuario.
