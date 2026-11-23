# Evidencias Redactadas — Auditoría Integral 2026-11-23

Todas las evidencias fueron generadas en modo solo lectura o dentro del fixture efímero H-20 (`tmpfs`, sentinels verificados, limpieza total comprobada) sin exponer credenciales, tokens ni datos de producción.

## 1. Versión Efectiva de GLPI y PHP en Imagen Fijada
- **Comando:** `docker run --rm --network none --entrypoint sh glpi/glpi:11.0@sha256:45572164994cbd12bedd99bf6dd954b7962076dd3b529f0fdc4a84131f30a32a -c 'php -v; ls -la /var/www/glpi/version'`
- **Salida observada:**
  - `PHP 8.5.11 (cli) (built: Oct  6 2026 01:23:10) (NTS)`
  - `/var/www/glpi/version/11.0.11` (Oct 11 2026)
  - `front/planning.php` líneas 37–39: `if (!isset($_GET['genical']) || isset($_GET['checkavailability'])) { Session::checkRight("planning", READ); }` → confirma que `GHSA-753w-2942-4pxm` está parcheado en 11.0.11, mientras que PHP 8.5.12/8.5.13 y GLPI 11.0.12/11.0.13 faltan.

## 2. Gitleaks (`--redact`)
- **Comando:** `docker run --rm -v "${PWD}:/repo:ro" ghcr.io/gitleaks/gitleaks:v8.30.1 detect --source /repo --config /repo/.gitleaks.toml --redact --no-banner`
- **Resultado:** `310 commits scanned`, `11.76 MB`, **`no leaks found`**.

## 3. Auditoría de Dependencias
- `dotnet list GlpiTicketManager.sln package --vulnerable --include-transitive`: **0 paquetes vulnerables** en los 6 proyectos.
- `pnpm audit --prod`: **`No known vulnerabilities found`**.

## 4. Laboratorio H-20 (Playwright E2E sobre Stack Real)
- **Comando:** `node scripts/e2e/run.mjs -- tests/e2e/corporate-roles-and-responsive.spec.ts tests/e2e/readonly-consult-flow.spec.ts tests/e2e/a11y.spec.ts tests/e2e/qa-planning-regressions.spec.ts tests/e2e/signalr-authorization.spec.ts tests/e2e/full-user-journey.spec.ts`
- **Resultado:** **24/24 PASS (5.9m)** incluyendo:
  - Instalación limpia GLPI 11 + 11 migraciones PostgreSQL + validación SQL007 + 2 réplicas webhook/VAPID + 8 formularios inteligentes corporativos.
  - `a11y.spec.ts`: 8/8 PASS (WCAG axe-core en `/kanban`, `/tickets`, `/tickets/11`, `/queue`, `/services`, `/dashboard`, `/preferences`, `/ayuda`).
  - `corporate-roles-and-responsive.spec.ts`: 6/6 PASS (roles + 8 servicios destacados + viewports `320px`, `375px`, `390px`, `768px` sin overflow horizontal).
  - `full-user-journey.spec.ts`: 1/1 PASS.
  - `qa-planning-regressions.spec.ts`: 5/5 PASS (incluye HTTP 409 en concurrencia).
  - `readonly-consult-flow.spec.ts`: 3/3 PASS (escritorio 1280px y móvil 390px, sin `aria-disabled="true"`, foco teclado, sin enlaces duplicados).
  - `signalr-authorization.spec.ts`: 1/1 PASS.
  - Limpieza verificada: `Exclusive fixture removed; no project containers, volumes or networks remain`.
