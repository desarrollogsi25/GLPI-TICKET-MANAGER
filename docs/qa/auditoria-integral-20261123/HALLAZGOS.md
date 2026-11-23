# Registro de Hallazgos — Auditoría Integral 2026-11-23

> **Rama de remediación:** `audit/mision-maestra-20261123` (desde `a22027a`)  
> **Criterio de severidad:** P0 (Bloqueante / RCE / fuga crítica), P1 (Alto / integridad / arquitectura / seguridad prod), P2 (Medio / hardening), P3 (Bajo / calidad / consistencia).

---

## Tabla Resumen

| ID | Prioridad | Área | Estado | Resumen |
|---|---|---|---|---|
| **AUD-20261123-01** | **P0** | Seguridad / Infra (GLPI + PHP) | **OPEN (BLOQUEANTE)** | Imagen fijada `glpi/glpi:11.0@sha256:45572164...` ejecuta **GLPI 11.0.11 + PHP 8.5.11**, vulnerable a CVEs críticos de PHP 8.5.12/8.5.13 y GLPI 11.0.12/11.0.13. (`GHSA-753w-2942-4pxm` NO afecta: parcheado desde 11.0.9.) |
| **AUD-20261123-02** | **P1** | Arquitectura GLPI (Regla Dapper) | **CLOSED (FIXED)** | `TicketRepository.EnsureTicketGroupAssignedAsync` ejecutaba `INSERT INTO glpi_groups_tickets` directo por Dapper. Migrado a GLPI REST API (`POST Ticket/{id}/Group_Ticket`). |
| **AUD-20261123-03** | **P1** | Seguridad / Infra Producción | **CLOSED (FIXED)** | `Program.cs` exponía `/openapi/v1.json` y `/scalar/v1` en `Production`; `docker-compose.prod.yml` publicaba API en `0.0.0.0:8081` y omitía puerto `443` + volumen `certs` exigidos por `nginx.conf`. |
| **AUD-20261123-04** | **P2** | Seguridad / Rate Limiting | **CLOSED (FIXED)** | `RateLimitPolicies.GlpiWebhook` definido en `Program.cs` pero nunca enlazado en `GlpiIntegrationEndpoints.cs`; `AdminEndpoints.cs` sin `RequireRateLimiting(PerUser)`. |
| **AUD-20261123-05** | **P2** | Higiene Local / Gobernanza | **OPEN (OPERATIVO)** | Archivos locales no rastreados con nombres de credenciales (`.git\cred-push.txt`, `cred-push.txt`, `cred-rt.txt`, `token.txt`) presentes en el host; 9 locks huérfanos en `coop_status` (`opencode-2`, 436h); contradicciones entre `AGENTS.md`, `GEMINI.md` y `user_global`. |
| **AUD-20261123-06** | **P3** | Calidad Frontend (ESLint) | **CLOSED (FIXED)** | 2 advertencias `react-hooks/exhaustive-deps` en `TeamDashboard.tsx:59` y `TechnicianFilter.tsx:28`. |
| **AUD-20261123-07** | **P3** | Consistencia RBAC UI (`Login.tsx`) | **CLOSED (FIXED)** | `Login.tsx:29` incluía `/services` como ruta permitida para `solicitante`, contradiciendo `App.tsx:135`. |

---

## Detalle de Hallazgos

