# Checkpoint de finalización — GLPI Ticket Manager

## Refuerzo posterior de autorización y push — 2026-11-05

Cambios de código posteriores al montaje TLS, todavía sin desplegar en el entorno
original: M-12 deniega grupos técnicos del Hub a solicitantes incluso si pertenecen
a un grupo; conserva su canal personal y deniega también suscripción explícita.
M-13 elimina fallback a detalle sin filtrar cuando desaparece la lectura privada
restringida. Pruebas negativas de Hub/política y lectura concurrente PASS.
Un E2E nuevo añade pertenencia técnica al solicitante sintético sólo dentro de
H-20, utiliza WebSockets reales con control positivo del técnico y observa ausencia
de copia prohibida antes de retirar exclusivamente el vínculo temporal creado.

M-14: el envío push antes desprendido podía sobrevivir al scope y utilizar un
cliente liberado; el cambio previo de IDisposable hacía más visible esa carrera.
Se espera ahora el envío dentro del scope con presupuesto de 10 segundos y
cancelación del llamador. El fallo del proveedor conserva la notificación interna
persistida. El título/body de dispositivo sólo incluyen tipo de aviso/número de
ticket e invitación genérica a abrir la app, nunca título/descripción privada;
el detalle autorizado dentro de la app se conserva. Dos regresiones prueban
espera efectiva y privacidad, y supervivencia de la notificación ante fallo push.
Tradeoff: el envío puede añadir hasta 10 segundos al flujo notificante. Sigue
siendo best effort, sin afirmar entrega SO ni reintentos durables push.

Backend Windows Release actual: 51 aplicación + 212 API con dobles = 263 PASS.
GitNexus: TicketHub 3 consumidores; GetByIdAsync ambiguo/UNKNOWN y NotificationService
UNKNOWN por DI; detect-changes de autorización 12 símbolos/9 procesos, HIGH.
Fallback manual: endpoints de detalle, política de cola, hub automático/explícito,
servicios de notificación, watcher/webhook, repositorios y consumidores React.
Gates reales ampliados pendientes en CI, no se declara seguridad global aprobada.

Windows suite completa anterior: 41 PASS / 2 FAIL; uno era la creación directa
residual, otro editor enriquecido vacío. Cambios de prueba: login nativo por
tipo submit sin depender de idioma, entrada de descripción con eventos teclado
y blur, envío acotado. Revalidación selectiva con trace EN CURSO. Se conservaron
los artefactos locales y se retiró sólo el fixture anterior con guardas intactas.
Chrome original: Preferencias muestra notificaciones del dispositivo «No activadas»;
no se cambió permiso ni suscripción. Consola del recorrido sin error/warn.

## Cambio TLS autorizado — 2026-11-05 (último estado)

El usuario autorizó exclusivamente retirar ca.key y recrear ambos frontends
preservando recursos; **NO autorizó importar la CA**. Operación aplicada y
verificada: imagen local con los mismos 30 assets por frontend (hashes idénticos),
mounts readonly de server.crt/server.key, ca.key ausente tanto en contenedores
como en las 14 capas inspeccionadas de la imagen conservada. Backup duradero,
carga de imagen base y preflight de reversión verificados antes del cambio.
GLPI, API, ambas bases, proxy y frontend-prod mantienen ID/arranque/imagen/mounts;
conteos originales 43/0/16/9 sin cambios. No se desplegó el nuevo código del PR.

Autenticación real, tickets, notificaciones, salud y WebSocket Connected en
loopback y HTTPS localhost/LAN PASS con CA explícita, sin ignorar validación.
Chrome: sesión existente, Kanban y campana con 6 no leídas conservados. Avisos
de desconexión durante el reinicio previsto; cero avisos/error nuevos tras la
recarga posterior observada. Root usuario/equipo: cero coincidencias de la CA.
PWA/push SO y confianza normal siguen pendientes. Detalle, IDs, imagen, respaldo
y procedimiento exacto: [TLS-FORENSICS-20261105.md](TLS-FORENSICS-20261105.md).

QA interactivo adicional GLPI original: login técnico, interfaz estándar,
catálogo nativo y formulario Hardware sin enviar, consola sin error/warn.
Confirma 7 destacados + 2 generales, sin «Acceso a sistema». El Hardware antiguo
todavía exige categoría manual; los formularios especializados actuales del
fixture fijan categoría en destino. No se ejecuta el seed sobre datos persistentes.

