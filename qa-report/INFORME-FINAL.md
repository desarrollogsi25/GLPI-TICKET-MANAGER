# Informe QA final — GLPI Ticket Manager (Service Desk + GLPI nativo)

**Auditoría:** regresión visual + funcional sobre el despliegue real
**Fecha:** 2026-10-21
**Alcance:** `http://10.10.40.25` (Service Desk / frontend Angular + API .NET) y `http://10.10.40.25:8081` (GLPI nativo 11.0.11)
**Rama auditada:** `main` @ `21d7de3` — *feat(qa): apply QA audit fixes across GLPI catalog, technicians cross-assignment, and frontend UX/a11y (#26)*
**Bundle desplegado:** `/assets/index-CQ0lCX_s.js` · `/assets/index-B4g2zKtV.css`

---

## 1. Resumen ejecutivo

El PR es **sólido en el frontend**: la regresión visual está corregida (acentos, textos del Kanban, indicador de conexión, skeletons del dashboard), los flujos E2E del técnico y del administrador funcionan de punta a punta, la realtime por SignalR propaga cambios entre sesiones y la app responde bien en iPhone 12 con **0 errores de consola**.

Los tres puntos que bloquean el visto bueno son:

| # | Bloqueante | Ámbito | Evidencia |
|---|---|---|---|
| **B1** | El desplegable **Categoría** de los formularios de GLPI está **vacío** ⇒ el solicitante **no puede crear ningún ticket** | Seed / despliegue GLPI | `select[name="answers_2[items_id]"]` con **1 sola opción `-----`** |
| **B2** | En el Kanban el botón **“Resuelto” sigue activo** en tickets cerrados ⇒ genera `409` y un toast de error | Frontend (gating de rol) | `POST /api/tickets/317/solutions` → **409** |
| **B3** | Lighthouse de accesibilidad en `/kanban` = **0.96** (no 1.00) por **contraste insuficiente** durante la animación de entrada | Frontend (animación) | axe `color-contrast` 1.9:1 vs 4.5:1 exigido |

**Veredicto para la demo: ⚠️ CONDICIONAL.** El Service Desk (frontend + API) está listo para enseñar. La parte de GLPI nativo **no** está lista: sin categoría no hay alta de tickets, y si el jefe pide “crear un ticket desde el formulario de GLPI” la demo se cae.

---

## 2. Método y restricciones

- **Restricción dura respetada:** cero SQL, cero `curl`, cero inyección de datos por API. Todo se hizo **navegando, escribiendo y clic** como un usuario real.
- Se combinaron dos motores:
  - **Browser MCP** (`@playwright/mcp`, Chromium) para navegación interactiva, lectura del árbol de accesibilidad, DevTools y Lighthouse.
  - **Scripts Playwright** (`frontend/qa-*.mjs`, desechados al terminar) para: emulación real de iPhone 12 (`devices['iPhone 12']`), muestreo temporal de la animación de entrada, medición de skeletons y barridos de consola/red.
- La **inspección de código del contenedor GLPI** (`docker exec glpi … cat/grep` sobre `/var/www/glpi/src`) se usó sólo en modo **lectura** para acortar el diagnóstico del bloqueante B1. No se ejecutó ninguna sentencia SQL ni se modificó la instancia.
- Credenciales usadas: `solicitante_test / Soli123!`, `tecnico_test1 / Tec123!`, `admin_test / Admin123!`, `glpi / glpi` (super-admin GLPI).

---

## 3. Veredictos por fase

| # | Requisito | Veredicto | Evidencia clave |
|---|---|---|---|
| **Fase 1 — Regresión** | | | |
| 1.1 | GLPI home: tarjetas reales + acentos correctos (sin `?`) | ✅ PASS | 4 tarjetas `card mx-1 my-2 flex-grow-1` de 253×254 px; 0 mojibake (“artículos”, “técnico”, “Catálogo”, “petición”, “Categoría”, “Título”, “Descripción”) |
| 1.1b | Desplegable **Categoría** poblado con Hardware/Software | ❌ **FAIL** | `answers_2[items_id]` → 1 opción `-----`; sin AJAX; Select2 abre con 0 resultados → **ticket imposible de crear** |
| 1.2a | Kanban: el texto debe hablar de botones, no de “Arrastra” | ✅ PASS | “Usa los botones de acción en cada tarjeta para cambiar su estado según el flujo operativo.” |
| 1.2b | Indicador de conexión sin parpadeo al navegar | ✅ PASS | Estado único “Conectado en tiempo real” en Kanban → Tickets → Cola → Kanban, sin flickering |
| 1.2c | Dashboard: skeletons grises animados al recargar | ✅ PASS | Muestra 0: **8** divs `bg-muted shimmer-effect h-28 w-full rounded-xl`; luego datos reales (72 → 312 líneas) |
| 1.3 | Botones de estado “hacia atrás” deshabilitados en Resuelto/Cerrado | ⚠️ **FAIL parcial** | 6 de 7 botones deshabilitados, pero **“Resuelto” queda activo** → `POST /api/tickets/317/solutions` → **409** |
| 1.4 | Lighthouse accesibilidad ≥ 100 | ⚠️ **FAIL parcial** | `/tickets` = **1.00** ✅ · `/kanban` = **0.96** ❌ (color-contrast) |
| **Fase 2 — E2E** | | | |
| 2.1 | Técnico: Cola → Asignarme → Iniciar → Resolver | ✅ PASS | `claim` 200 (×2) → `PATCH status` 204 → `POST solutions` 201 → modal cierra, tarjeta a *Resuelto/Listo* (10→11) + toast de éxito |
| 2.2 | Realtime: la tarjeta aparece en el Kanban sin recargar | ✅ PASS (con matiz) | Handshake SignalR OK + evento `TicketStatusChanged` recibido en la otra pestaña y **refetch sin reload** |
| 2.3 | Admin puede mover un ticket Cerrado a En progreso | ✅ PASS | `PATCH /api/tickets/317/status` → 204 + toast “Estado actualizado”; persiste tras recargar |
| **Fase 3 — Estrés** | | | |
| 3.1 | Formularios: vacío / blancos / exceso de longitud | ✅ PASS | Vacío y blancos bloqueados **sin enviar nada** (0 requests) + mensaje en español; 6600 chars → 400 con toast visible |
| 3.2 | Responsive iPhone 12 (Kanban, lista, filtros) | ✅ PASS | 0 scroll horizontal, 0 desbordes, 0 errores de consola; bottom nav fija con safe-area |
| 3.3 | Consola / red en todas las pantallas y roles | ✅ PASS | 4 combinaciones de rol × 7 rutas: **0 errores, 0 warnings, 0 requests fallidas** |
| 3.4 | Búsqueda + filtros de fecha/prioridad | ⚠️ **FAIL parcial** | Búsqueda, estado, prioridad y rango válido OK; **rango invertido** → `400` con mensaje en inglés |

**Global: 10 ✅ PASS · 4 ⚠️ FAIL parciales · 2 ❌ FAIL (1.1b bloqueante, 1.4 en `/kanban`) · 1 flujo no verificable por bloqueo (2.2b).**

---

## 4. Fase 1 — Regresión

### 1.1 ✅ Tarjetas y acentos en GLPI home

Las cuatro tarjetas del *home* de GLPI se renderizan como tarjetas reales (`card mx-1 my-2 flex-grow-1`, 253×254 px). Cero caracteres mojibake en los textos de negocio: “artículos”, “técnico”, “Catálogo”, “petición”, “Categoría”, “Título”, “Descripción”.

📸 `final-shots/01-glpi-inicio-cards-textos-ok.png`

### 1.1b ❌ Desplegable Categoría vacío — **BLOQUEANTE**

**Observado**

| Comprobación | Resultado |
|---|---|
| `select[name="answers_2[items_id]"]` (formulario *Reportar un problema*) | **1 opción**: `-----` |
| `select[name="answers_10[items_id]"]` (formulario *Solicitar un servicio*) | **1 opción**: `-----` |
| Llamadas AJAX del widget Select2 | **0** (la lista se hornea en el HTML) |
| Select2 al abrir | **0 resultados** (ni siquiera “sin resultados”) |
| Formulario clásico GLPI `itilcategories_id` (`/front/ticket.form.php?id=-1`) | **1 opción**: `-----` |
| Dropdown “Como hijo de” dentro del formulario de una categoría | **1 opción**: `-----` |

**Los datos NO faltan.** En `/front/itilcategory.php` existen **11 categorías ITIL**: Requerimiento, Requerimiento > Acceso a sistema, Software, Aplicaciones, Sistema, Requerimiento Service Desk, Requerimiento BI, Aplicaciones GSI, Periféricos, Hardware, Informes. La ficha de *Hardware* (ID 11) muestra `entities_id = 0`, “Visible en la interfaz simplificada = Sí”, “Visible para una incidencia / solicitud / problema / cambio = Sí” y el grupo soporte **Hardware** correctamente asignado.

📸 `final-shots/02-glpi-categoria-vacia-FAIL.png` · `10-glpi-dropdown-categoria-sin-opciones.png` · `07-glpi-categorias-itil-lista.png` · `11-glpi-categoria-hardware-entidad.png` · `12-glpi-ticket-clasico-categorias.png`

**Causa raíz (lado GLPI/seed, no frontend)**

1. `scripts/glpi-base.sql` (L5894 / L5902) crea la pregunta “Categoría” como `QuestionTypeItemDropdown` con la config
   `{"itemtype":"ITILCategory","categories_filter":["request","incident","change","problem"],"root_items_id":0,"subtree_depth":0,"selectable_tree_root":false}`.
2. `scripts/seed-glpi-categories.js` inserta las categorías con **SQL crudo**: la lista de columnas del `INSERT` (L141) **no incluye `ancestors_cache` ni `sons_cache`**, y el `UPDATE` (L119-137) fija `itilcategories_id = 0` y `level = 1` de forma plana. Nunca se pasa por la API de GLPI (`ITILCategory::add()/update()`), que es lo que regenera los caches del árbol (`regenerateTreeUnderID` / `cleanParentsSons`) — y el *tree dropdown* de GLPI es justamente lo que resuelve esta pregunta. **Causa más probable del fallo**: el árbol queda **inconsistente** (`completename` con la ruta “Padre > Hijo”, `itilcategories_id`/`level` aplanados y caches de árbol vacíos) ⇒ el desplegable no resuelve ningún nodo seleccionable. Los descartes verificados: no es la paleta (slate-800 sí se aplica), no es `is_active` (`glpi_itilcategories` no tiene esa columna), no es `subtree_depth` (en GLPI 11 `0` significa “sin filtro de nivel”, no “nivel 0”), y no es `is_helpdeskvisible` (las 7 categorías visibles lo tienen a `Sí`).
3. Además, la instancia **no tiene ningún “Elemento Ticket” (servicio)**: `/front/service.php` → “Elemento no encontrado” y el catálogo de servicios sale vacío. 📸 `13-glpi-elementos-ticket-vacio.png` · `09-glpi-servicecatalog.png`
4. Y el `destConfig` que siembra `scripts/seed-visual-forms.js` **no mapea la respuesta de categoría al campo `itilcategories_id` del ticket**, de modo que, aunque se arreglara el desplegable, el ticket creado seguiría llegando sin categoría al backend (y el auto-enrutado por categoría no se aplicaría).

**Contexto adicional del despliegue GLPI:** el catálogo de formularios (`/front/form/form.php`) muestra **9 formularios** en “Entidad raíz” — “Reportar un problema”, “Solicitar un servicio” y los 7 generados por el seed (Requerimiento Service Desk, Requerimiento BI, Aplicaciones GSI, Periféricos, Hardware, Software, Informes). El formulario *Reportar un problema* expone las preguntas `answers_1` (6 opciones), `answers_2[items_id]` (**1 opción**) y `answers_4[]` (**0 opciones**). 📸 `16-glpi-formularios-lista.png` · `17-glpi-form-editor.png` · `18-glpi-form-preguntas.png`

**Fix propuesto (propiedad de Antigravity — GLPI/seed, fuera del alcance del frontend)**

- Re-guardar las categorías **a través de la API/UI de GLPI** (o ejecutar `regenerateTreeUnderID` / rellenar `ancestors_cache`, `sons_cache` y `level` de forma coherente con la jerarquía) en lugar de SQL crudo.
- Añadir al menos un *Elemento Ticket* por categoría y activar la opción de mostrar todas las categorías ITIL.
- Añadir la estrategia de categoría (`itilcategories_id`) en el destino del formulario para que la respuesta se copie al ticket.

### 1.2 ✅ / 1.2b ✅ / 1.2c ✅

- **Kanban**: el texto de ayuda menciona explícitamente los botones de acción; no hay referencias a arrastrar y soltar. La columna vacía muestra “No hay tickets aquí”.
- **Indicador de conexión**: estado único y estable “Conectado en tiempo real” a lo largo de Kanban → Tickets → Cola → Kanban. Sin parpadeos ni reconexiones visibles.
- **Dashboard**: al recargar aparecen **8** tarjetas skeleton con la clase `bg-muted shimmer-effect h-28 w-full rounded-xl` y efecto `shimmer`; al llegar los datos se sustituyen por el contenido real.

📸 `final-shots/06-dashboard-cargando-skeleton.png` · `07-dashboard-cargado.png`

### 1.3 ⚠️ Botón “Resuelto” activo en tickets cerrados

Sobre el ticket **#317** (Cerrado), logged in como **técnico**:

| Botón | Estado |
|---|---|
| Resolver | deshabilitado (`opacity 0.5`) ✅ |
| Nuevo / Asignado / Planificado / Pendiente / Cerrado | deshabilitados (`opacity 0.5`) ✅ |
| **Resuelto** | **HABILITADO** ❌ |

Al pulsarlo se abre el modal *Resolver* y al enviar la solución:
`POST /api/tickets/317/solutions` → **409**
> **No se pudo guardar la solución** — No se puede agregar una solución al ticket 317 porque ya está cerrado.

(toast `role="alert"`, `aria-live="polite"`, correctamente visible)

Como **admin** el gating es correcto y role-aware: todos los estados de retroceso están habilitados y sólo “Resolver” y “Cerrado” (el estado actual) quedan deshabilitados.

**Fix propuesto (frontend):** incluir el estado `Resuelto` en el mismo criterio de bloqueo que `Cerrado` para el rol técnico (`status === 6` ⇒ transiciones de retroceso deshabilitadas), tal como ya se hace con el resto de botones.

📸 `final-shots/error-409-resolver-ticket-cerrado.png`

### 1.4 ⚠️ Lighthouse — `/kanban` baja a 0.96

| Ruta | Accesibilidad | Best practices | SEO |
|---|---|---|---|
| `/tickets` | **1.00** ✅ | 1.00 | 0.8 |
| `/kanban` | **0.96** ❌ | 1.00 | 0.8 |

Único fallo de a11y: **`color-contrast`**. Nodo señalado:

```html
<p class="text-xs text-slate-800">   →  “No hay tickets aquí”
```
> Element has insufficient color contrast of **1.9** (foreground `#b4b9c0`, background `#fafbfd`, 12 px, normal). Expected contrast ratio of **4.5:1**

**Causa raíz (frontend):** ese `<p>` está dentro de un `motion.div` con `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` (`frontend/src/features/tickets/Kanban.tsx` L329-337). Muestreando la opacidad efectiva cada 60 ms se ve el ciclo completo:

| t (ms) | opacidad efectiva | color |
|---|---|---|
| 60 | **0.00** | `oklch(0.279 0.041 260.031)` |
| 120 | **0.00** | idem |
| … | … | … |
| 2340 | **1.00** | idem |

Una vez asentada la animación el color real es slate-800 (`#1e293b`, ~13:1) y **no hay problema de paleta**: lo que axe mide es el texto a mitad del *fade-in*. Lighthouse evalúa el axe check justo en esa ventana (se reprodujo **4 de 4** navegaciones limpias; sólo una medición “en caliente” dio 1.00), por lo que el score es inestable y **no llega al 100 exigido**.

**Fix propuesto (frontend):** no animar la opacidad del texto de estado vacío (usar `animate={{ opacity: 1 }}` sin `initial`, o animar sólo `y`/`scale`), o marcar el contenedor con `prefers-reduced-motion` / `motion-reduce:` de forma que la opacidad inicial sea 1.

📸 `final-shots/19-desktop-kanban-contraste-vacio.png`

*Nota:* `scope="col"` ya está presente en los 6 `<th>` de `/tickets`, pero la regla `td-has-header` de axe sigue sin pasar porque **la 6.ª columna (la de acción “Ver”) tiene `<th>` vacío**. La tabla tampoco tiene `<caption>`.

---

## 5. Fase 2 — Flujos E2E

### 2.1 ✅ Flujo completo del técnico (Cola → Asignarme → Iniciar → Resolver)

1. `/queue` con selector de grupo (`aria-label="Seleccionar grupo de soporte"`, 9 grupos; por defecto “Aplicaciones GSI” = 5 tickets, Hardware = 7).
2. **Asignarme** → `POST /api/tickets/88/claim` → **200**; `POST /api/tickets/89/claim` → **200**.
3. **Iniciar** en #89 → `PATCH /api/tickets/89/status` → **204** → la tarjeta pasa a *Trabajando (En progreso)*.
4. **Resolver** con solución vacía → **bloqueado en cliente**, **0 requests** emitidos, pista en español: “Escribí la solución… no puede quedar vacía…”.
5. **Resolver** con solución válida → `POST /api/tickets/89/solutions` → **201** → `PATCH /api/tickets/89/status` → **204** → **el modal se cierra**, la tarjeta aparece en **Resuelto / Listo** (contador 10→11) y se muestra el toast:
   > **Ticket resuelto correctamente** — El ticket #89 ha sido marcado como resuelto.

Consola: **0 errores**.

📸 `final-shots/03-tecnico-flow-89-resuelto.png`

### 2.2 ✅ Realtime por SignalR

Con dos pestañas en la misma sesión de técnico:

- Pestaña A captura el handshake WebSocket: `{}` → `{"type":3,"invocationId":"0","result":null}` → y tras un `PATCH /api/tickets/327/status` (**204** en la pestaña B) llega el evento:
  `{"type":1,"target":"TicketStatusChanged","arguments":[{"ticketId":327,"newStatus":4,"assigneeId":7,…}]}`
- La pestaña A hace refetch de `/api/tickets?assigneeId=17&limit=100&offset=0` y **el #327 se mueve a “Esperando” sin recargar la página**.
- Log del API: `SignalR: user 17 connected`, `POST /hubs/tickets/negotiate` → 200, `GET /hubs/tickets` → **101**.

📸 `final-shots/04-signalr-realtime-kanban-actualizado.png`

**Matiz (no bloqueante para la demo):** la variante “el solicitante crea un ticket y aparece en el Kanban en vivo” **no es verificable** por dos motivos independientes:

1. El solicitante **no puede crear tickets** por el bloqueante B1 (categoría vacía) y, además, en el frontend no hay ningún camino de UI para crear un ticket sin categoría (`/ticket/create` → 404; `/front/ticket.php` sin botón de alta; el catálogo sólo expone los dos formularios rotos).
2. El backend **no emite evento `TicketCreated`**: el `TicketHub`/`TicketNotificationService` sólo levanta `TicketClaimed` (scoped al grupo `group-{groupId}`), `TicketStatusChanged` (`Clients.All`) y `SolutionAdded` (`Clients.All`). Por eso la creación no puede propagarse en vivo.
3. Extra: el frontend hace `connection.invoke('SubscribeToGroup', 1)` **hardcodeado** (`frontend/src/hooks/useRealtimeTicketHub.ts` ~L149) mientras el Kanban ofrece 9 grupos → el API registra `User 15 unauthorized to subscribe to group 1` para el solicitante.

**Fix propuesto:** (a) emitir `TicketCreated` desde el backend (`Clients.All` o `Clients.Group`), (b) suscribir al grupo **seleccionado** en lugar del `1` hardcodeado, (c) refrescar la lista del solicitante ante ese evento.

### 2.3 ✅ El administrador puede reabrir un Cerrado

Con `admin_test` sobre el **#317** (Cerrado):

- **Planificado** (= estado 3, *En progreso*) → `PATCH /api/tickets/317/status` → **204**, toast “Estado actualizado”, y el cambio **persiste tras recargar**.
- El admin también puede volver a cerrarlo (→ “Cerrado”), que es lo correcto.

Reglas de backend verificadas: el técnico sobre un Cerrado recibe **403** (“Solo un administrador puede reabrir un ticket cerrado.”), el admin no.

📸 `final-shots/05-admin-reapertura-317.png`

---

## 6. Fase 3 — Estrés, responsive y consola

### 3.1 ✅ Formularios con entradas vacías / blancos / excesivamente largas

| Entrada | Resultado | Requests |
|---|---|---|
| Vacía | Bloqueado en cliente, mensaje en español | **0** |
| Sólo espacios (12) | Bloqueado en cliente, mensaje en español | **0** |
| 6600 caracteres | `POST /api/tickets/323/solutions` → **400**, toast visible, el diálogo **permanece abierto** | 1 |
| Exactamente 2000 caracteres | **201** + **204** → ticket resuelto con toast de éxito | 2 |

Toast del caso 400:
> **No se pudo guardar la solución** — *Solution content exceeds maximum length.*

**Corrección importante respecto a una lectura anterior:** los errores **sí se muestran**. El toastStore tiene `AUTO_DISMISS_MS = 4000` (`frontend/src/store/toastStore.ts`); las mediciones iniciales de 15 s de espera lo dejaban pasar inadvertido. Medido con < 4 s, el toast está presente con `role="alert"` y `aria-live="polite"`.

**Inconsistencia (menor, ver §7):** el detalle del 400 llega **en inglés** (“Solution content exceeds maximum length.”) porque `getApiErrorMessage` devuelve `problem.title` literal (`frontend/src/lib/api/errors.ts`), sin capa de traducción.

📸 `final-shots/error-400-solucion-demasiado-larga.png`

### 3.2 ✅ Responsive iPhone 12 (390×844 / 390×664)

Verificado con emulación real de dispositivo (`devices['iPhone 12']`) en `/kanban`, `/tickets`, `/queue`, `/dashboard`:

- `pageHorizontalScroll: false`, `docScrollWidth === docClientWidth === 390`
- **0 elementos desbordantes**
- Sidebar oculta, bottom nav `fixed bottom-0` de 57 px con `pb-[env(safe-area-inset-bottom)]`
- Contenedor con `pb-20 md:pb-6` (80 px) compensando la altura de la nav
- **0 errores de consola / 0 requests fallidas**

**Hoja de filtros móvil:** ✅ PASS. `[data-testid="filters-open-btn"]` abre un `role="dialog"` con ESTADO / PRIORIDAD / FECHA DE CREACIÓN / Desde / Hasta / Limpiar todo / Aplicar filtros; ids `#sheet-status-filter`, `#sheet-priority-filter`, `#sheet-start-date`, `#sheet-end-date`; el badge muestra el número de filtros activos (“Filtros 1”) y la hoja cierra al aplicar.

📸 `final-shots/mobile-kanban.png` · `mobile-tickets.png` · `mobile-cola.png` · `mobile-dashboard.png` · `mobile-filtros-sheet.png` · `mobile-filtro-aplicado-pendiente.png` · `mobile-busqueda.png` · `mobile-mas-drawer.png`

### 3.3 ✅ Barrido de consola y red

4 combinaciones de rol (técnico desktop, admin desktop, solicitante desktop, técnico móvil) × 7 rutas (`/kanban`, `/tickets`, `/queue`, `/services`, `/dashboard`, `/ayuda`, `/preferences`):

> **0 errores de consola · 0 warnings · 0 requests fallidas · 0 page errors**

Los únicos errores de red observados son los **deliberados** de los casos 400/409 documentados arriba. Se ignoraron, según lo pedido, los errores de extensión (`cnt.js`, `documentPictureInPicture`).

Gating por rol verificado: el solicitante es **redirigido** a `/tickets` al intentar entrar a `/kanban`, `/queue`, `/services` y `/dashboard`.

### 3.4 ⚠️ Búsqueda y filtros

**✅ Correcto**

| Caso | Resultado |
|---|---|
| `#search` con “monitor” | Estado vacío “No hay tickets que coincidan con los filtros.” |
| Sin coincidencias (“zzzqqq-no-existe-xyz”) | Mismo estado vacío |
| Sólo espacios | Se ignora → 15 filas |
| Texto borrado | 15 filas |
| `#status-filter` = “Pendiente” | 7 filas, todas “Pendiente”, URL `?status=4` |
| `#priority-filter` = “Crítica” | 1 fila (estado vacío: no hay de esa prioridad para este técnico) |
| Rango válido 2026-10-19 → 2026-10-21 | 15 filas, sin cambios |

📸 `final-shots/desktop-busqueda-sin-resultados.png` · `desktop-filtro-estado-pendiente.png` · `desktop-filtro-prioridad-critica.png` · `desktop-filtro-fecha-rango-ok.png`

**❌ Defecto: rango de fechas invertido**

`Desde = 2026-10-20` / `Hasta = 2026-10-05`:

```
GET /api/tickets?assigneeId=17&startDate=2026-10-20&endDate=2026-10-05&limit=100&offset=0  →  400
```
(disparado **2 veces**)

El bloque de error muestra el texto **crudo del backend**:
> “One or more validation errors occurred.”

Problemas asociados:
1. El mensaje está **en inglés** y sin traducir.
2. El bloque de error **no tiene `role="alert"` ni `aria-live`** ⇒ **no se anuncia** a lectores de pantalla.
3. Los `<input type="date">` nativos ya reportan `rangeOverflow: true` / `rangeUnderflow: true`, pero `List.tsx` **no bloquea el envío** ⇒ se lanza la petición inválida (y se duplica).

📸 `final-shots/error-fecha-rango-invertida.png` · `desktop-fecha-invertida-error.png`

---

## 7. Resumen de hallazgos

### Bloqueantes

| ID | Hallazgo | Ámbito | Fix |
|---|---|---|---|
| **B1** | Desplegable Categoría vacío ⇒ **no se puede crear ningún ticket** desde GLPI (ni desde la UI del Service Desk: no hay ruta de alta sin categoría) | GLPI/seed (Antigravity) | Re-guardar categorías vía API de GLPI para regenerar los caches del árbol; crear Elementos Ticket; mapear la categoría en el destino del formulario |
| **B3** | Lighthouse accesibilidad en `/kanban` = 0.96 (< 1.00) por contraste 1.9:1 durante el *fade-in* del mensaje de columna vacía | Frontend | No animar la opacidad del texto vacío (`initial` sin `opacity`, o `motion-reduce`) |

### Altos

| ID | Hallazgo | Ámbito | Fix |
|---|---|---|---|
| **B2** | Botón “Resuelto” habilitado por el técnico en tickets cerrados ⇒ `409` + toast de error | Frontend | Aplicar el mismo bloqueo que en `Cerrado` a las transiciones de retroceso del técnico |
| **A1** | Rango de fechas invertido: se envía la petición (2 veces), error **sin `role="alert"`** y **en inglés** | Frontend | Validar `startDate <= endDate` en cliente + traducir + añadir `role="alert"`/`aria-live` |
| **A2** | Los detalles de error 400/409 del backend se muestran **en inglés** (“Solution content exceeds maximum length.”, “One or more validation errors occurred.”) | Frontend (o backend) | Capa de traducción en `getApiErrorMessage` (`frontend/src/lib/api/errors.ts`) o `detail` en español del backend |

### Medios

| ID | Hallazgo | Ámbito |
|---|---|---|
| **M1** | El drawer “Más” móvil abre (288 px) pero **no** tiene `role="dialog"`, `aria-modal` ni `aria-label`; **el foco no entra** en el drawer (`focusInside: false`) y el scroll del body no se bloquea | Frontend (`MobileDrawer.tsx`) |
| **M2** | `subscribeToGroup` **hardcodeado a 1** mientras el Kanban ofrece 9 grupos ⇒ `User 15 unauthorized to subscribe to group 1` | Frontend (`useRealtimeTicketHub.ts`) |
| **M3** | El backend **no emite `TicketCreated`** ⇒ la creación de ticket no se propaga en vivo al Kanban | Backend (Antigravity) |
| **M4** | El `textarea` de solución **no tiene `maxlength` ni contador de caracteres**, aunque el backend limita a **2000** | Frontend (`ResolveTicketDialog.tsx`) |
| **M5** | La 6.ª columna de la tabla de tickets tiene `<th>` **vacío** ⇒ la regla axe `td-has-header` no pasa; la tabla tampoco tiene `<caption>` | Frontend (`ui/table.tsx`) |

### Inconsistencias menores

1. **Toast genérico vs. detallado**: el cambio de estado manual muestra “Estado actualizado”, mientras que la resolución muestra “Ticket resuelto correctamente — El ticket #89 ha sido marcado como resuelto.” Unificar el nivel de detalle.
2. **Contador de cabecera no filtrado**: la cabecera anuncia “23 ticket(s)” mientras la lista filtrada muestra 15 filas ⇒ el número no se recalcula con los filtros.
3. **Áreas táctiles < 40 px** en móvil: “Ver detalles” ≈ 97×28 px, “Inicio” ≈ 28×16 px.
4. **`max`/`min` cruzados** en `#start-date-filter`/`#end-date-filter` (desktop) ya limitan el selector nativo, pero **no** frena el envío (ver A1).
5. El mensaje del backend para `409` (“No se puede agregar una solución al ticket 317 porque ya está cerrado.”) sí llega **en español**: la mezcla de idiomas en A2 depende de qué endpoint responda.
6. `getDropdownValue.php` responde **200 con cuerpo vacío** ante peticiones `GET`; el endpoint real de GLPI es un `POST` con token CSRF (403 si se invoca sin token). Documentado para evitar falsos positivos en auditorías futuras.

---

## 8. Evidencia

Todas las capturas están en **`qa-report/final-shots/`** (37 imágenes).

| Grupo | Archivos |
|---|---|
| GLPI nativo | `01-glpi-inicio-cards-textos-ok.png`, `02-glpi-categoria-vacia-FAIL.png`, `07-glpi-categorias-itil-lista.png`, `08-glpi-categorias-itil-admin.png`, `09-glpi-servicecatalog.png`, `09-glpi-servicios-no-encontrado.png`, `10-glpi-dropdown-categoria-sin-opciones.png`, `11-glpi-categoria-hardware-entidad.png`, `12-glpi-ticket-clasico-categorias.png`, `13-glpi-elementos-ticket-vacio.png`, `14-glpi-hardware-elementos-ticket.png`, `16-glpi-formularios-lista.png`, `17-glpi-form-editor.png`, `18-glpi-form-preguntas.png` |
| Dashboard | `06-dashboard-cargando-skeleton.png`, `07-dashboard-cargado.png` |
| E2E técnico | `03-tecnico-flow-89-resuelto.png` |
| Realtime | `04-signalr-realtime-kanban-actualizado.png` |
| Admin | `05-admin-reapertura-317.png` |
| Errores | `error-409-resolver-ticket-cerrado.png`, `error-400-solucion-demasiado-larga.png`, `error-fecha-rango-invertida.png`, `desktop-fecha-invertida-error.png` |
| Filtros desktop | `desktop-busqueda-sin-resultados.png`, `desktop-filtro-estado-pendiente.png`, `desktop-filtro-prioridad-critica.png`, `desktop-filtro-fecha-rango-ok.png` |
| Desktop | `19-desktop-kanban-contraste-vacio.png`, `20-desktop-tickets-tabla.png` |
| Móvil | `mobile-kanban.png`, `mobile-tickets.png`, `mobile-cola.png`, `mobile-dashboard.png`, `mobile-filtros-sheet.png`, `mobile-filtro-aplicado-pendiente.png`, `mobile-busqueda.png`, `mobile-mas-drawer.png` |

---

## 9. Veredicto final

### ¿Listo para la demo con el jefe?

### ⚠️ **Sí para el Service Desk — No para la parte de GLPI nativo**

**Se puede enseñar con confianza:**
- Toda la regresión visual pedida (acentos, textos del Kanban, indicador de conexión, skeletons del dashboard) está **corregida**.
- El flujo del técnico (Asignarme → Iniciar → Resolver) funciona **de punta a punta** con los toasts correctos.
- El admin puede reabrir un ticket cerrado.
- La realtime por SignalR mueve tarjetas entre sesiones **sin recargar**.
- En iPhone 12 la app es **limpia**: 0 scrolls horizontales, 0 desbordes, 0 errores de consola.
- Búsqueda, estado, prioridad y rango de fechas **funcionan**.

**No se debe enseñar (o hay que cubrirlo explícitamente):**
1. **No se puede crear ningún ticket desde GLPI.** El desplegable *Categoría* está vacío ⇒ el formulario no se puede enviar. Es el único camino de alta que existe hoy. **Requiere un fix de seed/GLPI antes de la demo.**
2. Si el jefe pide cambiar el estado de un ticket cerrado, el botón “Resuelto” le va a devolver un error 409 ⇒ **fix de frontend de 1 línea** (aplicar el mismo gating que a `Cerrado`).
3. `/kanban` con Lighthouse da 0.96 en accesibilidad ⇒ **fix de frontend de 1 línea** (quitar el `initial={{opacity:0}}` del mensaje de columna vacía).
4. Los errores de validación del backend llegan **en inglés** ⇒ **fix de frontend** (capa de traducción) o de backend.

**Prioridad sugerida para cerrar antes de la demo:**
1. **B1** (GLPI/seed) — bloqueante absoluto: sin esto no hay alta de tickets.
2. **B3** y **B2** (frontend) — dos cambios de una línea que dejan el Lighthouse en 1.00 y eliminan el 409 en el flujo más probable del jefe.
3. **A1 + A2** (frontend) — traducir los errores y validar el rango de fechas en cliente (evita el 400 en vivo).
4. **M1** (frontend) — `role="dialog"` + foco en el drawer “Más” (lo más probable que se demuestre en un móvil).

---

## 10. Anexo — Reproducción

```bash
# Service Desk
http://10.10.40.25/login        tecnico_test1 / Tec123!
http://10.10.40.25/login        admin_test  / Admin123!
http://10.10.40.25/login        solicitante_test / Soli123!

# GLPI nativo (super-admin, sólo diagnóstico)
http://10.10.40.25:8081/        glpi / glpi

# Rutas clave
/tickets  /tickets/317  /kanban  /queue  /dashboard  /services  /ayuda  /preferences
# GLPI:  /Form/Render/1  /Form/Render/2  /front/itilcategory.php  /front/ticket.form.php?id=-1
```

**Llamadas relevantes observadas (sólo lectura de red del navegador):**

| Llamada | Respuesta |
|---|---|
| `POST /api/tickets/88/claim` | 200 |
| `PATCH /api/tickets/89/status` | 204 |
| `POST /api/tickets/89/solutions` | 201 |
| `POST /api/tickets/317/solutions` (Cerrado) | **409** |
| `POST /api/tickets/323/solutions` (6600 chars) | **400** |
| `PATCH /api/tickets/317/status` (admin) | 204 |
| `GET /api/tickets?...&startDate=2026-10-20&endDate=2026-10-05` | **400** |
| `POST /hubs/tickets/negotiate` · `GET /hubs/tickets` | 200 · **101** |

**Restricciones respetadas durante toda la auditoría:** sin SQL, sin `curl`, sin inyección de datos vía API. Los ficheros de sólo lectura del contenedor GLPI (`docker exec glpi … cat/grep`) se usaron exclusivamente para acortar el diagnóstico del bloqueante B1 y no modificaron la instancia.
