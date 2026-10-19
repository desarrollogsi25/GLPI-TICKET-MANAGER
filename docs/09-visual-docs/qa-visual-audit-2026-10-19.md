# QA Visual y Auditoría de UX — GLPI Ticket Manager

**Fecha:** 2026-10-19
**Auditor:** QA Visual / UX (agente)
**Entorno:** stack Docker en local

| Servicio | URL |
| --- | --- |
| Frontend (Vite dev) | http://localhost:5173 |
| API (.NET) | http://localhost:8080 |
| GLPI | http://localhost:8081 |
| Base de datos app | PostgreSQL `glpi_ticket_manager` |
| Base de datos GLPI | MariaDB `glpi` |

**Usuarios de prueba utilizados**

| Usuario | Contraseña | Perfil GLPI | Rol en la app |
| --- | --- | --- | --- |
| `admin_test` | `Admin123!` | Self-Service (1) + Super-Admin (4) | `admin` |
| `tecnico_test1` | `Tec123!` | Self-Service (1) + Technician (6) | `technician` |
| `solicitante_test` | `Soli123!` | Self-Service (1) | `technician` ⚠️ (ver F1) |

**Alcance:** auditoría visual/UX de 5 áreas. **No se modificó código de la aplicación.**
**Método:** simulación de usuario real contra el stack en marcha. La evidencia se obtuvo por
inspección del DOM y geometría (`getBoundingClientRect`, `getComputedStyle`), red (peticiones HTTP),
estado (`localStorage`, JWT) y capturas de pantalla. La emulación móvil real (390×844) se hizo con un
iframe del mismo origen sobre `localhost:5173` (el viewport del harness no es redimensionable).
**Artefacto temporal:** se creó `frontend/public/__audit-mobile-frame.html` solo para la emulación y
**se eliminó al terminar**.

> **Nota sobre el repositorio:** `git status` reporta ~323 archivos como modificados en todo el repo.
> Es un estado **preexistente por finales de línea (CRLF↔LF)**: `git diff --ignore-cr-at-eol` está vacío
> e inserciones = eliminaciones (29 186 / 29 186). No fue causado por esta auditoría. El único cambio
> aportado es la carpeta nueva `docs/09-visual-docs/qa-visual-audit-2026-10-19/` y este informe.

---

## Resumen ejecutivo

| # | Área | Veredicto |
| --- | --- | --- |
| 1 | Persistencia de modo oscuro / claro | ✅ **PASSED** (2 hallazgos menores: F6, F7) |
| 2 | Validación inline (Login y detalle de ticket) | ✅ **PASSED** (1 hallazgo de idioma: F5) |
| 3 | Toasts en acciones exitosas | ✅ **PASSED** |
| 4 | Responsive móvil (header/drawer, listas→tarjetas, Kanban + bottom sheet) | ✅ **PASSED** (1 hallazgo a11y: F8) |
| 5 | Roles / GLPI (solicitante vs técnico vs admin) | ❌ **FAIL** (F1, F2, F3) |

**Conclusión general:** las áreas 1–4 (experiencia visual, validación, feedback y responsividad)
están correctamente implementadas y el bug de "mover ticket de En Progreso a Pendiente" en móvil
**está resuelto**. El área 5 (control de acceso por rol) **falla**: no hay RBAC efectivo, un usuario
de Self-Service (solicitante) recibe rol `technician` y ve el Kanban, y la cola de grupo devuelve 403
para técnicos fuera del grupo 1 con un error crudo en inglés.

---

## Hallazgos priorizados

### F1 — 🔴 Alto — `solicitante_test` recibe rol `technician` y accede a toda la UI de técnico
**Área:** 5 (Roles). **Realidad observada vs esperado:** se esperaba que un solicitante **no** viera el
Kanban ni pudiera asignar tickets.

- La tabla `role_profile_mapping` solo mapea: perfil GLPI 6→`technician`, 7→`supervisor`, 3/4→`admin`.
  El perfil **1 (Self-Service) no está mapeado**.