CI Linux `42033186235`, SHA `2d7d1a4`: backend, frontend y secretos PASS;
E2E 42 PASS / 1 FAIL. Causa confirmada del fallo: realtime.spec aún intenta
POST /api/tickets, retirado deliberadamente. La corrección debe usar formulario
nativo y volver a validar antes de declarar el gate aprobado. SQL007 y la prueba
ampliada de VAPID/deduplicación entre procesos con reinicio PASARON dentro del
runner actual en Windows; la suite completa local continúa en ejecución.

## Continuación — 2026-11-05 (prevalece sobre los resultados anteriores)

**EN CURSO; PR #43 en borrador; sin merge ni despliegue persistente.** Rama
`codex/mission-audit-20261104`, HEAD publicado al iniciar esta continuación
`bda3c712fa047aeebb9399cf2f69be88b3517550`. Los cambios siguientes todavía
requieren el resultado de CI y revisión humana. No se delegó a otros agentes.

- M-09: retirada de la ruta pública POST /api/tickets y de los diálogos/cliente
  de creación en Ticket Manager. La creación corresponde a los formularios
  nativos de GLPI; las tarjetas de Servicios consultan tickets. Regresiones de
  cuatro roles esperan 405 y ninguna escritura GLPI.
- M-10: SignalR ya no usa Clients.All cuando falta grupo. Estado y solución se
  envían al usuario asignado/autor conocido y supervisores del grupo resuelto;
  creación y claim usan grupos explícitos en una única llamada. Regresión para
  todos los estados y resolución de grupo fallida. Limitación: se elige el primer
  grupo técnico positivo; el caso multigrupo requiere revisión adicional.
- M-11: suscripciones push validan HTTPS/443, proveedor permitido y claves P256/auth;
  redirecciones HTTP deshabilitadas. VAPID usa exclusión transaccional PostgreSQL
  entre procesos, conserva la pareja persistida y falla sin generar claves
  efímeras cuando falla la persistencia. Logs sin URL/token de suscripción.
  La respuesta de prueba sólo expresa aceptación del proveedor, no recepción SO.
- M-08/H-20: fixtures cubren SQL007 con esquema nativo recién instalado y replay
  firmado entre dos procesos API con reinicio. Ambas pruebas pasaron por separado.
  Se amplía la prueba a estabilidad VAPID concurrente, pendiente de integración.
  Todos los specs usan los destinos verificados; se corrigen expectativas de
  autocierre y dos creaciones residuales mediante Ticket Manager en el journey.
- M-06: discrepancia de huellas resuelta: hash del archivo PEM frente a huella
  del certificado DER, del mismo certificado actual. Ambos frontends presentan
  el mismo leaf válido con los tres SAN esperados. ca.key sigue expuesta a root
  por el montaje completo. El usuario NO autorizó importar la CA. Se preservaron
  assets públicos modificados de ambos frontends antes de proponer recreación.
  Investigación, límites y rollback: [TLS-FORENSICS-20261105.md](TLS-FORENSICS-20261105.md).
  Se excluyen claves/certificados/artefactos locales del contexto de build futuro;
  no se eliminaron caches ni se alteraron montajes o certificados actuales.

Evidencia acumulada: 50 pruebas de aplicación + 205 API con dobles PASS, Release;
TypeScript/build PWA y 8 pruebas de paginación PASS. Guardas 106/106 PASS con
Git Bash nativo. Con bash predeterminado Windows hubo fallos de plataforma al
apuntar a WSL sin /bin/bash; no se reportan como PASS ni como defecto de GLPI.
Último E2E selectivo: 5 PASS y 1 FAIL por expectativa obsoleta de autocierre,
corregida después. Ejecución completa siguiente detenida en SQL007 antes de
Playwright; guardas mantuvieron aislamiento y cleanup confirmó recursos retirados.
Se investiga timeout por comando con polling dentro del fixture, sin ampliar
permisos. Nueva ejecución completa EN CURSO; no convertir estos resultados en PASS.

QA interactivo real recuperado mediante extensión Chrome: login del técnico
`tech1` en el entorno original, Kanban, listado, filtro sin coincidencias,
limpieza de filtro, detalle y catálogo; revisión visual a 390x844 y restauración
del viewport. Cero mensajes console error/warn en ese recorrido. No se realizaron
mutaciones de tickets. El entorno original todavía muestra creación directa y
mezcla estados 5/6: confirma que estos cambios aún NO están desplegados. No se
equipara esta revisión parcial con QA completo de todos los roles, red, GLPI
original, accesibilidad, push Windows ni Android físico.

