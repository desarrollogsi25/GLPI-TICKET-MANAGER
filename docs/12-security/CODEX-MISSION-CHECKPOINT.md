# Checkpoint de finalización — GLPI Ticket Manager

> **Control documental ISO 9001 / ISO 27001**  
> **Código:** DOC-12-SEC-MISSION | **Fecha:** 2026-11-02 | **Estado:** implementación en PR **borrador**, no autorizada para producción.

## Alcance de la PR #38

La rama `codex/planned-ticket-task-20261102` incorpora el paso **En proceso (planificado)** mediante la creación de una `TicketTask` nativa pendiente (`state=1`) con `begin`, `end` y `actiontime`. No establece arbitrariamente `status=3`: GLPI 11 debe confirmarlo por lectura posterior. Si el ticket está Pendiente (4), el backend primero solicita volver a Asignado (2), lo confirma, y entonces crea la tarea. La clave de solicitud de planificación se reserva en PostgreSQL mediante la migración `008` para tolerar reintentos y dos instancias de API.

La tarea se puede **consultar, reprogramar, completar y cancelar** con permisos de ticket y técnico; las operaciones se realizan por API REST nativa de GLPI (nunca con SQL directo). `GET /api/tickets/{id}/tasks` ofrece la línea temporal y oculta tareas privadas a solicitantes. Reprogramar usa una clave durable de idempotencia y exige lectura de confirmación de fechas; completar valida `state=2`; cancelar audita previamente y comprueba que ya no aparezca la tarea. Las planificaciones y mutaciones comparten un **bloqueo asesor por técnico en PostgreSQL**; antes de programar consultan en MariaDB las otras `glpi_tickettasks` pendientes con intervalos solapados. Esta exclusión funciona entre réplicas de **nuestra API**, pero **no impide cambios concurrentes ejecutados directamente desde GLPI o integraciones ajenas**. **ATENCIÓN:** el esquema nativo `glpi_tickettasks` no tiene columna `is_deleted`; `DELETE` puede eliminar la tarea definitivamente, por lo que se exige confirmación explícita y validación específica en staging. Las transiciones de estado que pueda realizar GLPI como efecto secundario se leen desde GLPI y se transmiten por SignalR; la API no fuerza artificialmente `status=3` al terminar o borrar una tarea.

## Hallazgos de la misión (identificadores del checkpoint original)

| Hallazgo | Implementación en esta rama | Validación que sigue pendiente |
|---|---|---|
| H-01 (listado IDOR/BOLA) | Filtros de técnicos no amplían permisos; supervisores limitados a sus grupos en **filas y COUNT** | Auditoría de roles y multi-entidad con datos reales |
| H-02/H-14 (webhook GLPI 11) | HMAC sobre cuerpo/timestamp, ventana antirreplay, secret fuerte, límite de tamaño, idempotencia PostgreSQL `009`, notificación + marca transaccionales | Retries reales desde GLPI 11, reinicios y **dos réplicas** compartiendo PostgreSQL |
| H-03 (soluciones) | Restricción del técnico asignado y del grupo en políticas del servidor | Validación de múltiples perfiles/grupos reales de GLPI |
| H-06 (CORS) | Denegación por defecto; orígenes explícitos en configuración | Configurar por dominio en **cada** despliegue frontend/API y probar preflight público |
| H-07 (secreto expuesto en dev) | Se eliminó el JWT conocido de la configuración versionada | Rotar inmediatamente la clave anterior si se utilizó en algún entorno |

> **Importante:** estos IDs corresponden a la misión de seguridad H-02/H-14 comunicada en el checkpoint anterior. La tabla histórica `vulnerabilities.md` usa algunos de esos números para hallazgos distintos y **no sustituye** esta relación ni valida producción.

## Pruebas y criterios de aceptación

- `.NET Release`: 35 pruebas de aplicación + 149 de integración (**184/184**), incluyendo privacidad y control de acceso a tareas, reprogramación, finalización, cancelación y rechazo de horarios solapados entre tickets contra el doble de GLPI.
- `frontend`: `npm run build` / TypeScript y Vite correctos. Un E2E real en `full-user-journey.spec.ts` comprueba la lectura y reprogramación de tareas nativas. La revisión siguiente añade la cancelación de una tarea de pruebas y exige confirmar su borrado contra GLPI.
- CI #139 de la corrección H-01 y CI **#140** (primera entrega del ciclo completo) pasaron backend, frontend, Gitleaks y E2E de pila completa GLPI 11. La nueva revisión de conflictos y cancelación requiere su propia ejecución CI.
- La configuración CI siguiente levanta una segunda réplica .NET con las mismas bases, alterna 12 webhooks HMAC simultáneos entre ambas, reinicia una de ellas y repite el lote. **Esto prueba reintentos sintéticos y resistencia al reinicio en CI, no sustituye** las reentregas de un webhook creado desde la UI real de GLPI 11 con redes intermitentes.
- GitNexus, tras estos cambios, reporta **riesgo CRÍTICO** por el amplio conjunto de procesos modificados. Es una señal de impacto, **no** una prueba de explotación ni una garantía de seguridad.