- Al iniciar sesión, `solicitante_test` (perfil 1 únicamente) recibe un JWT con `role: "technician"`
  (fallback de la API). Evidencia: `jwtRole: "technician"`, `jwtProfile: "1"`, `user.role: "technician"`.
- El menú lateral muestra **todos** los ítems (`kanban, tickets, queue, services, dashboard, ayuda,
  preferences`) y `http://localhost:5173/kanban` **renderiza el tablero Kanban** completo
  (columna "Cola del grupo", pestañas segmentadas, filtro de técnico).
- En el router, `ProtectedRoute` **solo valida que exista token**; ninguna ruta se restringe por rol.
  Existe `ProtectedRouteWithRole.tsx` pero **no se usa**.
- Mitigación parcial (no intencional): la API sí limita datos. El filtro de técnico solo ofrece
  "Técnico #15 (yo)" y `GET /api/tickets?assigneeId=15` devuelve 0; `GET /api/tickets/314` → **403**.
  Aun así, el control de acceso **de UI** no existe.

**Sugerencia:** mapear el perfil 1 a un rol `requester`/`selfservice`, aplicar `ProtectedRouteWithRole`
en el router (ocultar/denegar `kanban`, `queue` y acciones de asignación) y no usar `technician` como
fallback silencioso para perfiles no mapeados.

---

### F2 — 🔴 Alto — `GET /api/groups` no se acota a la pertenencia del usuario → cola del Kanban 403
**Área:** 5 (Roles/GLPI). Afecta a `tecnico_test1` (usuario GLPI 13, sin grupo).

- `GET /api/groups` (como `tecnico_test1`) devuelve **ambos** grupos, sin filtrar por membresía:
  `[{"id":1,"name":"Call Center"},{"id":2,"name":"Soporte Nivel 1"}]`.
- El Kanban toma el primer grupo como "actual" (`Kanban.tsx:256-257`) y consulta su cola:
  `GET /api/tickets/by-group?groupId=1&unassigned=true` → **403**
  `{"title":"Forbidden","detail":"User 13 cannot view queue for group 1"}`.
- Resultado: un técnico sin grupo ve el Kanban pero su cola queda inutilizable y **no puede reclamar
  tickets** (no se pudo ejercitar "Asignarme" por falta de cola accesible).
- Control positivo: `admin_test` sí carga la cola ("Cola del grupo / Sin asignar 14 / #303 … Asignarme"),
  y `tech1` (usuario 7, miembro del grupo 1) también. El fallo es específico de usuarios sin el grupo 1.

**Sugerencia:** acotar `GET /api/groups` a los grupos del usuario (o devolver el grupo por defecto
correcto) y que el Kanban elija un grupo para el que el usuario tenga permiso de cola.

---

### F3 — 🟠 Medio — Error de la cola mostrado en crudo y en inglés
**Área:** 5 / 4 (UX de errores). La columna "Cola del grupo" muestra literalmente
`User 13 cannot view queue for group 1` (texto de la API en inglés) junto a un botón "Reintentar", y el
contador de la columna muestra **0**, dando la falsa impresión de "cola vacía".

**Sugerencia:** mensaje i18n ("No tienes permiso para ver la cola de este grupo") y un estado de error
distinto del estado vacío.

---

### F4 — 🟠 Medio — i18n mixto: estados y tipo de ticket en inglés
**Área:** 2/4. La UI está en español pero los estados se muestran en inglés
(`New`, `Assigned`, `Planned`, `Pending`, `Solved`, `Closed`) y el tipo como `Incident`, mientras la
prioridad sí está en español (`Alta`, `Media`). Visible en la tabla, en las tarjetas móviles, en el
detalle ("Cambiar estado") y en las tarjetas del Kanban. Fuente: `frontend/src/features/tickets/labels.ts`.
**Sugerencia:** traducir `labels.ts` al español.

---