GitNexus local detect-changes: 21 archivos, 39 símbolos, 10 procesos, impacto HIGH;
índice base anterior y alcance PARCIAL, contrastado manualmente con interfaces,
endpoints, consumidores React y tests. Afecta creación, notificaciones realtime,
preferencias push y runner aislado. Requiere gates backend/frontend/E2E y revisión.
Rollback: revertir sólo commits de esta misión; sin restaurar ni borrar datos.
Siguiente: completar suite aislada, publicar los cambios en PR borrador y revisar
CI; pedir autorización específica para TLS tras presentar evidencia. Push nativo,
Android, catálogo original incompleto y avisos de dependencias siguen abiertos.

## Reanudación de misión — 2026-11-04 (estado actual)

**EN CURSO / NO APROBADO PARA PUBLICACIÓN.** Este bloque sustituye el estado de
las entregas históricas que siguen debajo; sus pruebas no se presentan como QA actual.
Rama de trabajo: `codex/mission-audit-20261104`, base
`db54bdc27ccabc9724c91d7cf6b13ef26e93ea66` (main y GitHub coincidían al inicio).
PR #38, #39, #40, #41 y #42 están fusionadas. PR #36 y #37 seguían abiertas;
no deben fusionarse sin revisar solapamientos con main y estas correcciones.
Se preservan los archivos sin seguimiento previos y ambos worktrees ajenos.

### Inventario observado antes de corregir

- Proyecto original Docker Compose: `sistemaopensourceglpi`, directorio original.
  API `glpi-api`, GLPI `glpi`, MariaDB `glpi-db`, PostgreSQL `glpi-app-db`,
  frontend `glpi-frontend`, LAN `glpi-lan-frontend`, proxy `glpi-nginx`.
- API apunta a MariaDB `glpi-db/glpi`, PostgreSQL `app-db/glpi_ticket_manager`
  y GLPI `http://glpi/apirest.php/` dentro de la misma red original.
  Los proyectos `glpi-pr38-staging-20261102` y `glpi-pr38-lab-20261102`
  usan otros volúmenes/redes; no se reutilizan como fixture H-20.
- Volúmenes originales observados: `sistemaopensourceglpi_glpi-db-data`,
  `sistemaopensourceglpi_app-db-data`, `sistemaopensourceglpi_glpi-data`,
  `sistemaopensourceglpi_glpi-plugins`. No se eliminaron ni reemplazaron.
- Inicio: Docker estaba detenido. Se inició Docker Desktop; sus contenedores
  existentes arrancaron según sus políticas. No se reconstruyó el entorno persistente.
- Salud original: `http://localhost:8080/health/ready` HTTP 200; frontend
  `http://localhost:5173` y `http://10.10.40.31` HTTP 200 con los mismos
  assets de main (`index-dEqxTVV0.js`, `index-CubZHqcY.css`).
  GLPI original: `http://localhost:8081`. HTTPS no queda validado como confiable.
- MariaDB 10.11.19: 43 tickets, ninguno eliminado; 16 categorías originales y
  sus grupos presentes. Se observaron 9 formularios activos: 2 generales y 7
  destacados. Falta la tarjeta/formulario destacado «Acceso a sistema».
  Hay 3 grupos técnicos, 48 acciones automáticas, 2 webhooks y 0 SLA definidos.
  La existencia de reglas no demuestra que todos sus recorridos funcionen.

### Hallazgos y cambios de esta revisión

1. **H-20 / crítico: guardas desconectadas.** El guard aislado pasaba 68 casos,
   pero configuración/global setup de Playwright y varios helpers conservaban
   destinos fijos del entorno persistente. Se reconectaron al guard común, con
   manifest, identidades, redes, tmpfs, sentinels y consentimiento por ejecución.
   Se conservaron las definiciones actuales de categorías/formularios.
   Las pruebas negativas ahora revisan estáticamente el helper ANTES de invocarlo,
   para impedir que una regresión convierta la propia prueba en una mutación real.
   La primera ejecución de esas pruebas llegó a invocar helpers inseguros;
   después se comprobaron los conteos 43/16/9 sin cambios. No se dispone de una
   instantánea fila por fila previa: estos conteos no prueban ausencia de toda mutación.