### AUD-20261123-01 (P0) — Runtime GLPI 11.0.11 y PHP 8.5.11 con CVEs Críticos (Oct/Nov 2026)
- **Síntoma:** `docker-compose.yml` y `docker-compose.e2e.yml` fijan la imagen `glpi/glpi:11.0@sha256:45572164994cbd12bedd99bf6dd954b7962076dd3b529f0fdc4a84131f30a32a` (compilada el `2026-10-11`) porque el tag mutable del `2026-10-28` rompió `apirest.php/initSession`.
- **Evidencia reproducible:**
  - `docker run --rm --network none --entrypoint sh glpi/glpi:11.0@sha256:45572164... -c 'php -v; ls -la /var/www/glpi/version'`
  - Resultado observado: **`PHP 8.5.11` (built Oct 6 2026)** y **`/var/www/glpi/version/11.0.11`**.
  - `front/planning.php` líneas 37–39 verificadas: incluye `if (!isset($_GET['genical']) || isset($_GET['checkavailability'])) { Session::checkRight("planning", READ); }` → **`GHSA-753w-2942-4pxm` (parcheado en GLPI 11.0.9) NO afecta a esta imagen**.
  - **Sí afectan directamente a esta versión:**
    - **PHP 8.5.12** (2026-10-21): `CVE-2026-109618` y `CVE-2026-109619` ("PHP2Shell", CVSS 9.2 Critical RCE).
    - **PHP 8.5.13** (2026-11-19): 18 CVEs incluyendo 7 críticos CVSS 9.2 (`CVE-2026-115560`, `CVE-2026-126714` "phpAfterShell", `CVE-2026-129289`, `CVE-2026-129496`, `CVE-2026-129474`, `CVE-2026-129182`).
    - **GLPI 11.0.12** (2026-10-28): bypass de autenticación externa crítico + 6 XSS/escalada High.
    - **GLPI 11.0.13** (2026-11-12): escalada de privilegios vía API legacy v1 (`apirest.php`), account takeover vía dashboard embebido y password-reset hijacking, OAuth consent bypass, stored XSS en descargas API.
- **Causa raíz:** Fijación de digest anterior a las publicaciones de seguridad de finales de octubre y noviembre de 2026 para evitar regresión en `apirest.php/initSession`.
- **Acción requerida (Decisión humana + ventana de mantenimiento):**
  1. Validar en H-20 la última imagen oficial `glpi/glpi:11.0` (digest `amd64` disponible: `sha256:a3327e92...`) confirmando GLPI `>= 11.0.13`, PHP `>= 8.5.13` y compatibilidad de `apirest.php/initSession`.
  2. Actualizar digest en `docker-compose.yml` / `docker-compose.e2e.yml` y aprobar actualización controlada del contenedor LAN.
- **Estado:** **OPEN (BLOQUEANTE PARA PRODUCCIÓN)**.

### AUD-20261123-02 (P1) — Escritura Directa en MariaDB GLPI por Dapper (`EnsureTicketGroupAssignedAsync`)
- **Síntoma:** `TicketRepository.EnsureTicketGroupAssignedAsync` ejecutaba `INSERT INTO glpi_groups_tickets` directo por Dapper, llamado desde `GlpiIntegrationEndpoints.cs`, `GlpiNativeTicketWatcher.cs` (×2) y `TicketService.cs`.
- **Causa raíz:** Fallback de asignación de grupo implementado en SQL directo en vez de API REST oficial de GLPI, violando la regla arquitectónica del repositorio (omite `glpi_logs`, hooks y reglas).
- **Corrección:** Se añadió `IGlpiApiClient.AssignGroupToTicketAsync` (`POST Ticket/{id}/Group_Ticket` con `type = 2`) en `GlpiApiClient.cs`, se reemplazaron los 4 llamadores y se eliminó `EnsureTicketGroupAssignedAsync` de `ITicketRepository` y `TicketRepository`.
- **Prueba de regresión:** `GlpiWebhookTests.Webhook_WhenTicketHasNoGroupYet_AssignsGroupViaGlpiRestApi`.
- **Nota residual:** `TicketRepository.ClaimAsync` conserva código muerto no invocado en runtime (solo referenciado por mocks en tests antiguos; `TicketService.ClaimAsync` ya usa exclusivamente `_glpi.AssignTicketAsync`).
- **Estado:** **CLOSED (FIXED)**.