### F5 — 🟠 Medio — Mensaje de credenciales incorrectas en inglés
**Área:** 2. Con usuario/contraseña inválidos, el bloque inline `role="alert"` muestra
"The username or password is incorrect." mientras el resto de la validación del Login está en español.
El mensaje proviene de la API (ProblemDetails). **Sugerencia:** mapear `title/detail` a un mensaje es-ES.

---

### F6 — 🟡 Bajo — FOUC del tema (parpadeo al cargar)
**Área:** 1. `frontend/index.html` **no** tiene script inline que aplique el tema antes del primer pintado;
`GlobalThemeSync` (`App.tsx:19-65`) aplica la clase `dark` en un `useEffect` posterior. Con tema oscuro
guardado se observa el flash claro→oscuro. **Sugerencia:** script inline mínimo en `index.html` que lea
`localStorage.theme` y aplique la clase antes del render.

---

### F7 — 🟡 Bajo — La preferencia local de tema no guardada se pierde
**Área:** 1. Al cargar, `GET /api/preferences` sobreescribe el tema y el `localStorage` con el valor del
servidor. Un cambio local no confirmado con "Guardar" se revierte en la siguiente carga.
**Sugerencia:** esperar el resultado del backend antes de decidir, o aplicar el guardado en local como
fuente de verdad para el primer pintado.

---

### F8 — 🟡 Bajo (accesibilidad) — Tarjeta del Kanban móvil no accesible por teclado
La tarjeta (`TicketCard` compacto, `Kanban.tsx` móvil) es un `<div>` con `onClick` sin `role` ni
`tabindex` → no es enfocable ni anunciada como interactiva. El bottom sheet sí es correcto
(`role="dialog"`, `aria-modal="true"`, `aria-labelledby="mobile-sheet-title"`).
**Sugerencia:** `role="button"` + `tabindex={0}` + manejo de Enter/Espacio (o un `<button>` semántico).

---

### F9 — 🟡 Bajo — Micro-hallazgos acumulados

| ID | Detalle |
| --- | --- |
| F9.1 | Diálogos "Resolver"/"Reabrir" sin `aria-labelledby` (los lectores no anuncian el título). |
| F9.2 | Textos sin tildes en diálogos: "Escribi la solucion aplicada", "Describi la solucion". |
| F9.3 | `GET /api/tickets/{id}` con 403 muestra "Ha ocurrido un error inesperado." genérico (no indica permisos). |
| F9.4 | El `authStore` conserva `role: "technician"` tras cerrar sesión (estado residual en `localStorage`). |
| F9.5 | `ConnectionIndicator` alterna "Conectado" / "Desconectado de tiempo real" con reconexiones. |
| F9.6 | En móvil, las pestañas segmentadas del Kanban desbordan (scrollWidth 587 vs 341) y "Resuelto" queda fuera de la pantalla inicial; es `overflow-x: auto` (scrollable), pero conviene un indicador de scroll. |

---

## Detalle por tarea

### 1. Modo oscuro / claro — ✅ PASSED
- **Por defecto:** con `localStorage` vacío, la app carga en **claro** (sin clase `dark` en `<html>`). ✅
- **Cambio en vivo:** al seleccionar "Oscuro" y **Guardar**, se aplica inmediatamente: `html.dark`,
  `data-theme="dark"`, `localStorage theme=dark`. ✅
- **Persistencia:** tras recargar (F5) y tras cerrar/abrir sesión, el tema oscuro se mantiene. ✅
- **Vuelta a claro:** "Claro" + Guardar persiste tras recarga. ✅
- Hallazgos: F6 (FOUC), F7 (preferencia local sobreescrita por el servidor).

### 2. Validación inline — ✅ PASSED
**Login** (`frontend/src/features/auth/Login.tsx`, zod `mode:'onBlur'`):
- Enviar vacío → "El usuario es obligatorio" en `#username-error`, `role="alert"`, `aria-invalid="true"`,
  borde `destructive`. ✅
- Sin contraseña → "La contraseña es obligatoria" y botón **deshabilitado** (`disabled = hasErrors || isPending`). ✅
- El campo "Usuario" no valida formato email (es *username*, no email) → **N/A**, no es un defecto. ✅
- Credenciales incorrectas → bloque inline `role="alert"` (texto en inglés, ver F5). ✅ (funcional)