2. **M-01: listas truncadas.** Cola limitada a 20 y asignados a 100, pese a filtrar
   y contar en cliente. Se cargan todas las páginas autorizadas de 100, con
   cancelación; páginas vacías, duplicados o totales cambiantes fallan sin
   publicar una lista parcial. El orden SQL incorpora desempate por ID.
   Consumidores: Kanban, listado, cola y dashboard del técnico. No hay snapshot
   transaccional entre páginas: una lista que cambia requiere reintento.
   El coste crece con el número de páginas y siguen vigentes los rate limits.
3. **M-02: privacidad de planificación.** La cola duplicaba la proyección SQL y
   omitía el filtro privado en cuatro subconsultas. Comparte ahora BaseProjection,
   que excluye esas tareas de los metadatos resumidos para todos los consumidores.
   Se añadió una regresión contra MariaDB real dentro de H-20.
4. **M-03: resolución/cierre.** Resolver forzaba una segunda escritura a estado 6.
   Se conserva el resultado confirmado en GLPI sin forzar cierre. Kanban muestra
   solamente estado 5 en Resuelto; estado 6 sigue accesible por listado/historial.
   Se mantienen permisos, API nativa y lectura de confirmación. Las pruebas que
   exigían autocierre se actualizaron por este cambio explícito de requisito.
5. **M-04: contadores realtime.** Un TicketClaimed repetido decrementaba total
   aunque la tarjeta ya no estuviera en la cola. Se evita ese segundo decremento.
   El dashboard muestra error si fallan los agregados, evitando indicadores falsos.
6. **M-05: secretos/documentación.** Se retiraron contraseñas obsoletas publicadas
   en README y la recomendación de borrar volúmenes. Las credenciales vigentes
   siguen exclusivamente en el archivo local ignorado. También se sustituyó una
   URL remota local de rama con credencial incrustada por la referencia origin;
   no se rotaron contraseñas/tokens ni se publicó su contenido.
7. **M-06: TLS.** Cadena X.509 y correspondencia de las claves verificadas
   localmente, SANs localhost/127.0.0.1/10.10.40.31 y vigencia comprobadas.
   La CA no figura en los almacenes Root de usuario/equipo consultados; Node
   rechaza la cadena con UNABLE_TO_VERIFY_LEAF_SIGNATURE. La configuración local
   ahora monta sólo server.crt/server.key: deja fuera ca.key del frontend.
   El cambio de mounts aún NO está desplegado. Instalar la CA en Windows exige
   confirmación específica; no se ignoró TLS ni se alteró la confianza.
8. **M-07: dependencias.** Auditoría pnpm inicial: 2 altas, 3 moderadas, 1 baja.
   Zod 4.6.6 + resolvers 5.9.2 y actualización transitiva de follow-redirects
   eliminan las dos altas. Quedan 3 moderadas y 1 baja en herramientas de build
   (Vite, glob, minimatch, deepmerge); no se declara auditoría limpia.
9. **M-08: fixture desactualizado.** Se añaden migraciones PostgreSQL 008–011
   (ambos scripts 009 son distintos); SQL007 permanece fuera por ser MariaDB.
   El arranque de la API espera exclusivamente en el fixture hasta el bootstrap.
   El generador hexadecimal asegura los 16 caracteres distintos exigidos también
   al secreto webhook; no se debilita el validador de producción.
   CI usa el fixture descartable y formularios nativos; elimina el arranque con
   secretos persistentes. Los antiguos smoke tests multinodo/007 deben adaptarse
   al fixture antes de dar por recuperada su cobertura: NO_VERIFICADOS aquí.

### Pruebas actuales y límites

- Backend Release Windows: PASS, 0 advertencias/errores, 50 unitarias y 177
  pruebas API con dobles. Resultados TRX en TestResults locales (no versionados).
- TypeScript y build frontend/PWA: PASS tras actualización de dependencias;
  persiste advertencia de bundle >500 kB.
- Regresiones de paginación: 8/8 PASS; guardas y limpieza H-20: 103/103 PASS.
- Gitleaks 8.30.1 (binario oficial y checksum verificado): PASS sobre cambios
  preparados, sin hallazgos; no se escanearon/publicaron credenciales locales.
- NuGet, incluidos transitivos: sin avisos conocidos en el feed consultado.
  Esto no equivale a ausencia de vulnerabilidades de la aplicación.
