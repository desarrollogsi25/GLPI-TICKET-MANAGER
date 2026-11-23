# Release Gates — Auditoría Integral 2026-11-23

> **Rama:** `audit/mision-maestra-20261123`  
> **Fecha:** 2026-11-23

---

## 1. Resultados Observados por Compuerta

| Compuerta / Suite | Comando Ejecutado | Resultado | Conteo / Evidencia |
|---|---|---|---|
| **.NET Release Build** | `dotnet build GlpiTicketManager.sln -c Release --nologo` | **PASS** | 0 errores, 0 advertencias |
| **Backend Unit Tests** | `dotnet test ... Application.Tests` | **PASS** | **95 / 95** (0 fallos, 0 omitidos) |
| **Backend Integration Tests** | `dotnet test ... Api.Integration.Tests` | **PASS** | **250 / 250** (incluye 2 nuevos tests de regresión P1-01/P1-02) |
| **Frontend Typecheck** | `pnpm typecheck` (`tsc --project tsconfig.build.json --noEmit`) | **PASS** | 0 errores |
| **Frontend ESLint** | `pnpm lint` (`eslint src`) | **PASS** | **0 errores, 0 advertencias** (antes: 2 warnings) |
| **Frontend Unit Tests** | `pnpm test:unit` | **PASS** | **24 / 24** |
| **Frontend Prod Build (PWA)** | `pnpm build` | **PASS** | Vite 6.4.4 + PWA v2.0.0 (`sw.js`, `manifest.webmanifest`) |
| **H-20 Guard Unit Tests** | `node --test scripts/e2e/guard.test.mjs` | **PASS** | **68 / 68** |
| **H-20 Compose Check** | `node scripts/e2e/run.mjs --check` | **PASS** | Compose válido sin arrancar contenedores |
| **Prod Compose Check** | `docker compose -f docker-compose.prod.yml config --quiet` | **PASS** | Exit 0 |
| **Playwright E2E en H-20 Real** | `node scripts/e2e/run.mjs -- <6 suites críticas>` | **PASS** | **24 / 24** (`a11y` 8, `corporate-roles-and-responsive` 6, `full-user-journey` 1, `qa-planning-regressions` 5, `readonly-consult-flow` 3, `signalr-authorization` 1) + SQL007 + 2 réplicas VAPID/webhook + limpieza total |
| **Gitleaks (`--redact`)** | `docker run ... ghcr.io/gitleaks/gitleaks:v8.30.1 detect --redact` | **PASS** | 310 commits / 11.76 MB, **0 fugas** |
| **Dependencias .NET** | `dotnet list GlpiTicketManager.sln package --vulnerable --include-transitive` | **PASS** | 0 paquetes vulnerables |
| **Dependencias Frontend** | `pnpm audit --prod` | **PASS** | 0 vulnerabilidades |
| **Git Diff Hygiene** | `git diff --check` | **PASS** | Limpio |
| **GitNexus (`detect_changes`)** | CLI no instalado / índice `.gitnexus` obsoleto (`db54bdc`) | **BLOCKED (FALLBACK APLICADO)** | Revisión manual exhaustiva de llamadores, contratos, tests y diff según `AGENTS.md` §3 |
| **Runtime GLPI/PHP (P0-01)** | Inspección digest `45572164...` | **FAIL (BLOQUEANTE)** | GLPI 11.0.11 + PHP 8.5.11 con CVEs críticos Oct/Nov 2026 |

---

## 2. Riesgos y Plan de Rollback

- **Rollback de código:** Todos los cambios residen en la rama aislada `audit/mision-maestra-20261123` (commits atómicos sobre `a22027a`). `git checkout feat/mision-final-qa-laboratorio-audit` revierte instantáneamente sin tocar `main`, PR #57 ni contenedores LAN.
- **Riesgo de cambio `AssignGroupToTicketAsync`:** Bajo; solo se invoca cuando el ticket carece de grupo asignado y coincide una regla de categoría. En runtime real usa `POST Ticket/{id}/Group_Ticket` con la misma sesión y `App-Token` que `AssignTicketAsync`.

---

## 3. Decisiones Pendientes (Requieren Aprobación Humana)

1. **[P0-01 — BLOQUEANTE] Actualizar imagen Docker GLPI/PHP:** Validar en H-20 la imagen oficial más reciente `glpi/glpi:11.0` (`GLPI >= 11.0.13`, `PHP >= 8.5.13`) verificando `apirest.php/initSession`, actualizar digests en `docker-compose.yml` y `docker-compose.e2e.yml`, y aprobar ventana de actualización en LAN.
2. **[P2-05 — HIGIENE LOCAL] Limpieza de ficheros locales no rastreados:** Revisar y eliminar manualmente `.git\cred-push.txt`, `cred-push.txt`, `cred-rt.txt`, `token.txt` y `login_body.json` en la estación de trabajo, y liberar los 9 locks huérfanos de `opencode-2` en `coop_status`.
3. **[PR #57 / MERGE] Integración:** Revisar y aprobar PR #57 y los commits de `audit/mision-maestra-20261123` antes de fusionar en `main` o desplegar en LAN.
