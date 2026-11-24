# Matriz de Roles, Permisos y Recorridos — Auditoría Integral 2026-11-23

> **Entorno de verificación:** Fixture aislado desechable H-20 (`scripts/e2e/run.mjs`) + suite de integración `.NET 10` (`Api.Integration.Tests`) + `Application.Tests`.  
> **Política:** Deny-by-default (`TicketAccessPolicy`, `DashboardAccessPolicy`, `TicketHub`, `ProtectedRouteWithRole`).

---

## 1. Los 8 Perfiles Corporativos Sintéticos (Aprovisionados en H-20)

| Usuario | Rol App | Grupo GLPI | Landing | Estado Verificación |
|---|---|---|---|---|
| `user_test` | `solicitante` | — | `/tickets` | **PASS** (Playwright H-20: acceso a `/tickets`, redirección desde `/kanban` a `/tickets`, sin controles de operador) |
| `tech_dev` | `technician` | Desarrollo (`1`) | `/kanban` | **PASS** (Playwright H-20 + `TicketAccessPolicy`) |
| `tech_bi` | `technician` | BI (`2`) | `/kanban` | **PASS** (H-20 provisionado + integración RBAC por grupo; ver histórico `MATRIZ_QA_FINAL.md` #11) |
| `tech_sd` | `technician` | Service Desk (`3`) | `/kanban` | **PASS** (H-20 provisionado + integración RBAC por grupo) |
| `lider_dev` | `supervisor` | Desarrollo (`1`) | `/kanban` | **PASS** (Playwright H-20: acceso a cola grupal y métricas de grupo) |
| `lider_bi` | `supervisor` | BI (`2`) | `/kanban` | **PASS** (Override PostgreSQL `user_role_overrides` verificado en arranque H-20) |
| `lider_sd` | `supervisor` | Service Desk (`3`) | `/kanban` | **PASS** (Override PostgreSQL `user_role_overrides` verificado en arranque H-20) |
| `admin_test` | `admin` | Global | `/kanban` | **PASS** (Playwright H-20: Kanban global, planificación en nombre de técnico, reapertura de cerrados) |

*(Cuentas auxiliares de automatización H-20: `tech1` y `user1`, también verificadas en `full-user-journey`, `readonly-consult-flow`, `qa-planning-regressions` y `signalr-authorization`.)*

---

## 2. Matriz Rol × Recurso × Operación (Positivos y Negativos)

| Recurso / Operación | Anónimo | `solicitante` | `technician` | `supervisor` | `admin` | Evidencia |
|---|---|---|---|---|---|---|
| `GET /api/auth/me` | ❌ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | `Api.Integration.Tests` + `readonly-consult-flow` |
| `/kanban` y `/queue` | ❌ `/login` | ❌ Redir `/tickets` | ✅ Su grupo | ✅ Sus grupos | ✅ Global | `corporate-roles-and-responsive.spec.ts` |
| `/services` (8 tarjetas catálogo) | ❌ `/login` | ❌ Redir `/tickets` | ✅ 8 tarjetas | ✅ 8 tarjetas | ✅ 8 tarjetas | `corporate-roles-and-responsive.spec.ts` + fix `Login.tsx` |
| `/equipo` (métricas de grupo) | ❌ `/login` | ❌ 403 | ❌ 403 | ✅ Su grupo | ✅ Global | `Api.Integration.Tests` + `ProtectedRouteWithRole` |
| `/administracion` y `/api/admin/*` | ❌ 401 | ❌ 403 | ❌ 403 | ❌ 403 | ✅ 200 | `AdminEndpoints.cs` + `Api.Integration.Tests` |
| Detalle de ticket ajeno / otro grupo | ❌ 401 | ❌ 403 | ❌ 403 | ❌ 403 (otro grupo) | ✅ 200 | `TicketAccessPolicy.CanViewAsync` + `full-user-journey` |
| Consulta solo lectura en Resuelto (5) / Cerrado (6) | ❌ 401 | ✅ Propio (banner) | ✅ Asignado (banner, sin duplicar link, sin `aria-disabled`) | ✅ Su grupo | ✅ Global | `readonly-consult-flow.spec.ts` (3/3 PASS) |
| `PATCH /api/tickets/{id}/status` en Cerrado (6) | ❌ 401 | ❌ 403 | ❌ 403/422 | ❌ 403/422 | ❌ 422 (salto directo prohibido) | `readonly-consult-flow.spec.ts` |
| Reapertura (`POST /reopen`) en Resuelto (5) | ❌ 401 | ❌ 403 | ✅ Asignado (motivo opcional) | ✅ Su grupo | ✅ Global | `readonly-consult-flow.spec.ts` + `ReopenTicketDialog.tsx` |
| Reapertura (`POST /reopen`) en Cerrado (6) | ❌ 401 | ❌ 403 | ❌ 403 | ❌ 403 | ✅ Excepción formal | `readonly-consult-flow.spec.ts` |
| Planificación (`POST /plan`) + solapamiento concurrente | ❌ 401 | ❌ 403 | ✅ Propio / 409 solape | ✅ Su grupo | ✅ Cualquier técnico / 409 solape | `qa-planning-regressions.spec.ts` (5/5 PASS) |
| SignalR `/hubs/tickets` (`group-*` / `supervisors-*`) | ❌ 401 | ❌ Bloqueado (incluso si miembro de grupo técnico) | ✅ Sus grupos | ✅ Sus grupos + `supervisors-*` | ✅ Global | `signalr-authorization.spec.ts` (PASS) |
| `/openapi/v1.json` y `/scalar/v1` en `Production` | ❌ 404 | ❌ 404 | ❌ 404 | ❌ 404 | ❌ 404 | `GlpiWebhookTests.OpenApiAndScalar_AreNotExposedInProductionEnvironment` |
