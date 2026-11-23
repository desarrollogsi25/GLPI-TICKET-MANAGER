# Evidencias Redactadas — Auditoría Integral y Remediación Final (2026-11-23)

## 1. Imagen Oficial GLPI/PHP Validada (Cierre P0-01)
- **Digest fijado:** `glpi/glpi:11.0@sha256:9bcedc76763ff9642761f53eb82ec48f944135074b7c83e84af2b7199251a261` (`x86_64`)
- **Versiones reales verificadas dentro del contenedor:**
  - `PHP 8.5.13 (cli) (built: Nov 19 2026 14:29:52) (NTS)` con `Zend OPcache`, `mysqli`, `curl`, `gd`, `intl`, `ldap`, `mbstring`, `openssl`, `sodium`, `zip`, `apcu`, `redis`.
  - `/var/www/glpi/version/11.0.13` (Nov 22 2026).

## 2. Ejecución E2E Completa en H-20 sobre GLPI 11.0.13 + PHP 8.5.13
- **Corrida completa (`node scripts/e2e/run.mjs`):** 59/59 suites existentes PASS + restore desechable PASS.
- **Corrida focalizada tras fix `condition = 3` y `accessToken` (`p0-glpi1113-forms-and-group-api.spec.ts`):** **3/3 PASS (53.0s)**:
  1. Envío efectivo de los **8 formularios corporativos nativos** (`Form/Render/3`..`10`), verificación en MariaDB de `itilcategories_id` y `glpi_groups_tickets.groups_id` (enrutamiento síncrono `RuleTicket`), y consulta `200 OK` en API Ticket Manager.
  2. **`AssignGroupToTicketAsync` real** contra GLPI 11.0.13: `HTTP POST http://glpi/apirest.php/Ticket/9355/Group_Ticket` → `201 Created`, persistencia en `glpi_groups_tickets` y traza verificada en `glpi_logs`.
  3. **Backup y restauración lógica** verificada en tabla temporal desechable dentro de H-20.
- **Total consolidado Playwright H-20 sobre GLPI 11.0.13 + PHP 8.5.13:** **62/62 PASS**, limpieza total verificada (`Exclusive fixture removed; no project containers, volumes or networks remain`).

## 3. Seguridad y Secretos
- Gitleaks (`--redact`, 310 commits, 11.76 MB): **0 fugas**.
- `dotnet list package --vulnerable --include-transitive`: **0 paquetes vulnerables**.
- `pnpm audit --prod`: **0 vulnerabilidades**.
- `glpi` / `glpi-db` / `glpi-app-db` / `glpi-api` de LAN: **sin modificaciones ni reinicios** (`OOM=false` confirmado en contenedores detenidos el `2026-11-16T19:49Z`).