- Autenticación por API real: admin_test (admin), lider_dev/lider_bi/lider_sd
  (supervisor), tech_dev/tech_bi/tech_sd (technician), user_test (solicitante):
  8/8 HTTP 200 en Ticket Manager y GLPI initSession; sesiones GLPI cerradas.
  Se usaron las credenciales vigentes sin copiarlas a evidencia.
- Negativas reales para los 3 técnicos y 3 líderes: cola propia 200, cola de otro
  grupo 403 y endpoint administrativo 403. No sustituye auditoría multi-entidad,
  perfiles/derechos GLPI, acceso por ID, privacidad completa o concurrencia.
- E2E real: EN CURSO. Dos intentos fallaron antes de las pruebas (identidad de
  servicio al arrancar / API no lista). Se retiraron sólo sus recursos exclusivos.
  No se clasificó automáticamente exit 139 como defecto nativo: ambos binarios
  (original y nuevo) también devuelven ese código ante configuración inválida;
  una sonda mínima CLR funciona en ambas imágenes. Falta resultado concluyente.
- QA manual: NO_VERIFICADO. El navegador embebido no llegó a adjuntarse y el
  control de Chrome terminó por no poder identificar su URL con suficiente certeza.
  No se presentan scripts Playwright como clics manuales.
- Push Windows real, Android físico, ciclo completo por rol, reconexión/latencia,
  aprobación de solución y cierre nativo: NO_VERIFICADOS actualmente.
- Lint: NOT_CONFIGURED (no script específico); TypeScript no se etiqueta como lint.
- GitNexus local 1.6.12 reindexado con --skip-agents-md --skip-skills;
  AGENTS.md preservado. Hay flujos truncados y símbolos ResolveAsync/UpdateStatusAsync
  ambiguos: alcance PARCIAL, completado con rg de interfaces, endpoints, React,
  consultas y pruebas. detect-changes: 70 símbolos y 28 procesos afectados; riesgo
  CRÍTICO de impacto, que requiere revisión reforzada (no es vulnerabilidad demostrada).

### Siguiente y rollback

Completar fixture/E2E y QA manual; reparar los avisos restantes sin actualizaciones
mayores a ciegas, validar la tarjeta faltante mediante API/UI GLPI y respaldo;
revisar PR obsoletos. Publicar sólo PR en borrador mientras falten gates.
No se fusionó, migró ni desplegó esta rama en el entorno persistente.
Rollback del código: revertir exclusivamente los commits de esta revisión;
no restaurar/borrar bases ni volúmenes. No hay migración de datos propia aplicada
al entorno original. La versión original continúa sirviéndose hasta autorización
y verificación de una entrega completa.

