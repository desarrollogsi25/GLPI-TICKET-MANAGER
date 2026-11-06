# MATRIZ DE QA POR ROLES Y PERMISOS — GLPI TICKET MANAGER v2.0.0

Esta matriz documenta el alcance funcional, derechos de acceso y verificación exhaustiva de seguridad para cada uno de los ocho perfiles de usuario corporativos en el sistema GLPI Ticket Manager.

---

## 1. CUENTAS Y PERFILES EVALUADOS

| Usuario | Rol en Sistema | Grupo Asignado | Ámbito de Visibilidad | Propósito en el Negocio |
| :--- | :--- | :--- | :--- | :--- |
| `admin_test` | Administrador | Global (Todos) | Global completa (sin restricciones) | Gestión global, supervisión de métricas, configuración y soporte de segundo nivel. |
| `lider_sd` | Supervisor | Service Desk (Grupo 1) | Service Desk + Tickets asignados | Supervisión operativa, reasignación y balance de carga de mesa de ayuda. |
| `tech_sd` | Técnico | Service Desk (Grupo 1) | Cola Service Desk + Tickets asignados | Atención y resolución de incidencias de primer nivel y hardware. |
| `lider_dev` | Supervisor | Desarrollo (Grupo 3) | Desarrollo + Tickets asignados | Gestión y priorización de requerimientos de software y bugs. |
| `tech_dev` | Técnico | Desarrollo (Grupo 3) | Cola Desarrollo + Tickets asignados | Implementación, corrección y despliegue de tickets de desarrollo. |
| `lider_bi` | Supervisor | BI (Grupo 2) | BI + Tickets asignados | Supervisión de tableros, cubos y analítica de datos. |
| `tech_bi` | Técnico | BI (Grupo 2) | Cola BI + Tickets asignados | Modelado de datos, generación de reportes y soporte analítico. |
| `user_test` | Solicitante | Solicitantes (Sin grupo soporte) | Exclusivamente sus propios tickets creados | Apertura de requerimientos en GLPI y consulta de estado y soluciones. |

---

## 2. MATRIZ DETALLADA DE DERECHOS Y FUNCIONALIDADES

| Funcionalidad / Módulo | `admin_test` | `lider_*` | `tech_*` | `user_test` | Regla de Seguridad & Control |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Inicio y Cierre de Sesión** | ✅ | ✅ | ✅ | ✅ | Autenticación JWT contra GLPI, expiración y revocación segura. |
| **Dashboard Global TI** | ✅ | ❌ | ❌ | ❌ | Métricas de toda la organización (todos los grupos). |
| **Dashboard de Grupo / Mi Equipo** | ✅ | ✅ | ❌ | ❌ | Carga de trabajo, tickets por estado de su grupo respectivo. |
| **Kanban (5 Columnas)** | ✅ | ✅ | ✅ | ❌ | `user_test` redirigido a `/tickets` (Portal Solicitante). |
| **Reclamar de Cola ("Asignarme")** | ✅ | ✅ | ✅ | ❌ | Asignación controlada al técnico autenticado en su grupo. |
| **Planificar Tarea GLPI** | ✅ | ✅ | ✅ | ❌ | Crea `TicketTask` nativa con rango horario sincronizado. |
| **Pausar ("Poner en pendiente")** | ✅ | ✅ | ✅ | ❌ | Exige motivo y crea seguimiento privado de auditoría. |
| **Reprogramar Tarea** | ✅ | ✅ | ✅ | ❌ | Reutiliza tarea nativa en GLPI; previene colisiones. |
| **Completar Tarea Individual** | ✅ | ✅ | ✅ | ❌ | Transiciona `TicketTask` a estado 2 ("Realizada"). |
| **Resolver Ticket con Solución** | ✅ | ✅ | ✅ | ❌ | Bloqueado si hay tareas pendientes ("Por hacer"). Permite completarlas en el diálogo. |
| **Reabrir Ticket Resuelto/Cerrado** | ✅ | ✅ | ❌ | ❌ | Exclusivo de jefatura / supervisor y solicitante según política GLPI. |
| **Filtrado por Técnico en Lista** | ✅ Global | ✅ Su Grupo | ❌ Solo yo | ❌ No aplica | `GET /api/tickets/technicians` protegido por RBAC estricto. |
| **Aislamiento entre Grupos** | ❌ (Global) | ✅ Aislado | ✅ Aislado | ✅ Aislado | Un técnico de BI recibe `403` si consulta datos de Desarrollo. |
| **Creación de Tickets en TM** | ❌ | ❌ | ❌ | ❌ | **Prohibido por diseño**: la creación ocurre exclusivamente en GLPI. |

---

## 3. AUDITORÍA DE PRUEBAS NEGATIVAS DE ACCESO (OWASP ASVS)

| Código | Vector de Ataque / Prueba Negativa | Actor | Endpoint Afectado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-N01** | Intento de resolver ticket con tareas "Por hacer" vía API sin completarlas. | `tech_bi` | `POST /api/tickets/1042/resolve` | `422 Unprocessable Entity` ("El ticket tiene tareas pendientes por hacer"). | **PASS 🟢** |
| **SEC-N02** | Consulta de técnicos de grupo ajeno (`groupId=3` Desarrollo). | `tech_bi` | `GET /api/tickets/technicians?groupId=3` | `403 Forbidden` ("No tienes autorización para consultar técnicos de este grupo"). | **PASS 🟢** |
| **SEC-N03** | Solicitante intenta acceder a la lista de técnicos. | `user_test` | `GET /api/tickets/technicians` | `403 Forbidden` ("Los solicitantes no tienen permiso para consultar técnicos"). | **PASS 🟢** |
| **SEC-N04** | Solicitante intenta mutar estado de ticket a Resuelto. | `user_test` | `PATCH /api/tickets/1042/status` | `403 Forbidden` ("No tienes permisos para modificar el estado del ticket"). | **PASS 🟢** |
| **SEC-N05** | Técnico intenta asignar ticket asignado a otro técnico sin rol supervisor. | `tech_sd` | `POST /api/tickets/1042/claim` | `403 Forbidden` (Reclamación restringida a tickets de cola de grupo). | **PASS 🟢** |
| **SEC-N06** | Acceso anónimo sin cabecera `Authorization: Bearer`. | Anónimo | `GET /api/tickets` | `401 Unauthorized` ("Usuario no autenticado"). | **PASS 🟢** |