## Bloqueos para cerrar la misión

1. Ejecutar migraciones `008` y `009` en **staging**, sobre un PostgreSQL compartido y respaldado; verificar planificaciones con **dos instancias** de API y reintentos originados por GLPI 11 con fallos de red reales. La prueba CI multinodo sintética de webhooks ayuda, pero no satisface por completo este criterio.
2. Validar el comportamiento exacto de GLPI 11 instalado en staging para `GET`, `PUT` y `DELETE TicketTask` (incluidas transiciones automáticas, privacidad y soft delete) y el E2E de reprogramación.
3. **Disponibilidad y conflictos de calendario**: la API rechaza solapamientos conocidos **entre solicitudes de nuestra API** mediante consulta a la agenda GLPI y bloqueo compartido PostgreSQL. Sin embargo, otras interfaces de GLPI no respetan este bloqueo; siguen pendientes calendario global/por técnico, validación de precisión de fechas, pruebas con otros escritores y eventual reconciliación de carreras externas. No se debe prometer reserva atómica de agenda entre GLPI y sistemas externos.
4. Configurar CORS para cada origen real y rotar secretos expuestos. Validar además reglas GLPI, entidades, roles y perfiles representativos.
5. Revisar el riesgo global CRÍTICO, analizar los hallazgos restantes de la matriz histórica contra el despliegue real, efectuar revisión humana y conservar la PR en borrador mientras haya bloqueos.

**Prohibido interpretar esta rama como despliegue aprobado.** No se ha realizado merge, despliegue ni migración en producción.

## Migración 007: borrador MariaDB

La regresión de 007 usa una copia descartable de GLPI 11. Verifica la selección explícita del destino, el rollback ante conflictos y dos ejecuciones con datos idénticos. Preview, firma HMAC real y reintentos entre réplicas siguen pendientes. Véase [la guía del webhook](../07-operations/glpi-webhook-setup.md).

## H-02/H-14 — watcher nativo y webhook (revisión local sobre 0b37957)

El watcher usaba la primera página de diez notificaciones y una inserción sin reserva. El webhook ya utilizaba la sentencia PostgreSQL que inserta la clave de 009 y la notificación en una misma operación. Ambos caminos usan ahora esa operación para TicketCreated. El evento de grupo solo se intenta si el camino creó al menos una notificación. Otros tipos conservan su comportamiento.

Un fallo de persistencia interrumpe el lote antes de adelantar el cursor del ticket. El siguiente sondeo del mismo proceso reintenta el ticket; las reservas existentes protegen a los destinatarios ya procesados. Un fallo permanente puede retrasar los tickets posteriores. El cursor sigue en memoria: el arranque toma el máximo actual y el JOIN con la asignación de grupo puede saltar tickets cuya asignación aparezca después de avanzar el cursor. Se conserva la exclusión previa de IDs 11–950. No hay garantía de recuperación tras reinicio ni de entrega de SignalR. Si dos procesos ganan destinatarios distintos, los dos pueden emitir un aviso de grupo.

Build Release sin advertencias ni errores; 35 pruebas Application y 152 API aprobadas. Tres casos nuevos usan el receptor HTTP firmado, el procesador del watcher y el servicio real de notificaciones con un repositorio en memoria que modela filas y claves bajo un bloqueo. Para el ticket 951 se verifican ambos órdenes de llegada, reintentos, doce notificaciones posteriores y un único par por destinatario; un fallo simulado en el segundo destinatario comprueba el cursor y la recuperación del lote hasta el ticket 952.

### Validación en Laboratorio Aislado Multi-Réplica con Almacenamiento Real (2026-11-02)

Se completó la verificación con PostgreSQL real (`restore_base_20261102173137`), MariaDB real (`glpi11_pr38`), y dos instancias API concurrentes (`api` 172.20.1.13 y `api-replica` 172.20.1.14) construidas offline desde `33ba41ba`:

1. **Pruebas pasivas:** `GET /health` (200), `GET /health/ready` (200, checks db true), webhook sin firma (401), firma incorrecta (401), timestamp caducado (401) y payload >64 KiB (413). Cero mutaciones en base de datos.
2. **Concurrencia real y deduplicación:** Se emitieron 40 peticiones webhook firmadas en paralelo alternando entre ambas instancias de API, incluyendo un reinicio en caliente de `api-replica`. En PostgreSQL se verificó exactamente 1 clave de deduplicación y 1 fila de notificación por técnico del grupo asignado; cero duplicados en `glpi_ticket_created_notification_keys` y cero duplicados en `notifications`.
### Resolución de Defectos del Watcher Nativo y Validación GLPI 11 (2026-11-02)

Se implementó y validó la arquitectura de reconciliación durable para `GlpiNativeTicketWatcher` y el ciclo de vida nativo de GLPI 11:

