# Resumen Ejecutivo — Auditoría Integral GLPI + GSI Service Desk (2026-11-23)

> **Repositorio:** `desarrollogsi25/GLPI-TICKET-MANAGER`  
> **Fecha:** 2026-11-23  
> **Rama base auditada:** `feat/mision-final-qa-laboratorio-audit` (`a22027a`, PR #57 `OPEN`/`BLOCKED`)  
> **Rama de remediación aislada:** `audit/mision-maestra-20261123`  
> **Alcance:** GLPI 11 (8 formularios corporativos + reglas + imagen/runtime), GSI Service Desk (.NET 10 API + React 19 SPA + SignalR + PostgreSQL + Dapper + Nginx), Seguridad (OWASP ASVS 5.0 / API Security), Accesibilidad (WCAG 2.2 AA), Laboratorio aislado H-20.

---

## 1. Veredicto Real y Honesto

| Dimensión | Estado | Motivo Exacto |
|---|---|---|
| **Código de aplicación y remediaciones (rama `audit/mision-maestra-20261123`)** | **READY FOR HUMAN REVIEW** | 0 P1/P2/P3 abiertos en código; 345 tests .NET (95 unit + 250 int), 24 unit frontend, 68 guard H-20, 24 Playwright E2E reales en H-20, 0 errores/warnings ESLint/TS/.NET, 0 fugas Gitleaks, 0 dependencias vulnerables. |
| **Liberación a Producción / LAN** | **NO APROBADO (BLOCKED BY P0-01)** | Persiste **1 hallazgo P0 abierto (`AUD-20261123-01`)**: la imagen Docker fijada (`glpi/glpi:11.0@sha256:45572164...`) ejecuta **GLPI 11.0.11 + PHP 8.5.11**, confirmada afectada por CVEs críticos de PHP 8.5.12/8.5.13 y GLPI 11.0.12/11.0.13. Requiere actualización verificada (validando `apirest.php/initSession` en H-20) y aprobación humana para despliegue LAN. |

---

## 2. Principales Resultados de la Auditoría

1. **Verificación directa de advisories GLPI/PHP (Oct/Nov 2026):**
   - `GHSA-753w-2942-4pxm` (SQLi sin autenticar en `front/planning.php`, parcheado en GLPI 11.0.9): **NO AFECTA** a la imagen fijada (comprobado `/var/www/glpi/version/11.0.11` y código de `front/planning.php` líneas 37–39).
   - **P0-01 confirmado por versión exacta:** La misma imagen ejecuta **PHP 8.5.11** (anterior a PHP 8.5.12 "PHP2Shell" CVE-2026-109618/109619 y PHP 8.5.13 con 18 CVEs / 7 críticos CVSS 9.2) y **GLPI 11.0.11** (anterior a GLPI 11.0.12 y 11.0.13, incluyendo escalada vía API legacy v1 `apirest.php` y account takeover).
2. **Correcciones aplicadas por causa raíz en rama aislada (`audit/mision-maestra-20261123`):**
   - **P1-01 (`AUD-20261123-02`):** Eliminada la escritura SQL directa `INSERT INTO glpi_groups_tickets` en `TicketRepository.EnsureTicketGroupAssignedAsync`; migrada a GLPI REST API (`IGlpiApiClient.AssignGroupToTicketAsync` → `POST Ticket/{id}/Group_Ticket`) en los 4 llamadores, con test de regresión.
   - **P1-02 (`AUD-20261123-03`):** Restringidos `MapOpenApi()` y `MapScalarApiReference()` en `Program.cs` a `Development` (test de regresión verificando `404` en `Production`); endurecido `docker-compose.prod.yml` (API en `127.0.0.1:8081:8080`, puerto `443:443` y montaje `:ro` de `./infra/nginx/certs`).
   - **P2-01 (`AUD-20261123-04`):** Enlazado `RateLimitPolicies.GlpiWebhook` en `POST /api/integrations/glpi/ticket-created` y `RateLimitPolicies.PerUser` en `/api/admin/*`.
   - **P3-01/P3-02 (`AUD-20261123-06`/`07`):** Resueltos los 2 warnings ESLint `react-hooks/exhaustive-deps` (`TeamDashboard.tsx`, `TechnicianFilter.tsx` → 0 errores / 0 warnings) y alineada la lista de rutas en `Login.tsx` con `App.tsx` (`/services` excluido de `solicitante`).
3. **Preservación de entorno y gobernanza:**
   - Cero modificaciones o reinicios sobre `glpi-db`, `glpi`, `glpi-app-db`, `glpi-api` o volúmenes persistentes.
   - Respetados los 9 locks huérfanos de `opencode-2` en `coop_status` y preservados `stash@{0}`, worktrees y archivos no rastreados.
   - Documentadas contradicciones de gobernanza (`AGENTS.md` vs `user_global` vs `GEMINI.md`) y fallback manual ante ausencia de CLI `gitnexus` e índice `.gitnexus` obsoleto (`db54bdc`).

---

## 3. Navegación del Paquete de Auditoría

- [INVENTARIO.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/INVENTARIO.md)
- [HALLAZGOS.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/HALLAZGOS.md)
- [MATRIZ-ROLES.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/MATRIZ-ROLES.md)
- [RELEASE-GATES.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/RELEASE-GATES.md)
- [EVIDENCIAS/README.md](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/auditoria-integral-20261123/EVIDENCIAS/README.md)