### AUD-20261123-03 (P1) — Exposición de OpenAPI/Scalar en Producción y Desajuste TLS en `docker-compose.prod.yml`
- **Síntoma:** `Program.cs:259-261` registraba `MapOpenApi()` y `MapScalarApiReference()` en todos los entornos; `docker-compose.prod.yml` publicaba `api` en `0.0.0.0:8081:8080` y montaba `infra/nginx/nginx.conf` (que declara `listen 443 ssl; ssl_certificate /etc/nginx/certs/server.crt`) sin exponer `443:443` ni montar `./infra/nginx/certs`.
- **Corrección:**
  - `Program.cs`: `MapOpenApi()` y `MapScalarApiReference()` condicionados a `if (app.Environment.IsDevelopment())`.
  - `docker-compose.prod.yml`: API restringida a `127.0.0.1:8081:8080`; añadido `0.0.0.0:443:443` y montaje `:ro` de `./infra/nginx/certs:/etc/nginx/certs:ro`.
- **Prueba de regresión:** `GlpiWebhookTests.OpenApiAndScalar_AreNotExposedInProductionEnvironment` + validación `docker compose -f docker-compose.prod.yml config --quiet`.
- **Estado:** **CLOSED (FIXED)**.

### AUD-20261123-04 (P2) — Política `RateLimitPolicies.GlpiWebhook` No Aplicada y Cobertura en `AdminEndpoints`
- **Síntoma:** `RateLimitPolicies.GlpiWebhook` estaba configurada en `Program.cs:167` pero no enlazada al endpoint anónimo `POST /api/integrations/glpi/ticket-created`. `AdminEndpoints.cs` carecía de `.RequireRateLimiting(RateLimitPolicies.PerUser)`.
- **Corrección:** Añadido `.RequireRateLimiting(RateLimitPolicies.GlpiWebhook)` en `GlpiIntegrationEndpoints.cs` y `.RequireRateLimiting(RateLimitPolicies.PerUser)` en `AdminEndpoints.cs`.
- **Estado:** **CLOSED (FIXED)**.

### AUD-20261123-05 (P2) — Higiene Local de Credenciales y Contradicciones de Gobernanza
- **Evidencia:**
  - Archivos locales no rastreados (no versionados; Gitleaks 0 fugas en 310 commits): `.git\cred-push.txt`, `C:\Users\DEVELO~1\AppData\Local\Temp\opencode\cred-push.txt`, `cred-rt.txt`, más artefactos ignorados `token.txt`, `login_body.json`, `ENTREGA_JEFE_PRIVADO.txt`. Recomendación: purgar manualmente en la estación de trabajo tras confirmar que no están en uso.
  - 9 locks huérfanos de `opencode-2` en `coop_status` (436h de antigüedad), respetados íntegramente sin edición.
  - Contradicciones documentadas: `AGENTS.md` (modo individual sin `coop_status` y sin `@latest` de GitNexus) vs `user_global` (`coop_status`/`claim_paths` obligatorios) vs `GEMINI.md` (ejemplos CLI con `gitnexus@latest`).
- **Estado:** **OPEN (OPERATIVO / DECISIÓN HUMANA)**.

### AUD-20261123-06 (P3) — 2 Warnings ESLint `react-hooks/exhaustive-deps`
- **Corrección:** Memorizados `technicians` en `TeamDashboard.tsx:59` y `list` en `TechnicianFilter.tsx:28` con `useMemo`.
- **Verificación:** `pnpm lint` → **0 errors, 0 warnings**.
- **Estado:** **CLOSED (FIXED)**.

### AUD-20261123-07 (P3) — Ruta `/services` en `Login.tsx` para `solicitante`
- **Corrección:** Movido `/services` en `Login.tsx:29-31` del bloque universal al bloque de operadores (`technician`, `supervisor`, `admin`), alineándolo con `App.tsx:135`.
- **Estado:** **CLOSED (FIXED)**.
