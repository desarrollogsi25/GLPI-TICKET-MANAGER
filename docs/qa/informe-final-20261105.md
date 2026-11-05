# Informe final — auditoría, corrección, pruebas y despliegue

> Fecha: 2026-11-05 | Ejecutor: agente automatizado (Tech Lead) | QA manual humano: **no ejecutado**
> Commit desplegado: `main` `749a834` | PR: [#44](https://github.com/desarrollogsi25/GLPI-TICKET-MANAGER/pull/44) | CI: [run 42085345613](https://github.com/desarrollogsi25/GLPI-TICKET-MANAGER/actions/runs/42085345613)

## 1. Resultado

| Área | Estado | Evidencia |
| --- | --- | --- |
| Código en `main` | ✅ | Rebase-merge del PR #44 (7 commits sobre `12866e6`). |
| CI | ✅ 4/4 jobs | Gitleaks; backend build Release + 51 pruebas de aplicación + 217 de integración; frontend typecheck + 14 unitarias + build; E2E 45/45 en fixture H-20. |
| QA exploratorio por rol | ✅ 142/142 | 8 cuentas × 2 viewports; `docs/qa/evidence-20261105/`. |
| Ciclo de vida GLPI | ✅ | Ticket #1026: estado 6 con dos `TicketTask` reales verificadas por SQL de solo lectura; ticket #1027 «Acceso a sistema» enrutado a Service Desk. |
| Despliegue local/LAN | ✅ | Frontend `a64f32258f04`, API `819fa448834a`; `/health` y `/health/ready` 200; smoke 20/20 en `:5173` y 20/20 en `:80`. |
| Rollback preparado | ✅ | Backups en `scratch/backup-20261105/` e imágenes `*:rollback-20261105-premerge`. |
| PWA / Web Push de sistema operativo | ⚠️ NOT_VERIFIED | SW, manifiesto y assets PWA servidos (200), pero no se probó push a nivel SO. |
| QA manual humano | ❌ No ejecutado | Toda la verificación fue automatizada por agente; no debe citarse como manual. |
| E2E local | ⚠️ BLOCKED | Host con 1,1 GB de RAM libre; el runner H-20 abortó en `globalSetup` y limpió el fixture sin residuos. La ejecución autoritativa es CI. |

## 2. Correcciones incluidas en el PR #44

| Commit | Contenido |
| --- | --- |
| `26a284e` | Eliminación de credenciales versionadas y endurecimiento del aprovisionamiento del fixture E2E (contraseñas sintéticas por ejecución). |
| `8ec79c2` | Navegación del solicitante, dashboard por rol y etiquetas de estado nativas de GLPI. |
| `13968a7` | «Pendiente» cuenta solo el estado GLPI 4 y protección de fechas cero. |
| `ba30eac` | Supresión del toast falso «Error de red» ante consultas canceladas (`isNetworkFailure`). |
| `ab460a6` | QA exploratorio por rol con evidencia versionada. |
| `2b1bd98` | Alineación de la guía con la regla de creación exclusiva en GLPI. |
| `c1661f9` | Registro de resultados reales de CI y eliminación del artefacto no reproducible `qa-results.json`. |

Incidencias cerradas: `INC-QA-20261105-01` a `06` en `docs/qa/registro-de-incidencias.md`.

## 3. Reglas de producto preservadas

- Los tickets se crean **exclusivamente en GLPI**; el smoke verifica la ausencia de UI de creación y la guía lo declara explícitamente. La E2E `Ticket Manager rejects direct ticket creation` sigue en verde.
- Estado GLPI 3 solo mediante `TicketTask` real (no PATCH genérico), verificado en #1026.
- Lecturas GLPI por Dapper; mutaciones por API REST oficial.
- Autorización por rol y grupo (deny-by-default), incluido 403 de `tech_bi` contra la cola de Desarrollo.

## 4. Despliegue

Detalle completo y procedimiento de rollback en [`docs/07-operations/deployment.md` §8](../07-operations/deployment.md#8-registro-de-despliegue--2026-11-05-main-749a834).

- Comando: `docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml up -d --build api frontend lan-frontend`.
- Sin eliminación de volúmenes ni cambios en GLPI/MariaDB/PostgreSQL.
- Backups previos: GLPI MariaDB 5.561.763 bytes; app PostgreSQL 194.186 bytes; ambas descargas con salida 0.
- Cabeceras verificadas: HSTS, CSP (`connect-src 'self' ws: wss:`), `X-Frame-Options: DENY`, `Permissions-Policy`.

## 5. Riesgos residuales y limitaciones

1. **Credenciales de laboratorio expuestas**: `gen_hashes.cs` (versionado desde #29) contenía contraseñas de prueba en texto plano; se elimina en el PR #46 (`INC-QA-20261105-07`) y se comprobó que las cuentas afectadas ya las rechazan (401). El contenido sigue en el historial público anterior; su purga exigiría reescritura de historia, no autorizada.
2. **Cuentas demo de GLPI**: `scripts/glpi-base.sql` conserva hashes bcrypt de usuarios de demostración (`glpi`, `tech`, `normal`, `post-only`, etc.). Son datos de laboratorio, pero no deben habilitarse en una instancia expuesta; rotar o deshabilitar fuera del entorno de pruebas.
3. **Push a nivel sistema operativo**: no verificado; requiere dispositivo/instalación PWA y, en iOS, instalación previa.
4. **E2E local**: bloqueado por memoria del host; cobertura equivalente en CI (45/45).
5. **`pnpm lint`**: NOT_CONFIGURED; no existe script de lint en el repositorio.
6. **Directorio de trabajo**: el checkout local está en `deploy/main-749a834` para no reescribir la rama local `main` (pre-rebase). El remoto `main` es la fuente de verdad (`749a834`).
7. **Archivos no versionados intencionalmente**: `.agents/`, `.claude/`, `CLAUDE.md`, `scripts/restore-acceso-sistema-form.mjs`, `scratch/` (respaldos y evidencias temporales).

## 6. Reproducción

```bash
# Gates
cd frontend && pnpm typecheck && pnpm test:unit && pnpm build
cd ../backend && dotnet test tests/GlpiTicketManager.Api.Integration.Tests -c Release
# QA exploratorio (requiere CRED_* en .env.local)
node frontend/tests/qa/exploratory-roles.mjs
# Smoke post-despliegue: script local en scratch/deploy-20261105 (no versionado)
```