Fuentes de contraste: [ciclo GLPI](https://help.glpi-project.org/documentation/modules/assistance/tickets/ticketlifecycle),
[aprobación de soluciones](https://help.glpi-project.org/documentation/modules/assistance/tabs/solution),
[autorización OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

---

## Registro histórico (no representa la verificación de 2026-11-04)

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

### Validación Integral en Entorno de Staging Aislado, Pasarela de Demostración y Recuperación Operativa HTTP/UI (2026-11-02 / 2026-11-03)

Se construyó y verificó un entorno completo de staging descartable (`glpi-pr38-staging-20261102`) estrictamente aislado de internet (`internal: true`, `enable_ipv6: false`, `gateway_mode_ipv4: isolated`, DNS interno `172.31.138.53` sin reenviadores externos) con pasarela endurecida Nginx (`https://10.10.40.31:8443`; redirección `308 Permanent Redirect` desde `http://10.10.40.31:8088`), dos réplicas de API (`api` y `api-replica`), PostgreSQL 16.15 (`glpi_ticket_manager_staging`), MariaDB 10.11.19 (`glpi11_staging`) y motor real GLPI 11.0.11 (imágenes y versiones idénticas al laboratorio de referencia):

1. **Visibilidad, Contadores Exactos y Recuperación Operativa de Fallos Permanentes (`PermanentlyFailed`):**
   - `GET /health/ready` es un endpoint anónimo de infraestructura y devuelve exclusivamente la salud de MariaDB y PostgreSQL, sin exponer contadores internos del watcher.
   - `GET /api/admin/watcher-status` (exclusivo para rol `Admin`) consulta el conteo exacto en PostgreSQL mediante `COUNT(*) FILTER (...)` (`GetQueueCountsAsync`), independiente del límite `LIMIT 100` del listado de detalle, e informa `permanentlyFailedTicketsTruncated` cuando existen más de 100 filas en `PermanentlyFailed`.
   - Se agregaron los endpoints exclusivos para administradores `GET /api/admin/watcher-status` y `POST /api/admin/watcher/recover/{ticketId:int}` (`AdminEndpoints.cs`), cubiertos por los escenarios 17 y 18 de `GlpiWatcherReconciliationTests.cs`.
   - En `AdminDashboard.tsx` (`/administracion`) se incorporó la tarjeta `Estado operativo del Watcher GLPI` con botón interactivo `"Recuperar ticket"`, aviso de lista truncada (>100) y en `App.tsx` el banner persistente `"ENTORNO DE DEMOSTRACIÓN — NO PRODUCCIÓN"` (`data-testid="demo-environment-banner"`).

2. **Corrección de Deduplicación y Asignación Autorizada de Grupo en `TicketService.CreateTicketAsync`:**
   - `TicketService.CreateTicketAsync` utiliza `_persistentNotifications.CreateTicketCreatedOnceAsync(...)`, garantizando exactamente 1 fila en `notifications` por `(user_id, ticket_id)` independientemente de si el ticket entra por API, Watcher o Webhook.
   - Se eliminó el fallback silencioso al grupo fijo `1` (`targetGroupId = 1`). `TicketRepository.GetAssignmentGroupForCategoryAsync` resuelve el grupo asignable (`g.is_assign = 1`) recorriendo la jerarquía completa de categorías (`WITH RECURSIVE category_chain`) y respetando el aislamiento multi-entidad (`entities_id = @EntityId` o ancestro con `is_recursive = 1`), priorizando las reglas activas de `glpi_rules` / `glpi_rulecriterias` (`CAST(rc.pattern AS SIGNED) = cc.id`) / `glpi_ruleactions` y el `groups_id` técnico de la categoría. Si la solicitud carece de categoría/grupo autorizado o pertenece a otra entidad, lanza `ValidationException` (`400 Bad Request`).
   - **Total de pruebas backend:** 39 de aplicación + 172 de integración = **211/211 aprobadas** (0 errores, 0 advertencias).

3. **Migraciones, Respaldos y Regresión 007 / 008–010:**
   - PostgreSQL (`glpi_ticket_manager_staging`): migraciones `001`..`006`, `008`..`010` aplicadas en dos pasadas idempotentes mediante `scripts/migrate-app-db.sh`, verificación de guardas de seguridad, prueba con duplicados históricos previos y ensayo completo de `pg_dump -Fc` + `pg_restore`.
   - MariaDB (`glpi11_staging`): migración `007_glpi_webhook_config.sql` aplicada en dos pasadas idempotentes, regresión automatizada `scripts/test-glpi-007.sh` aprobada, entrega nativa real de `QueuedWebhook` firmada por GLPI 11 (`last_status_code = 200` tras habilitar `GLPI_SERVERSIDE_URL_ALLOWLIST` en `/var/www/glpi/config/local_define.php`) y ensayo de restauración con sumas SHA-256.

4. **PKI de Staging, Redirección HTTPS y Auditoría Visual/Funcional en Navegador Real (Playwright Chromium):**
   - Autoridad raíz dedicada `GSI-ServiceDesk-Staging-Root-CA.crt` + certificado de servidor `demo.crt` (SANs `IP:10.10.40.31`, `IP:127.0.0.1`, `DNS:localhost`, `DNS:glpi-staging.local`) verificados con cadena X.509 completa; el puerto HTTP `:8088` redirige todo tráfico externo mediante `308 Permanent Redirect` hacia `https://$host:8443$request_uri` y restringe `POST /api/integrations/glpi/ticket-created` a la subred Docker interna `172.31.138.0/24`.
   - Verificados interactivamente los 5 roles (`admin_test`, `lider_dev`, `tech1`, `tech_bi`, `solicitante_test`), la recuperación de un fallo permanente en `/administracion`, la reprogramación de `TicketTask #13` en `/tickets/1006`, la tarea completada en `/tickets/1005` y los 4 viewports obligatorios (`1440x900`, `1366x768`, `390x844`, `360x800`) sobre `https://10.10.40.31:8443` con `ip_hash` en el upstream de Nginx para sesiones sticky de SignalR WebSockets (`/hubs/tickets`): **0 errores de consola, 0 errores de página, 0 respuestas 5xx y 0 desbordamientos horizontales**.
   - Los 7 contenedores originales del laboratorio permanecen intactos y saludables; la PR #38 continúa **abierta y en borrador**.
