# Informe Final de Release — Rediseño UX/UI Enterprise Precision + Apple-Inspired, QA Manual y Regresión Integral

**Proyecto:** GLPI Ticket Manager / GSI Service Desk (`desarrollogsi25/GLPI-TICKET-MANAGER`)
**Fecha:** 2026-11-26
**Rama de trabajo:** `feat/ux-ui-enterprise-redesign-20261125`
**SHA base (`main`):** `e4996e8bee1601cda7470ae8105799eeb1842136`
**Commits previos:** `44e2005594225797fbfa2f0921aac6e1cca83ea1` (Rediseño base), `b115a8d32f32eed5e9894c614797cfc091a546d5` (RC)
**Estado global:** `VERIFIED FOR RELEASE & MERGE TO MAIN`

---

## 1. Resumen Ejecutivo, Refinamiento Apple-Inspired y Hallazgos Corregidos

Además de los 8 hallazgos corregidos en el RC (`b115a8d`), en la fase final se aplicaron mejoras visuales inspiradas en Apple HIG / macOS y se ejecutó una **auditoría manual interactiva en navegador real** que detectó y corrigió **5 defectos reales adicionales**:

### Refinamientos Visuales Finales (Apple-Inspired Enterprise Precision)
- **Login fiel a referencia corporativa (`Login.tsx`):** Restaurada la composición corporativa aprobada (lienzo gris suave, 3 curvas orgánicas SVG a la izquierda, tarjeta flotante con logo GSI arriba-izquierda, `"Bienvenido a GSI Service Desk"` + subtítulo, `"Service Desk Inteligente"` abajo-izquierda y tarjeta blanca flotante compacta a la derecha), integrando toggle accesible `Mostrar/Ocultar contraseña`, `autoComplete`, spinner de carga, alerta de error clara, foco visible y soporte `useReducedMotion()`.
- **Sidebar estilo macOS sin bordes pesados (`AppSidebar.tsx`):** Integrado directamente sobre `bg-background` sin `border-r` ni líneas divisorias internas; ítem activo como píldora flotante elevada (`bg-card` + sombra sutil + spring `bounce: 0`); pie de cuenta flotante limpio con rol legible sin truncamiento.
- **Navbar minimalista y menú flotante de usuario (`AppLayout.tsx`):** Barra superior sin `border-b` (`bg-background/85 backdrop-blur-md`) con breadcrumb, píldora de conexión, disparador `Ctrl K` redondeado, botón de tema, campana de notificaciones y menú flotante de avatar de usuario (`Preferencias`, `Ayuda y guía`, `Cerrar sesión`, cierre por `Escape` y clic exterior).
- **Superficies elevadas sin wireframe (`card.tsx`, `PageHeader.tsx`, `Kanban.tsx`):** Tarjetas elevadas con sombra suave y `ring-1` sutil, encabezados de página separados por espacio negativo limpio y columnas Kanban contenidas en bandejas tonales suaves.

### 5 Defectos Reales Detectados en QA Manual Interactivo y Corregidos
1. **Footer sticky translúcido en Modal de Planificación (`PlanTicketDialog.tsx`):** El contenido al desplazarse se transparentaba detrás de `Cancelar` / `Confirmar planificación`. Corregido con fondo opaco `bg-card z-10` y sombra superior sutil.
2. **Desincronización de tema en `/preferences` + salto de línea en badge (`PreferencesPage.tsx`):** Al cambiar modo oscuro desde el botón del header, la tarjeta `"Tema de la interfaz"` no actualizaba su estado visual y `"No activadas"` saltaba a dos líneas. Corregido con `MutationObserver` sobre `document.documentElement` y `whitespace-nowrap shrink-0` + `flex-wrap`.
3. **Hit-target del menú de usuario (`AppLayout.tsx`):** El `<Avatar>` interno interceptaba el target del clic dentro de `[data-testid="header-user-menu-btn"]`. Añadido `pointer-events-none` al avatar interno.
4. **Truncamiento en pie del sidebar (`AppSidebar.tsx`):** Mostrar rol y `@usuario` en la misma línea truncaba `Administr... · @qa_a...`. Dejado el rol completo legible en el sidebar (con tooltip completo y `@usuario` en el menú del avatar).
5. **Truncamiento en selector de prioridad de `/queue` (`GroupQueuePage.tsx`):** `"Todas las prioridades"` se cortaba en `sm:w-44`. Ampliado a `sm:w-52`.

