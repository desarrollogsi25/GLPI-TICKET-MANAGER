# Checkpoint de finalización — GLPI Ticket Manager

> **Control documental ISO 9001 / ISO 27001**  
> **Código:** DOC-12-SEC-MISSION | **Fecha:** 2026-11-02 | **Estado:** implementación en PR **borrador**, no autorizada para producción.

## Alcance de la PR #38

La rama `codex/planned-ticket-task-20261102` incorpora el paso **En proceso (planificado)** mediante la creación de una `TicketTask` nativa pendiente (`state=1`) con `begin`, `end` y `actiontime`. No establece arbitrariamente `status=3`: GLPI 11 debe confirmarlo por lectura posterior. Si el ticket está Pendiente (4), el backend primero solicita volver a Asignado (2), lo confirma, y entonces crea la tarea. La clave de solicitud de planificación se reserva en PostgreSQL mediante la migración `008` para tolerar reintentos y dos instancias de API.

La tarea se puede **consultar, reprogramar, completar y cancelar** con permisos de ticket y técnico; las operaciones se realizan por API REST nativa de GLPI (nunca con SQL directo). `GET /api/tickets/{id}/tasks` ofrece la línea temporal y oculta tareas privadas a solicitantes. Reprogramar usa una clave durable de idempotencia y exige lectura de confirmación de fechas; completar valida `state=2`; cancelar comprueba que ya no aparezca la tarea. Las transiciones de estado que pueda realizar GLPI como efecto secundario se leen desde GLPI y se transmiten por SignalR; la API no fuerza artificialmente `status=3` al terminar o borrar una tarea.

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

- `.NET Release`: 35 pruebas de aplicación + 147 de integración (**182/182**), incluyendo privacidad y control de acceso a tareas, y reprogramación, finalización y cancelación contra el doble de GLPI.
- `frontend`: `npm run build` / TypeScript y Vite correctos. Un E2E real en `full-user-journey.spec.ts` comprueba que la tarea aparece tras planificar y se reprograma por REST; su resultado en CI es requisito de aceptación.
- Antes de este lote, CI #139 de la corrección H-01 pasó backend, frontend, escaneo de secretos y E2E. La verificación de **este** lote queda pendiente del nuevo commit y CI.
- GitNexus, tras estos cambios, reporta **riesgo CRÍTICO** por el amplio conjunto de procesos modificados. Es una señal de impacto, **no** una prueba de explotación ni una garantía de seguridad.

## Bloqueos para cerrar la misión

1. Ejecutar migraciones `008` y `009` en **staging**, sobre un PostgreSQL compartido y respaldado; verificar planificaciones y webhooks con **dos instancias** de API y reintentos de GLPI 11 con fallos de red reales.
2. Validar el comportamiento exacto de GLPI 11 instalado en staging para `GET`, `PUT` y `DELETE TicketTask` (incluidas transiciones automáticas, privacidad y soft delete) y el E2E de reprogramación.
3. **Disponibilidad entre técnicos y conflictos de calendario**: el timeline muestra tareas del ticket, pero todavía **no bloquea solapamientos entre tickets** de un mismo técnico. No se debe prometer reserva atómica de agenda entre GLPI y la API sin una solución transaccional coordinada.
4. Configurar CORS para cada origen real y rotar secretos expuestos. Validar además reglas GLPI, entidades, roles y perfiles representativos.
5. Revisar el riesgo global CRÍTICO, analizar los hallazgos restantes de la matriz histórica contra el despliegue real, efectuar revisión humana y conservar la PR en borrador mientras haya bloqueos.

**Prohibido interpretar esta rama como despliegue aprobado.** No se ha realizado merge, despliegue ni migración en producción.