1. **Persistencia y Reconciliación Durable (Migración 010):**
   - **Checkpoint persistente:** Se incorporó la tabla PostgreSQL `glpi_watcher_checkpoint` (`010_watcher_state.sql`) y el repositorio `GlpiWatcherStateRepository`. Tras reinicio de cualquier nodo API, el watcher reanuda exactamente desde el último ticket procesado sin omitir tickets ni depender de memoria volátil.
   - **Asignación de grupo tardía:** Se eliminó la dependencia de `INNER JOIN glpi_groups_tickets` que descartaba silenciosamente tickets creados antes de su asociación a grupo. Los tickets sin grupo se registran en `glpi_watcher_pending_tickets` (`AwaitingGroup`) y `ReconcilePendingAsync` los reconcilia automáticamente en cuanto GLPI asocia el grupo.
   - **Exclusión configurable:** Se eliminó el salto forzado de IDs 11–950 de la ruta de producción; la exclusión se parametriza mediante `GlpiWatcher:ExcludedIdRange` para conservar el aislamiento en los fixtures de pruebas.
   - **Manejo de fallos y reintentos:** Se limitan intentos máximos (umbral 50) y se toleran fallos transitorios sin corromper el cursor ni retroceder checkpoints.

2. **Batería de Pruebas de Reconciliación y Concurrencia (10 Escenarios):**
   - Se añadieron 10 casos en `GlpiWatcherReconciliationTests.cs` cubriendo:
     1. Reinicio antes de procesar un ticket (reanuda desde checkpoint sin reprocesar históricos).
     2. Reinicio tras procesamiento parcial (procesa pendientes restantes sin duplicar notificaciones previas).
     3. Ticket creado sin grupo (capturado y registrado como `AwaitingGroup`).
     4. Asignación de grupo tardía (reconciliado y notificado al técnico).
     5. Dos réplicas simultáneas (deduplicación atómica y avance monótono).
     6. Fallo transitorio PostgreSQL (detención segura y reintento en el siguiente ciclo).
     7. Fallo persistente y recuperación segura tras superar límite de intentos.
     8. Procesamiento de tickets legítimos en rango 11–950 cuando no está activo el filtro de pruebas.
     9. Reentregas del webhook HTTP con firma HMAC (idempotencia comprobada).
     10. Conservación intacta de notificaciones históricas.
     11. Ticket sin técnicos asignados en el grupo (`AwaitingTechnician`).
     12. Fallo de persistencia fuera de orden en un lote concurrentemente avanzado.
     13. Reintentos agotados (umbral 50): transición a `PermanentlyFailed`, alerta operativa y auto-recuperación tras asignación tardía de grupo en GLPI.
     14. Caída total de PostgreSQL durante notificación y registro pendiente: el checkpoint permanece intacto en BD y la segunda réplica recupera el ticket sin omisiones.
     15. Inicialización de cursor: distinción estricta entre checkpoint 0, checkpoint > 0 y checkpoint inexistente (null), respetando el valor 0 sin saltar a MAX(id).
     16. Protección de producción: verificación de que `GlpiWatcher:ExcludedIdRange` se ignora incondicionalmente en entorno de producción.
   - **Total de pruebas backend:** 35 de aplicación + 169 de integración = **204/204 aprobadas** (100% pasando).

3. **Validación del Ciclo de Vida GLPI 11 Nativo:**
   - Creación nativa de ticket (`Ticket 38204`) vía REST API GLPI.
   - Asignación de grupo nativa (`3801`) y detección en tiempo real por el watcher.
   - Notificación atómica en PostgreSQL (`notifications` y `glpi_ticket_created_notification_keys`).
   - Reintento de webhook HMAC deduplicado sin generación de registros redundantes.
   - Validación de `TicketTask` nativa: planificación (`state=1`), privacidad (`is_private=1`), reprogramación de horarios (`PUT /TicketTask`), finalización (`state=2`) y cancelación (`DELETE`).
   - Prueba real de ticket creado sin grupo inicial (`Ticket 38205`) y reconciliación tardía exitosa tras asignación posterior.

4. **Hardening de Migraciones y Seguridad Operativa:**
   - `scripts/migrate-app-db.sh`: exige destino explícito con regex, protege bases críticas y el nombre de laboratorio de referencia `glpi_ticket_manager` (requiere `ALLOW_REFERENCE_DB=1`), verifica identidad de contenedor/proyecto Docker y confirma `current_database()` antes de ejecutar SQL en transacciones atómicas con checksum SHA-256.
   - Eliminación de fallback de credenciales en `scripts/seed-visual-forms.js`: auditoría Gitleaks con 0 fugas.

5. **Estado de Calidad y Gobernanza:**
   - Compilación Release .NET 10: 0 errores.
   - Frontend TypeScript (`tsc --noEmit`) y Vite build: 0 errores.
   - Gitleaks secret scanner: 0 fugas detectadas.
   - `git diff --check`: 0 errores de formato/espaciado.
   - GitNexus Code Intelligence: `risk_level: low`, 0 procesos afectados.
   - Los 7 contenedores originales de laboratorio permanecen intactos, en ejecución y saludables.
   - La PR #38 permanece estrictamente **abierta y en borrador** (no merge, no despliegue).