**Diálogo "Resolver ticket #314"** (`ResolveTicketDialog.tsx`):
- Botón de envío **deshabilitado** con <10 caracteres. ✅
- Con valor corto y **blur** → error rojo "La solución debe contener al menos 10 caracteres
  (actualmente 3).", `aria-invalid="true"`, a 6 px bajo el campo. ✅
- Vacío → "La descripción de la solución es obligatoria." ✅

**Diálogo "Reabrir"** (`ReopenTicketDialog.tsx`): el motivo es **opcional por diseño** (solo valida >500
caracteres) → no se muestra error con vacío. **N/A**, no es defecto.

### 3. Toasts en acciones exitosas — ✅ PASSED
- **Guardar preferencias** (`PUT /api/preferences` → 204): toast "Preferencias guardadas correctamente /
  Tus preferencias visuales han sido actualizadas." ✅
- **Cambio de estado** (móvil, bottom sheet): toast "Ticket #326 marcado como pendiente / En espera de
  respuesta externa o proveedor." ✅
- **Posición:** en **escritorio** abajo-derecha (`fixed`, `left:385px right:16px bottom:16px`, `max-w-sm`
  =384 px, h=58, con ✕) en viewport 800×714; en **móvil** arriba (`fixed top-4 inset-x-4`, x=16 y=16
  w=343 h=72, título+descripción+✕). ✅
- Se descarta el bloqueo del layout: los toasts son `position: fixed` por encima del contenido.

### 4. Responsive móvil (390×844) — ✅ PASSED
- **Header:** la sidebar de escritorio pasa a `display:none`; header 375×49 visible; hamburguesa 36×36 en
  x=16 (`data-testid="mobile-hamburger-btn"`, `aria-label="Abrir menú"`); logout a x=322; **sin logo ni
  nombre de usuario en el header** (por diseño); sin scroll horizontal (`scrollWidth`=375). ✅
- **Drawer** (`data-testid="mobile-drawer"`): se abre y se asienta en x=0, w=288, h=844; contiene logo GL,
  "GLPI Manager", "Menú del sistema", "USUARIO ACTIVO", `tecnico_test1`, `@tecnico_test1`, nav
  (Servicios, Dashboard, Preferencias, Ayuda), "Cerrar sesión" (`logout-btn`) y botón cerrar
  (`mobile-menu-btn` 40×40). Todo dentro del viewport. ✅
- **Bottom tab bar** ("Navegación inferior móvil"): `fixed` en la parte inferior (y≈787, h≈57), ítems
  Kanban / Tickets / Cola / Más de 94×56 con `aria-label`. ✅
- **Lista de tickets → tarjetas:** a 390 px se renderizan **tarjetas** (`data-testid="ticket-card"`),
  15 tarjetas de 343×114 en x=16 (sin overflow); **no se renderiza `<table>`**. El botón **"Ver detalles"**
  expande la tarjeta de **114 → 178 px**, alterna `aria-expanded` (`false`→`true`) y el texto
  "Ver detalles"↔"Ocultar", revelando `ID TICKET #314`, `PRIORIDAD Alta`, `TIPO DE SOLICITUD Incident` y
  "Abrir ficha completa →". No rompe el layout. ✅
- **Kanban móvil:** pestañas segmentadas `role="tab"` (`kanban-tab-queue|mine|in_progress|pending|resolved`)
  con contadores; la fila es `overflow-x:auto` (scrollWidth 587 > 341 → scrollable). La pestaña activa
  lista tarjetas de 343×137 con botones inline ("Pausar"/"Resolver"). ✅
- **Bottom sheet:** al tocar la tarjeta abre `data-testid="kanban-mobile-sheet"`, `role="dialog"`,
  `aria-modal="true"`, `aria-labelledby="mobile-sheet-title"`; se asienta a `x=0, y=444, w=375, h=400`
  (anclado al fondo de 844). Controles grandes: "Mover a Pendiente (Pausar)" y "Mover a Resuelto" de
  335×48, "Ver ficha completa del ticket →" 335×36, "Cerrar" 335×44; todos dentro del viewport. ✅
