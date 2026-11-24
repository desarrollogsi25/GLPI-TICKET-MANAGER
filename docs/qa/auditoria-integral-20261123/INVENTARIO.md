# Inventario Técnico — Auditoría Integral 2026-11-23

> **Repositorio:** `desarrollogsi25/GLPI-TICKET-MANAGER`  
> **Rama base auditada:** `feat/mision-final-qa-laboratorio-audit` (`a22027aaf9d0c538b4481d685551be0ab7439974`, PR #57 `OPEN`/`BLOCKED`; 14 commits sobre `origin/main` `913aaf3`)  
> **Rama de remediación aislada:** `audit/mision-maestra-20261123`

---

## 1. Entornos, Contenedores y Persistencia

| Entorno / Contenedor | Imagen / Versión Efectiva | Estado al Auditar | Clasificación |
|---|---|---|---|
| `glpi` (objetivo validado / remediación P0) | `glpi/glpi:11.0@sha256:9bcedc76...` (**GLPI 11.0.13**, **PHP 8.5.13**, built 2026-11-19/22) | Validado en H-20 / Compose fijado por digest | Producción LAN / Objetivo de despliegue |
| `glpi` (estado previo local/LAN sin migrar) | `glpi/glpi:11.0@sha256:45572164...` (GLPI 11.0.11, PHP 8.5.11, built 2026-10-11) | `Exited (137)` | Persistente (no modificado sin autorización) |
| `glpi-db` (vol. `sistemaopensourceglpi_glpi-db-data`) | `mariadb:10.11` | `Exited (0)` | **Producción LAN / Persistente** (no fixture) |
| `glpi-app-db` (vol. `sistemaopensourceglpi_app-db-data`) | `postgres:16-alpine` | `Exited (0)` | Persistente (no modificado) |
| `glpi-api` | `sistemaopensourceglpi-api:latest` (.NET 10) | `Up 2 days` (`127.0.0.1:8080`) | Persistente (no reiniciado) |
| `glpi-frontend` / `glpi-lan-frontend` / `glpi-nginx` | React 19 + Vite 6 + Nginx Alpine | `Exited (0)` | Persistente (no modificado) |
| **Fixture H-20 Activo** (`docker-compose.e2e.yml`) | `tmpfs` MariaDB 10.11 + PostgreSQL 16 + **GLPI 11.0.13** (**PHP 8.5.13**) + API .NET 10 + Frontend | **ACTIVO (Laboratorio manual)** (`task-320`) | **Desechable verificado** (62/62 E2E PASS) |

---

## 2. Formularios Nativos GLPI 11 (Catálogo Corporativo)

Aprovisionados y verificados en H-20 (`scripts/seed-visual-forms.js` + `scripts/seed-e2e.sql`):

| # | Formulario Inteligente | Tipo | Categoría ITIL Fija | Grupo Destino (Regla `RuleTicket`) |
|---|---|---|---|---|
| 1 | Requerimiento Service Desk | Solicitud (2) | `7` (Service Desk) | Grupo `3` (Service Desk) |
| 2 | Requerimiento BI | Solicitud (2) | `14` (BI > Requerimiento BI) | Grupo `2` (BI) |
| 3 | Aplicaciones GSI | Incidencia (1) | `9` (Desarrollo > Aplicaciones GSI) | Grupo `1` (Desarrollo) |
| 4 | Periféricos | Incidencia (1) | `19` (Service Desk > Periféricos) | Grupo `3` (Service Desk) |
| 5 | Hardware | Incidencia (1) | `16` (Service Desk > Hardware) | Grupo `3` (Service Desk) |
| 6 | Software | Incidencia (1) | `4` (Desarrollo > Software) | Grupo `1` (Desarrollo) |
| 7 | Informes | Incidencia (1) | `18` (BI > Informes) | Grupo `2` (BI) |
| 8 | Acceso a sistema | Solicitud (2) | `3` (Requerimiento > Acceso a sistema) | Grupo `3` (Service Desk) |
| +2 | Formularios generales (`Reportar incidencia general`, `Solicitar servicio general`) | Mixto | Selector jerárquico 16 categorías | Según `glpi_rules` |

---

## 3. Frontend — Rutas, Páginas y Modales (`frontend/src/App.tsx`)

| Ruta | Componente | Roles Permitidos |
|---|---|---|
| `/login` | `Login.tsx` | Público (anónimo) |
| `/kanban` | `Kanban.tsx` + `TicketCard.tsx`, `KanbanMobileSheet.tsx`, `KanbanSegmentedTabs.tsx` | `technician`, `supervisor`, `admin` |
| `/tickets` | `List.tsx` + `TicketTable.tsx`, `TicketListCard.tsx`, `TicketFiltersBar.tsx`, `TicketFiltersSheet.tsx` | Todos los autenticados (`solicitante` solo propios) |
| `/tickets/:id` | `Detail.tsx` + `PlanTicketDialog`, `ReplanTicketTaskDialog`, `PendingTicketDialog`, `ResolveTicketDialog`, `ReopenTicketDialog` | Todos según `TicketAccessPolicy.CanViewAsync` |
| `/queue` | `GroupQueuePage.tsx` | `technician`, `supervisor`, `admin` |
| `/services` | `ServicesPage.tsx` | `technician`, `supervisor`, `admin` |
| `/dashboard` | `Dashboard.tsx` | `technician`, `supervisor`, `admin` |
| `/equipo` | `TeamDashboard.tsx` | `supervisor`, `admin` |
| `/administracion` | `AdminDashboard.tsx` | `admin` |
| `/preferences` | `PreferencesPage.tsx` | Todos los autenticados |
| `/ayuda` | `AgentGuide.tsx` | Todos los autenticados |

---

## 4. Backend — Grupos de Endpoints, Hub y Servicios (`.NET 10`)

| Grupo / Archivo | Prefijo / Ruta | Rate Limiting | Seguridad |
|---|---|---|---|
| `AuthEndpoints.cs` | `/api/auth/*` (`login`, `me`, `logout`) | `Login` en `/login` | JWT propio + revocación `jti` en PostgreSQL |
| `TicketEndpoints.cs` | `/api/tickets/*` (lista, detalle, claim, plan, tasks, resolve, reopen, pending, status, solutions, availability) | `PerUser` (+ `Expensive` en `by-group`) | `TicketAccessPolicy` deny-by-default |
| `TicketPlanningEndpoints.cs` | `/api/tickets/{id}/planning/*` | `PerUser` | `TicketAccessPolicy` + advisory lock + idempotencia |
| `DashboardEndpoints.cs` | `/api/dashboard/stats` | `PerUser` + `Expensive` | `DashboardAccessPolicy` por rol/grupo |
| `GroupEndpoints.cs` | `/api/groups/*` | `PerUser` | Membresía de grupo / supervisor / admin |
| `ChannelEndpoints.cs` | `/api/channels/*` | `PerUser` | Autenticado |
| `ServicesEndpoints.cs` | `/api/services/*` | `PerUser` | Autenticado |
| `PreferencesEndpoints.cs` | `/api/preferences/*` | `PerUser` | Scoped al `userId` del JWT |
| `NotificationEndpoints.cs` | `/api/notifications/*` (+ WebPush VAPID) | `PerUser` | Scoped al `userId` del JWT |
| `AdminEndpoints.cs` | `/api/admin/*` (`dashboard`, `groups-summary`, `watcher-status`, `watcher/recover/{id}`) | `PerUser` (**añadido en FASE 3**) | Exclusivo `AppRole.Admin` |
| `GlpiIntegrationEndpoints.cs` | `/api/integrations/glpi/ticket-created` | `GlpiWebhook` (**añadido en FASE 3**) | HMAC-SHA256 + timestamp ±10m + 64 KB cap + dedup PG |
| `TicketHub.cs` | `/hubs/tickets` (SignalR) | — | `[Authorize]`, suscripción validada por `CanViewGroupQueueAsync` |
| `Program.cs` | `/health`, `/health/ready`, `/openapi/v1.json`, `/scalar/v1` | — | OpenAPI/Scalar restringidos a `Development` (**corregido en FASE 3**) |

---

## 5. Referencias Históricas Reconciliadas

- [INFORME_FINAL_QA.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/INFORME_FINAL_QA.md) (2026-11-06)
- [MATRIZ_QA_FINAL.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/MATRIZ_QA_FINAL.md) (2026-11-05)
- [20261110-qa-closure-infrastructure-data-audit.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/20261110-qa-closure-infrastructure-data-audit.md) (2026-11-10)
- [informe-mision-final-auditoria-chatgpt-20261111.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/informe-mision-final-auditoria-chatgpt-20261111.md) (2026-11-11)
