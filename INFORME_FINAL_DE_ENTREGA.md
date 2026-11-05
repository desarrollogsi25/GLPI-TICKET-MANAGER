# Informe final de entrega — GLPI Ticket Manager

> Fecha: 2026-11-05 | Ejecutor: agente automatizado (Tech Lead) | QA humana: **no ejecutada**
> Commit desplegado: `main` `433c6c2` | PR: [#50](https://github.com/desarrollogsi25/GLPI-TICKET-MANAGER/pull/50) | CI: [run 42112779010](https://github.com/desarrollogsi25/GLPI-TICKET-MANAGER/actions/runs/42112779010)
> Alcance de la URL: red local del dueño (LAN). **No** es una publicación en Internet.

## 1. Estado

**LISTO PARA DEMOSTRACIÓN** en la red local, con dos limitaciones expresamente no verificadas (§7): push a nivel de sistema operativo y confianza del certificado autofirmado en equipos distintos al host.

| Área | Estado | Evidencia |
| --- | --- | --- |
| Código en `main` | ✅ | `origin/main` = `433c6c2`; PR #50 fusionado con rebase 2026-11-05T21:37Z. |
| CI en el commit fusionado | ✅ 4/4 jobs | Gitleaks; Backend build + tests; Frontend typecheck + build; E2E Playwright 45/45 en fixture H-20. |
| Backend local | ✅ 284 pruebas | 57 aplicación + 227 integración (Release, 0 fallos). |
| Frontend | ✅ | `typecheck`, `lint` (ESLint) y `build` sin errores. |
| QA de navegador ejecutada por agente | ✅ 35/35 | 8 cuentas × escritorio/móvil, consola y red monitoreadas. |
| Simulación del jefe en sesión limpia | ✅ 12/12 | `scratch/final-qa/artifacts/boss-sim-2026-11-05T21-41-44-430Z/`. |
| Verificación post-despliegue | ✅ 9/9, dos veces | Antes y después de reiniciar la pila completa. |
| Respaldos + restauración aislada | ✅ | SHA-256 de 3 artefactos; conteos restaurados idénticos. |
| Rollback preparado | ✅ | Imágenes etiquetadas `*:rollback-20261105-433c6c2`. |
| Push de sistema operativo | ⚠️ NOT_VERIFIED | Requiere permiso de notificaciones del usuario y dispositivo/PWA instalada. |
| CA autofirmada en HTTPS LAN | ⚠️ Bloqueo conocido | El service worker no se registra en `https://` desde un equipo sin la CA en su almacén de confianza. No se instaló CA raíz. |

## 2. URLs verificadas

| Servicio | URL | Verificación |
| --- | --- | --- |
| Ticket Manager (HTTP) | http://10.10.40.31 | 200; login, Kanban, Tickets, Equipo, Ayuda. |
| Ticket Manager (HTTPS) | https://10.10.40.31 | 200; advertencia de certificado autofirmado esperada. |
| API | http://10.10.40.31/api (vía frontend) y `127.0.0.1:8080` | `/health` 200, `/health/ready` 200, `/api/auth/me` 401 sin sesión. |
| GLPI original | http://10.10.40.31:8081 | 200; login y formulario nativo de incidencia operativos. |

Las contraseñas de las 8 cuentas demo están en `ENTREGA_JEFE_PRIVADO.txt`, excluido de Git. No se publican aquí.

## 3. Cambios técnicos de esta entrega

| Commit | Contenido |
| --- | --- |
| `4795790` | Detección de cambios de estado hechos directamente en GLPI mediante sondeo de `glpi_tickets.date_mod` cada ~1,2 s + propagación SignalR con alcance. |
| `3b44a2a` | Materialización correcta de columnas `CAST(... AS SIGNED)` de MariaDB (Int64) en el watcher. |
| `433c6c2` | Corrección definitiva del tipo Int64 en las consultas del watcher y sus pruebas. |

Comportamiento nuevo verificado: al cerrar un ticket desde GLPI, la tarjeta desaparece del Kanban abierto **sin recargar** (548 ms medidos) y los contadores del supervisor cambian en vivo. La audiencia de la difusión es deny-by-default:

- ticket sin asignar → `group-{gid}` + `supervisors-{gid}`;
- ticket asignado → `user-{assignee}` + `supervisors-{gid}` (nunca al grupo completo);
- ticket sin grupo válido → se descarta con log, no se difunde.

Nunca se usa `Clients.All`. Las pruebas `GlpiNativeWatcherExternalChangesTests` (4) y `TicketNotificationAudienceTests` (3 nuevas) cubren línea base, deduplicación por solapamiento de ventana, cambio de comentario sin cambio de estado, ticket sin grupo y audiencias.

## 4. Flujos de negocio verificados

| Flujo | Resultado | Evidencia |
| --- | --- | --- |
| Creación exclusiva en GLPI | ✅ | Ticket #1031 creado desde el formulario nativo (Hardware); la UI del TM no ofrece alta. |
| Enrutamiento por categoría | ✅ | Hardware → grupo Service Desk (id 3); estado GLPI 2 al enrutar. |
| Asignación | ✅ | GLPI status 2 y tarjeta en columna «Asignado», sin etiqueta «En proceso ejecución». |
| Planificación real | ✅ | GLPI status 3 con `TicketTask` real (1 tarea); visible en línea de tiempo. |
| Pausa / reanudación | ✅ | GLPI 4 → tarjeta «Pendiente»; al reanudar, nueva planificación y GLPI 3. |
| Resolución | ✅ | GLPI 5 sin cierre automático. |
| Cierre en GLPI | ✅ | GLPI 6 retira la tarjeta del Kanban activo y conserva historial en `/tickets?status=6`. |
| Móvil | ✅ | Kanban móvil distingue «Asignado» y «En proceso». |

## 5. Seguridad e aislamiento

- 8 cuentas autenticadas con redirección por rol: solicitante → `/tickets`; técnicos, líderes y admin → `/kanban`.
- Solicitante no accede a Kanban ni Administración (403/redirección verificada).
- `tech_bi` con `groupId=3` manipulado en la petición solo ve su propio grupo (BI).
- Mutaciones GLPI por API REST oficial; lecturas Dapper; estado 3 solo con `TicketTask` real.
- Webhooks con HMAC, ventana anti-replay e idempotencia persistente (pruebas de integración en verde).
- JWT, CORS, cookies, CSP, HSTS, `X-Frame-Options: DENY`, `Permissions-Policy`, rate limiting y autorización del hub SignalR verificados en la suite.
- Sin errores HTTP 5xx ni errores de consola inesperados en la QA de navegador.

## 6. Pruebas ejecutadas (resumen)

| Suite | Resultado |
| --- | --- |
| Backend Application | 57/57 |
| Backend Integration | 227/227 |
| E2E CI (fixture H-20) | 45/45 |
| QA navegador por rol (agente) | 35/35 |
| Simulación del jefe (sesión limpia) | 12/12 |
| Verificación post-despliegue | 9/9 antes y 9/9 tras reinicio completo |
| Auditorías de dependencias | NuGet y pnpm sin vulnerabilidades conocidas |
| Lint frontend | `eslint src` sin hallazgos |

Detalle por caso en [`MATRIZ_QA_FINAL.md`](MATRIZ_QA_FINAL.md). La QA fue **ejecutada por un agente**; no se declara QA humana.

## 7. Riesgos y limitaciones

1. **Push a nivel de sistema operativo: NOT_VERIFIED.** La Push API está disponible y el service worker se registra en contexto seguro (loopback), pero no se concedió permiso de notificaciones ni se dispone de un dispositivo suscrito; no se puede afirmar la recepción en el SO.
2. **HTTPS LAN con certificado autofirmado.** `https://10.10.40.31` responde 200, pero Chromium rechaza el registro del service worker si la CA no está confiada en el equipo. Para la demo se recomienda **HTTP** (`http://10.10.40.31`); la instalación de la CA raíz requiere autorización específica y no se realizó.
3. **Alcance LAN, no producción pública.** El sistema no está expuesto a Internet; no se abrieron puertos al público.
4. **Credenciales históricas de laboratorio.** El repositorio conserva hashes bcrypt de usuarios demo de GLPI en `scripts/glpi-base.sql`; son datos de laboratorio y no deben habilitarse en una instancia expuesta.
5. **Historial de Git.** La purga de credenciales antiguas exigiría reescribir historia pública; no autorizada y no ejecutada.
6. **Datos de prueba.** Los tickets #1026/#1027/#1031 y las cuentas demo son sintéticos, creados para esta entrega.

## 8. Despliegue y rollback

Detalle operativo en [`RUNBOOK_DESPLIEGUE_Y_ROLLBACK.md`](RUNBOOK_DESPLIEGUE_Y_ROLLBACK.md).

- Imágenes en ejecución: API `sha256:debeed137f01…`, frontend `sha256:a64f32258f04…` (contenedor `glpi-frontend` y `glpi-lan-frontend`).
- Respaldos: `scratch/backups/2026-11-05T21-18-16Z/` con `SHA256SUMS`:
  - `appdb.dump` — `259a4ac2175058c3…`
  - `glpi.sql` — `361df2c1bb1ac5ec…`
  - `glpi_tables.sql` — `45e8aae0c22a6f3d…`
- Restauración comprobada en instancias aisladas: PostgreSQL efímero (`notifications=481`) y esquema temporal de MariaDB (`tickets=49`, `users=16`, `webhooks=2`, `tickets_users=51`), eliminado tras la comprobación.
- Rollback: `sistemaopensourceglpi-api:rollback-20261105-433c6c2` y `glpi-ticket-manager-frontend:rollback-20261105-433c6c2`.

## 9. Reproducción

```bash
# Gates locales
cd frontend && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build
cd ../tests && dotnet test GlpiTicketManager.Application.Tests -c Release
dotnet test GlpiTicketManager.Api.Integration.Tests -c Release

# QA de navegador y simulación del jefe (requieren CRED_* en .env.local)
node scratch/final-qa/browser-qa.mjs
node scratch/final-qa/boss-simulation.mjs
node scratch/final-qa/post-deploy-verify.mjs
```

> Nota: `.env.local`, `ENTREGA_JEFE_PRIVADO.txt` y `scratch/` están excluidos de Git. Los scripts de QA contienen rutas del host de demostración y no forman parte del producto desplegable.