---

## 2. Auditoría por Rol (UI vs Autorización del Servidor)

| Rol | Navegación visible en UI | Operaciones UI permitidas | Enforcement verificado en Backend (.NET 10) |
|---|---|---|---|
| **Solicitante** (`user_test`, `user1`) | Solo `Mis tickets`, `Ayuda`, `Preferencias` (desktop y móvil). Redirección automática desde `/kanban`, `/queue`, `/equipo`, `/administracion`, `/dashboard`, `/services`. | Ver sus propios tickets, estado ITIL, descripción, seguimientos públicos y solución aplicada. Sin controles de mutación. | `403 Forbidden` verificado vía HTTP real en `/api/admin/dashboard`, `/api/groups/1/dashboard`, `/api/tickets/technicians`. `TicketService` filtra seguimientos/tareas privadas y bloquea mutaciones (`Claim`, `Plan`, `Resolve`, `SetPending`, `Reopen`). `TicketHub` bloquea suscripción a grupos técnicos (`signalr-authorization.spec.ts`). |
| **Técnico** (`tech1`, `tech_dev`, `tech_bi`, `tech_sd`) | `Kanban`, `Tickets`, `Cola`, `Servicios`, `Dashboard`, `Ayuda`, `Preferencias`. Sin `Mi Equipo` ni `Administración`. | Consultar cola de sus grupos, filtrar/ordenar tickets, auto-asignarse (`Asignarme`), planificar/reprogramar/completar/cancelar sus tareas, poner en pendiente, resolver y reabrir ticket Resuelto (5) propio. | `403 Forbidden` verificado vía HTTP real en `/api/admin/dashboard` y `/api/groups/1/dashboard`. `TicketService`/`TicketPlanningService` exige pertenencia al grupo y asignación para mutar tareas/estado; bloquea reapertura de tickets Cerrados (6). |
| **Supervisor** (`lider_dev`, `lider_bi`, `lider_sd`) | Todo lo de Técnico + `Mi Equipo` (`/equipo`). Sin `Administración`. | Consola de Supervisión en tiempo real (KPIs, carga por técnico, detección de estancados `>24h` y motivos de pausa, tablero filtrable del grupo), además de operar tickets de sus grupos. | `200 OK` en `/api/groups/{grupoPropio}/dashboard`; `403 Forbidden` verificado en `/api/groups/{grupoAjeno}/dashboard` (ej. `lider_dev` → grupo BI `2`) y `/api/admin/dashboard`. |
| **Administrador** (`admin_test`) | Navegación completa incluyendo `Mi Equipo` y `Administración` (`/administracion`). | Resumen global de grupos, estado del Watcher GLPI (cursor, pendientes, recuperación explícita de fallos permanentes), planificación en nombre de técnicos asignados y reapertura formal con motivo de tickets Cerrados (6). | `ValidateAdminPrincipal` exige `AppRole.Admin` en los 4 endpoints de `AdminEndpoints.cs`; `200 OK` verificado en `/api/admin/dashboard` y `/api/admin/watcher-status`. |

---

## 3. Evidencia de QA E2E Integral Final y Puertas de Calidad

**Corrida integral oficial ejecutada (post-correcciones de QA manual):** `CAPTURE_REDESIGN_SCREENSHOTS=1 node scripts/e2e/run.mjs` (sin filtros, sin skips, fixture desechable H-20 destruido y verificado al concluir).
- **Resultado Playwright:** **69 passed, 0 failed, 0 skipped** — Duración: **15.5 minutos** (exit code `0`).