- **Mover "En progreso" → "Pendiente":** `PATCH /api/tickets/326/status` → **204**, el sheet se cierra,
  aparece el toast y los contadores se actualizan (**En progreso 5→4, Pendiente 0→1**). ✅
  **El bug reportado está resuelto.** (Ticket #326 restaurado a su estado original al terminar.)
- Hallazgo: F8 (tarjeta no accesible por teclado).

### 5. Roles / GLPI — ❌ FAIL
- **`admin_test`** (`admin`): Kanban + cola del grupo con "Sin asignar 14" y botón "Asignarme". ✅
- **`tecnico_test1`** (`technician`): **ve el Kanban** ✅, pero la **cola del grupo falla con 403** por
  F2/F3 y **no se pudo validar el reclamo** de tickets (sin cola accesible). ⚠️
- **`solicitante_test`** (Self-Service): **FAIL** — recibe rol `technician`, ve **todo** el menú
  (incluido Kanban) y el tablero **renderiza**. Ver F1. La API sí limita datos (403 en tickets ajenos),
  pero el control de acceso de UI no existe.

---

## Anexo — Índice de capturas

Ruta: `docs/09-visual-docs/qa-visual-audit-2026-10-19/`

| Archivo | Descripción |
| --- | --- |
| `01-desktop-kanban-403-queue.png` | Kanban escritorio (`tecnico_test1`): columna "Cola del grupo" con el error 403 en crudo. |
| `02-desktop-tickets-list.png` | Listado de tickets en escritorio. |
| `03-desktop-ticket-detail-status-buttons.png` | Detalle de ticket: botones de estado (en inglés) y "Cambiar estado". |
| `04-desktop-preferences.png` | Preferencias: tema (Claro/Oscuro) y densidad. |
| `05-mobile-kanban-403-queue.png` | Kanban móvil (390 px): error de cola y pestañas segmentadas. |
| `06-mobile-tickets-cards.png` | Lista de tickets móvil en formato tarjeta. |
| `07-mobile-tickets-card-expanded.png` | Tarjeta expandida con "Ver detalles" (ID/Prioridad/Tipo). |
| `08-mobile-drawer.png` | Drawer móvil abierto (usuario, navegación, cerrar sesión). |
| `09-mobile-kanban-bottom-sheet.png` | Bottom sheet del Kanban móvil con acciones de estado. |
| `10-desktop-login-inline-validation.png` | Login con errores de validación inline. |

> Las capturas se tomaron con el navegador del harness a la resolución disponible; la evidencia
> numérica de geometría/DOM que sustenta cada veredicto está incluida en las secciones anteriores.

## Anexo — Medidas clave (390×844)

| Elemento | Medición |
| --- | --- |
| Header móvil | 375×49; hamburguesa 36×36 en x=16; logout en x=322 |
| Drawer | x=0, w=288, h=844 |
| Bottom tab bar | y≈787, h≈57; ítems 94×56 |
| Tarjeta de ticket | 343×114 (expandida 178) en x=16 |
| Tarjeta de Kanban | 343×137 |
| Bottom sheet | x=0, y=444, w=375, h=400 (fondo 844); botones 335×48 |
| Pestañas segmentadas | clientWidth 341, scrollWidth 587 (scrollable) |
| Toast móvil | x=16, y=16, w=343, h=72 |
| Toast escritorio (800×714) | left 385, right 16, bottom 16, w=384, h=58 |

---

### Estado final
- **Código de la aplicación:** sin cambios.
- **Artefacto temporal:** `frontend/public/__audit-mobile-frame.html` **eliminado**.
- **Datos:** ticket #326 devuelto a su estado original (Planned/3).
- **Añadido:** este informe y la carpeta de capturas en `docs/09-visual-docs/`.
