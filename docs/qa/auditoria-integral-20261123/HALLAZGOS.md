# Registro de Hallazgos — Auditoría Integral y Remediación Final (2026-11-23)

> **Rama:** `audit/mision-maestra-20261123` (dependiente de PR #57 `a22027a`)

| ID | Prioridad | Área | Estado | Resumen y Evidencia |
|---|---|---|---|---|
| **AUD-20261123-01** | **P0** | Seguridad / Infra (GLPI + PHP) | **CLOSED IN CODE (AWAITING LAN DEPLOY)** | Imagen actualizada y fijada a `glpi/glpi:11.0@sha256:9bcedc76763ff9642761f53eb82ec48f944135074b7c83e84af2b7199251a261` (**GLPI 11.0.13 + PHP 8.5.13**, `x86_64`). Validadas `apirest.php/initSession`, 8 formularios corporativos, `AssignGroupToTicketAsync` real y **62/62 Playwright E2E** en H-20. (`GHSA-753w-2942-4pxm` ya parcheado desde 11.0.9.) |
| **AUD-20261123-02** | **P1** | Arquitectura GLPI (Regla Dapper) | **CLOSED (FIXED)** | `EnsureTicketGroupAssignedAsync` (SQL directo `INSERT INTO glpi_groups_tickets`) sustituido por `IGlpiApiClient.AssignGroupToTicketAsync` (`POST Ticket/{id}/Group_Ticket`). Verificado contra GLPI 11.0.13 real (`HTTP 201` + traza en `glpi_logs`) y test de integración. |
| **AUD-20261123-03** | **P1** | Seguridad / Infra Producción | **CLOSED (FIXED)** | OpenAPI/Scalar restringidos a `Development` (test `404` en `Production`); `docker-compose.prod.yml` sin colisión 8081 (`127.0.0.1:${API_PORT:-8080}:8080`), con `443:443` y montaje `:ro` de `./infra/nginx/certs`. |
| **AUD-20261123-04** | **P2** | Seguridad / Rate Limiting | **CLOSED (FIXED)** | `RateLimitPolicies.GlpiWebhook` enlazado en `GlpiIntegrationEndpoints.cs` y `RateLimitPolicies.PerUser` en `AdminEndpoints.cs`. |
| **AUD-20261123-05** | **P2** | Higiene Local / Gobernanza | **OPEN (OPERATIVO HUMANO)** | Archivos locales no rastreados presentes en estación de trabajo (no versionados; Gitleaks 0 fugas): `.git\cred-push.txt`, `cred-push.txt`, `cred-rt.txt`, `token.txt` (492 B, 2026-10-14), `login_body.json` (94 B, 2026-10-13), `ENTREGA_JEFE_PRIVADO.txt` (4678 B, 2026-11-06). **Recomendación:** revisar, eliminar y rotar cualquier token/credencial que haya residido en ellos. Preservar o liberar manualmente los 9 locks huérfanos de `opencode-2` (436h) en `coop_status`. |
| **AUD-20261123-06** | **P3** | Calidad Frontend (ESLint) | **CLOSED (FIXED)** | 2 warnings `react-hooks/exhaustive-deps` corregidos con `useMemo` (`TeamDashboard.tsx`, `TechnicianFilter.tsx`). `pnpm lint`: 0 errores, 0 advertencias. |
| **AUD-20261123-07** | **P3** | Consistencia RBAC UI | **CLOSED (FIXED)** | `Login.tsx` alineado con `App.tsx` (`/services` solo para operadores). |
| **AUD-20261123-08** | **P2** | Reglas `RuleTicket` H-20 & GLPI 11.0.13 | **CLOSED (FIXED)** | `scripts/seed-e2e.sql` tenía `condition = 0` en reglas `H38 Route *` (impedía disparo síncrono nativo `ONADD|ONUPDATE`); corregido a `condition = 3`. Adaptados `full-user-journey.spec.ts` y `realtime.spec.ts` a la redirección directa `/front/ticket.form.php?id=<id>` de GLPI 11.0.13. |

## Diagnóstico Read-Only de Contenedores Detenidos (Sin Alterar Producción)

| Contenedor | Estado | ExitCode | OOMKilled | FinishedAt | Causa |
|---|---|---|---|---|---|
| `glpi` | `exited` | `137` | `false` | `2026-11-16T19:49:14Z` | SIGKILL tras timeout de parada limpia de Apache/PHP durante `compose stop/down` (no OOM). |
| `glpi-db`, `glpi-app-db`, `glpi-nginx`, `glpi-frontend` | `exited` | `0` | `false` | `2026-11-16T19:48:46Z–19:49:17Z` | Parada limpia coordinada en la misma ventana. |
| `glpi-api` | `running` | `0` | `false` | `Up 2 days` | Activo sin modificaciones ni reinicios. |