| Puerta / Suite | Comando oficial ejecutado | Resultado exacto observado | Estado |
|---|---|---|---|
| Frontend ESLint | `pnpm lint` (`eslint src`) | `0 errors, 0 warnings` | **VALIDADO** |
| Frontend TypeScript | `pnpm typecheck` (`tsc --project tsconfig.build.json --noEmit`) | `0 errors` | **VALIDADO** |
| Frontend Unitarias | `pnpm test:unit` | **24 passed, 0 failed, 0 skipped** | **VALIDADO** |
| Frontend Build + PWA | `pnpm build` | Build exitoso (`dist/assets/index-9X02wddd.js`, `dist/sw.js`) | **VALIDADO** |
| **E2E Integral H-20** | `CAPTURE_REDESIGN_SCREENSHOTS=1 node scripts/e2e/run.mjs` | **69 passed, 0 failed, 0 skipped** (15.5m) | **VALIDADO** |
| Backend Release Build | `dotnet build src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj -c Release` | `0 Warnings, 0 Errors` | **VALIDADO** |
| Backend Unitarias | `dotnet test tests/GlpiTicketManager.Application.Tests -c Release --no-build` | **95 passed, 0 failed, 0 skipped** | **VALIDADO** |
| Backend Integración | `dotnet test tests/GlpiTicketManager.Api.Integration.Tests -c Release` | **251 passed, 0 failed, 0 skipped** | **VALIDADO** |
| GitNexus `detect_changes` | MCP `gitnexus.detect_changes(scope="all")` | Delta final: 10 símbolos UI compartidos / 21 procesos (`risk_level: critical` por tocar `AppLayout`/`AppSidebar`/`PageHeader`/`Card`/`Login`; mitigado sin cambios de contratos API/DB y con 439/439 pruebas automatizadas + QA manual en verde). | **VALIDADO** |
| Higiene Git | `git diff --check` | Limpio (`0` errores) | **VALIDADO** |
| Escaneo Secretos | `gitleaks git` sobre `main..HEAD` | `0 leaks found` | **VALIDADO** |

---

## 4. Accesibilidad (WCAG 2.2 AA) y Matriz Responsive

### Accesibilidad (Axe + Verificación Manual/Teclado)
- **Automatizado (Axe `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, incluyendo `meta-viewport`):** **0 violaciones** en:
  - `/login` (light)
  - 8 pantallas core en **light mode** (`a11y.spec.ts`: `/kanban`, `/tickets`, `/tickets/11`, `/queue`, `/services`, `/dashboard`, `/preferences`, `/ayuda`)
  - 8 pantallas core en **dark mode** (`redesign-ux-qa.spec.ts`)
  - Vistas de rol: Solicitante `/tickets`, Supervisor `/equipo`, Admin `/administracion`
  - Modal interactivo abierto: `Planificación asistida` (`VisualScheduleSelector`)
- **Teclado, Focus, Zoom y Reduced Motion:**
  - `Tab` revela el enlace visible `Saltar al contenido` (evidenciado en `16_preferences_desktop.png`).
  - `Ctrl+K` abre `CommandPalette` y `Escape` cierra `CommandPalette`, `MobileDrawer`, `TicketFiltersSheet` y `PlanTicketDialog`.
  - `emulateMedia({ reducedMotion: 'reduce' })` verificado en `redesign-ux-qa.spec.ts`; `BottomTabBar`, `AppSidebar`, `MobileDrawer`, `PageTransition` y `TicketCard` respetan `useReducedMotion()`.
  - Zoom libre móvil restaurado en `frontend/index.html` (SC 1.4.4) y `scroll-padding-top: 4.5rem` (SC 2.4.11).
- **Límite honesto:** Las auditorías automáticas + teclado cubren los criterios programáticos y de interacción principales; una certificación formal WCAG 2.2 AA con lector de pantalla (NVDA/VoiceOver) y usuarios con discapacidad real queda clasificada como **NO PROBADO** fuera de este entorno headless.

### Matriz Responsive (6 Breakpoints × 6 Rutas = 36 Combinaciones)
Verificada en `redesign-ux-qa.spec.ts` y `corporate-roles-and-responsive.spec.ts`:
- **Anchos validados:** `320px`, `375px`, `390px`, `768px`, `1024px`, `1366px`, `1440px`.
- **Rutas:** `/kanban`, `/tickets`, `/queue`, `/dashboard`, `/services`, `/tickets/11` (+ cards móviles de `/equipo` y `/administracion`).
- **Resultado:** `scrollWidth <= innerWidth + 1` en **36/36** combinaciones, 0 errores de consola, sin botones cortados ni truncamiento destructivo en `375px` (`09_mobile_375_tickets.png`, `10_mobile_375_detail.png`).

---

## 5. Auditoría Independiente de GLPI 11.0.13 Nativo y Propuesta para Producción

### Diferenciación Estricta de Estado
| Capa | Estado | Detalle |
|---|---|---|
| **Script de seeding (`scripts/seed-visual-forms.js`)** | **VALIDADO** | Idempotente (`ON DUPLICATE KEY UPDATE` + deduplicación + limpieza de rangos). Bloqueado estrictamente al laboratorio H-20 vía `scripts/e2e/guard.mjs` (exige `E2E_FIXTURE_MANIFEST`, `E2E_CONFIRM_DESTRUCTIVE` y tabla centinela `e2e_fixture_identity`). |
| **Aplicado realmente en H-20** | **VALIDADO** | Verificado en GLPI 11.0.13 real: 8 formularios destacados (`3..10`) + 2 generales (`1..2`) con `header` guía rápida, `description` contextual en preguntas y urgencia por defecto `Media` (`3`), preservando categorías ITIL fijas y reglas `RuleTicket` (`p0-glpi1113-forms-and-group-api.spec.ts` + `11_glpi_native_form3_enhanced.png` + `18_glpi_native_portal_home.png`). |
| **Aplicado en Producción** | **NO APLICADO (protegido)** | Cero modificaciones al core PHP de GLPI y cero escrituras en `glpi-db` productivo. |

### Propuesta Técnica Segura para Llevar las Mejoras de Formularios al GLPI Corporativo (Producción)
1. **Sin tocar core PHP ni ejecutar `seed-visual-forms.js` en producción:** Todas las mejoras residen exclusivamente en metadatos nativos soportados por GLPI 11 (`glpi_forms_forms.header`, `glpi_forms_questions.description`, `glpi_forms_questions.default_value`).
2. **Mecanismo recomendado (100% compatible con upgrades GLPI 11.x):**
   - **Opción A (Preferida — GUI nativa de Administración GLPI):** Un administrador de GLPI edita cada uno de los 8 formularios corporativos en `Administración > Formularios`, pegando el texto de encabezado (`Guía rápida`), la descripción de ayuda por pregunta y seleccionando `Media` como valor por defecto en la pregunta `Urgencia`. Esto dispara los hooks nativos, auditoría (`glpi_logs`) y caché de GLPI.
   - **Opción B (Migración SQL controlada y reversible con backup previo):** Si se prefiere automatización tras aprobación humana: (i) ejecutar respaldo verificado `mariadb-dump` de `glpi_forms_forms` y `glpi_forms_questions` con hash SHA-256; (ii) aplicar un script `UPDATE`-only acotado por `id` verificado dentro de una transacción `START TRANSACTION ... COMMIT` (sin `DELETE` ni `INSERT`); (iii) limpiar caché GLPI (`php bin/console cache:clear`); (iv) **Rollback inmediato:** restaurar el dump previo de las 2 tablas y limpiar caché.

---

## 6. Walkthrough Cognitivo Heurístico (7 Flujos Reales)

> **Nota metodológica:** El siguiente análisis es un **walkthrough cognitivo heurístico** realizado por el equipo de ingeniería/UX sobre la aplicación ejecutada en H-20. **No sustituye** pruebas moderadas con empleados reales (las cuales figuran como `NO PROBADO` hasta realizarse en piloto).

| # | Flujo | Objetivo y expectativa | Elemento usado | Pasos | Posible error / fricción | Feedback y recuperación |
|---|---|---|---|---|---|---|
| 1 | **Empleado nuevo crea un ticket** | Abrir solicitud sin conocer áreas internas ni categorías técnicas. | Portal Helpdesk GLPI → Tarjeta de servicio destacado (ej. `Requerimiento Service Desk`) → `Enviar`. | 3–4 clics + llenar 3 campos obligatorios. | Dejar vacío un campo `*` o dudar en `Urgencia`. | `Guía rápida` indica `*`, ejemplos bajo cada campo, `Urgencia` ya viene en `Media`; validación nativa señala el campo faltante y tras enviar muestra el `#ID` de ticket. |
| 2 | **Empleado encuentra su ticket luego** | Ver avance y solución sin ruido operativo. | Login GSI → aterriza directo en `Mis tickets` (`/tickets`) → clic en fila / `Ver`. | 2 pasos tras login. | Buscar por palabra clave o fecha equivocada. | Contador `X ticket(s) registrados por vos`, `TicketStatusStepper` visual y botón `Limpiar filtros` si no hay resultados. |
| 3 | **Técnico encuentra ticket urgente** | Identificar incidentes críticos sin técnico asignado. | `/queue` (filtro Prioridad = `Muy alta`/`Alta` o franja roja) o columna `Cola del grupo` en `/kanban`. | 1–2 clics. | Confundir grupo si pertenece a varios equipos. | Selector de grupo explícito en header de `/queue` y `/kanban` + `PriorityBadge` con icono de alerta + franja lateral roja. |
| 4 | **Técnico se asigna el ticket** | Tomar responsabilidad y mover el ticket a su trabajo. | Botón `Asignarme` en tarjeta Kanban, fila de `/queue` o panel derecho de `/tickets/:id`. | 1 clic. | Dos técnicos intentan tomar el mismo ticket simultáneamente. | Toast de confirmación (`Ticket asignado correctamente`), actualización inmediata vía SignalR; ante colisión/error devuelve mensaje claro sin estado corrupto. |
| 5 | **Técnico planifica y completa tarea** | Agendar horario real sin solapar su agenda y marcar intervención terminada. | En `/tickets/:id` (o hover Kanban) → `Planificar tarea` → elegir franja libre/recomendada → `Confirmar planificación`; luego `Completar` + `ConfirmDialog`. | 4 pasos planificar + 2 completar. | Elegir horario ocupado o fecha pasada. | `VisualScheduleSelector` marca `Ocupado` en rojo y ofrece `Seleccionar recomendada`; backend valida solapamientos atómicamente (`409 Conflict` con detalle legible). |
| 6 | **Técnico resuelve el ticket** | Registrar solución verificable y pasar a estado `5 (Resuelto)`. | Botón `Resolver` → completar tareas pendientes si las hay → ingresar solución → `Confirmar`. | 3 pasos. | Intentar resolver con tarea pendiente o solución vacía. | Aviso inline bloquea solución vacía y alerta si hay tareas abiertas; al confirmar muestra `Solución aplicada` y banner `Ticket Resuelto`. |
| 7 | **Administrador consulta estado del sistema** | Supervisar carga por grupo y salud del sincronizador GLPI. | Sidebar `Administración` (`/administracion`). | 1 clic. | Desconexión temporal de API o fallo de sincronización de un ticket. | KPIs globales, tabla por grupo y tarjeta `Estado operativo del Watcher GLPI` con cursor, conteos, alerta roja si hay fallos permanentes y botón `Recuperar ticket` con toast explícito. |

---

## 7. Evidencia Visual Completa (18 Capturas Inspeccionadas)

Directorio: `docs/qa/redesign-ux-ui-20261125/screenshots/`
1. `01_login_desktop.png` — Login corporativo dividido + toggle contraseña (1440×900)
2. `02_kanban_desktop_light.png` — Kanban modo claro (1440×900)
3. `03_kanban_desktop_dark.png` — Kanban modo oscuro WCAG AA (1440×900)
4. `04_queue_desktop.png` — Cola de grupo con búsqueda, filtro y acceso a detalle (1440×900)
5. `05_tickets_table_desktop.png` — Lista de tickets ordenable, columna Tipo, filtros alineados y paginación (1440×900)
6. `06_ticket_detail_stepper_desktop.png` — Detalle de ticket con `TicketStatusStepper` y acciones priorizadas (1440×900)
7. `07_dashboard_desktop.png` — Dashboard operativo de técnico con 4 KPIs y distribución por estado (1440×900)
8. `08_services_desktop.png` — Catálogo de servicios (8 tarjetas + buscador árbol ITIL) (1440×900)
9. `09_mobile_375_tickets.png` — Lista móvil 375px sin truncamiento
10. `10_mobile_375_detail.png` — Detalle móvil 375px con stepper y acciones
11. `11_glpi_native_form3_enhanced.png` — GLPI 11 nativo Formulario #3 con guía rápida, ayudas y urgencia `Media`
12. `12_solicitante_tickets_desktop.png` — Vista de Solicitante (`user_test`) con navegación acotada
13. `13_supervisor_equipo_desktop.png` — Consola de Supervisión (`lider_dev` en `/equipo`) alineada a Enterprise Precision
14. `14_admin_panel_desktop.png` — Panel de Administración (`admin_test` en `/administracion`) + Watcher GLPI
15. `15_planning_modal_desktop.png` — Modal `Planificación asistida` con contraste WCAG AA verificado
16. `16_preferences_desktop.png` — Preferencias (incluyendo foco visible en `Saltar al contenido`)
17. `17_ayuda_desktop.png` — Guía del agente con badges de estado y `<code>` formateados
18. `18_glpi_native_portal_home.png` — Portal Helpdesk nativo GLPI 11 con 8 servicios destacados y solicitudes en curso

---

## 8. Matriz Final Release Candidate

| Funcionalidad | Rol | Pantalla | Test asociado | Resultado | Evidencia | Estado |
|---|---|---|---|---|---|---|
| Autenticación corporativa y toggle contraseña | Todos | `/login` | `redesign-ux-qa.spec.ts` (Test 54), `logout-ui.spec.ts`, `logout.spec.ts` | PASS (0 violaciones WCAG) | `01_login_desktop.png` | **VALIDADO** |
| Autoservicio y aislamiento de Solicitante | Solicitante | `/tickets`, `/tickets/:id` | `full-user-journey.spec.ts`, `corporate-roles-and-responsive.spec.ts`, `redesign-ux-qa.spec.ts` (Test 59), `signalr-authorization.spec.ts` | PASS + `403` backend en admin/equipo/technicians | `12_solicitante_tickets_desktop.png` | **VALIDADO** |
| Tablero Kanban 5 columnas + SignalR | Técnico / Sup / Admin | `/kanban` | `kanban-flow.spec.ts`, `kanban-mobile.spec.ts`, `kanban-polling.spec.ts`, `kanban-sorting.spec.ts`, `realtime.spec.ts`, `qa-planning-regressions.spec.ts` | PASS (light + dark WCAG AA) | `02_kanban_desktop_light.png`, `03_kanban_desktop_dark.png` | **VALIDADO** |
| Cola del grupo navegable y auto-asignación | Técnico / Sup / Admin | `/queue` | `self-assign-flow.spec.ts`, `multi-group.spec.ts`, `queue-planning-privacy.spec.ts`, `redesign-ux-qa.spec.ts` (Test 55) | PASS (sin fuga de metadatos privados) | `04_queue_desktop.png` | **VALIDADO** |
| Lista ordenable, filtros y paginación | Todos | `/tickets` | `date-filter.spec.ts`, `service-filter.spec.ts`, `tickets-mobile.spec.ts`, `tickets-filters-mobile.spec.ts`, `redesign-ux-qa.spec.ts` | PASS (`aria-sort`, 320–1440px) | `05_tickets_table_desktop.png`, `09_mobile_375_tickets.png` | **VALIDADO** |
| Detalle ITIL, stepper, tareas, pendiente, resolver y reabrir | Todos (según rol) | `/tickets/:id` | `pending-ticket.spec.ts`, `resolve-ticket.spec.ts`, `resolve-short-solution.spec.ts`, `realtime-reopen.spec.ts`, `readonly-consult-flow.spec.ts` | PASS + coherencia UI/backend | `06_ticket_detail_stepper_desktop.png`, `10_mobile_375_detail.png` | **VALIDADO** |
| Planificación asistida, conflictos atómicos y disponibilidad | Técnico / Sup / Admin | Modal `PlanTicketDialog` | `qa-planning-regressions.spec.ts` (concurrencia 409), `redesign-ux-qa.spec.ts` (Test 60) | PASS (0 violaciones WCAG en modal) | `15_planning_modal_desktop.png` | **VALIDADO** |
| Dashboard operativo de técnico | Técnico / Sup / Admin | `/dashboard` | `dashboard.spec.ts`, `a11y.spec.ts` | PASS | `07_dashboard_desktop.png` | **VALIDADO** |
| Consola de Supervisión de grupo | Supervisor / Admin | `/equipo` | `redesign-ux-qa.spec.ts` (Test 59) + `403` cruzado de grupos | PASS (0 violaciones WCAG) | `13_supervisor_equipo_desktop.png` | **VALIDADO** |
| Panel de Administración y Watcher GLPI | Administrador | `/administracion` | `redesign-ux-qa.spec.ts` (Test 59) + `AdminEndpoints` integration tests | PASS (0 violaciones WCAG + toast feedback) | `14_admin_panel_desktop.png` | **VALIDADO** |
| Catálogo de Servicios y árbol ITIL | Técnico / Sup / Admin | `/services` | `services.spec.ts`, `service-filter.spec.ts`, `queue-planning-privacy.spec.ts`, `redesign-ux-qa.spec.ts` | PASS (8 tarjetas + filtro vivo) | `08_services_desktop.png` | **VALIDADO** |
| Preferencias (tema claro/oscuro, presets, push) | Todos | `/preferences` | `preferences.spec.ts`, `preferences-ui.spec.ts`, `dark-mode.spec.ts`, `a11y.spec.ts`, `redesign-ux-qa.spec.ts` | PASS (timer leak y IP fija corregidos) | `16_preferences_desktop.png` | **VALIDADO** |
| Ayuda y Guía del agente | Todos | `/ayuda` | `agent-guide.spec.ts`, `a11y.spec.ts`, `redesign-ux-qa.spec.ts` | PASS (`<dl>` WCAG + `<code>`) | `17_ayuda_desktop.png` | **VALIDADO** |
| Formularios nativos GLPI 11.0.13 + API grupos + Backup/Restore | Solicitante / Sistema | GLPI `/Form/Render/3..10` | `p0-glpi1113-forms-and-group-api.spec.ts` (3 tests), `redesign-ux-qa.spec.ts` (Test 58) | PASS (8/8 formularios + `glpi_logs` + restore real) | `11_glpi_native_form3_enhanced.png`, `18_glpi_native_portal_home.png` | **VALIDADO** |
| Pruebas con usuarios finales reales y lector de pantalla (NVDA/VoiceOver) | Piloto humano | Todas | — | No ejecutado en entorno headless | Requiere sesión piloto humana | **NO PROBADO** |

---

## 9. Auditoría Manual Interactiva en Navegador Real (H-20 Aislado)

Ejecutada interactivamente en navegador real (`1440×900`, `0` errores de consola) sobre un laboratorio H-20 desechable (destruido por completo al finalizar junto con sus usuarios sintéticos efímeros):

| Fase | Controles y flujos verificados interactivamente | Resultado |
|---|---|---|
| **Fase 1 — Login** | Composición visual corporativa, intento con contraseña inválida (`401` + alerta clara), toggle `Mostrar/Ocultar contraseña`, inicio de sesión limpio | **VALIDADO MANUALMENTE** |
| **Fase 2 — Solicitante + GLPI 11.0.13** | Aterrizaje en `/tickets` con sidebar restringido, detalle `#9901` en solo lectura con `TicketStatusStepper`, menú flotante de avatar + `Escape`, `/preferences` + toggle tema, login en GLPI nativo, Formulario #3 (`Guía rápida`, urgencia `Media`) y envío real creando ticket `#9903` | **VALIDADO MANUALMENTE** *(defectos de sincronía tema y badge corregidos tras la prueba)* |
| **Fase 3 — Técnico (Ciclo Completo)** | Sidebar macOS sin borde vertical + colapso `72px`/expansión, Navbar minimalista, `CommandPalette` (`Ctrl+K`, búsqueda `9901`, `Escape`), `NotificationBell`, Kanban 5 columnas suaves, `/queue`, `Asignarme` en `#9902`, tabla `/tickets` (búsqueda, filtros, orden `Prioridad`, paginación), ciclo completo `#9901` (`Planificar tarea` → `En proceso (planificado)` → `Completar` + `ConfirmDialog` → `Resolver` → `Resuelto` + banner de solución), `/dashboard`, `/services` (filtro vivo `Acceso`), `/ayuda` y cierre de sesión | **VALIDADO MANUALMENTE** *(footer sticky de modal, truncamiento en `/queue` y sidebar corregidos tras la prueba)* |
| **Fase 4 — Supervisor (`/equipo`)** | KPIs Enterprise Precision (`MTTR promedio`, `Estancados`), tabla de técnicos, clic en fila de técnico para filtrar tickets, filtro de estado `4 · Pendiente`, botón `Limpiar`, ausencia de `Administración` y logout | **VALIDADO MANUALMENTE** |
| **Fase 5 — Administrador (`/administracion`)** | KPIs globales, tabla `Resumen por grupo`, tarjeta `Estado operativo del Watcher GLPI` (confirmando cursor actualizado en ticket `#9903` creado en Fase 2), `0` errores de consola y logout | **VALIDADO MANUALMENTE** |

---

## 10. Riesgos Restantes y Notas Operativas

- **Riesgos menores residuales (no bloqueantes):**
  1. Chunk principal `dist/assets/index-*.js` (~1.02 MB / 296 KB gzip): candidato a `React.lazy` por ruta en una iteración de optimización posterior.
  2. La validación con usuarios finales reales y lectores de pantalla físicos (NVDA/VoiceOver) queda recomendada como piloto post-despliegue antes de declarar conformidad organizacional formal.
  3. Las mejoras de encabezados/ayudas en formularios de GLPI productivo deben aplicarse siguiendo la propuesta segura de la Sección 5 (nunca corriendo `seed-visual-forms.js` contra producción).
