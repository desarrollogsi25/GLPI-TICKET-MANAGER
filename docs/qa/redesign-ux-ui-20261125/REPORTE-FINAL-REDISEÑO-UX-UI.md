# Informe Final Release Candidate — Auditoría, Refinamiento UX/UI, Accesibilidad y QA

**Proyecto:** GLPI Ticket Manager / GSI Service Desk (`desarrollogsi25/GLPI-TICKET-MANAGER`)
**Fecha:** 2026-11-26
**Rama de trabajo aislada:** `feat/ux-ui-enterprise-redesign-20261125`
**SHA base (`main`):** `e4996e8bee1601cda7470ae8105799eeb1842136`
**Commit anterior (fase rediseño):** `44e2005594225797fbfa2f0921aac6e1cca83ea1`
**Estado global:** `RELEASE CANDIDATE — READY FOR HUMAN REVIEW` *(sin push, sin PR, sin merge a `main` y sin despliegue en LAN)*

---

## 1. Resumen Ejecutivo y Alcance del Refinamiento RC

Tras la auditoría crítica e independiente del commit `44e2005`, se identificaron y corrigieron **8 hallazgos reales** (sin cambios cosméticos innecesarios):

1. **WCAG 2.2 AA en Modal de Planificación (`VisualScheduleSelector.tsx`):** Contraste `2.12:1`–`2.83:1` en franjas horarias pasadas interactivas (`text-muted-foreground/60` + `opacity-75`) corregido a `text-muted-foreground` (`>5.7:1`).
2. **Consola de Supervisión (`TeamDashboard.tsx`):** Alineada a *Enterprise Precision* (eliminado cast `as any`, tarjetas pastel y barra *Liquid Glass*; adoptados `StatusBadge`, `PriorityBadge`, `Avatar`, `EmptyState`, `ErrorState` con reintento; corregido `'3 · En Progreso'` → `'3 · En proceso (planificado)'` y `'Tiempo Medio (MTTR)'` → `'MTTR promedio'` sin truncamiento).
3. **Panel de Administración (`AdminDashboard.tsx`):** Añadido feedback toast explícito en éxito/error para `Recuperar ticket` del Watcher GLPI y estado `ErrorState` visible si falla `/api/admin/watcher-status`.
4. **Fuga de temporizador e IP hardcodeada (`PreferencesPage.tsx`):** Timer de `savedMessage` almacenado en `savedMsgTimerRef` con limpieza en unmount y re-disparo; eliminada IP LAN hardcodeada (`https://10.10.40.31`) reemplazada por `window.location.origin` dinámico; eliminados `backdrop-blur-md` y `animate-pulse`.
5. **Coherencia UI ↔ Autorización Backend (`Detail.tsx`):** Deshabilitados `Planificar tarea`, `Resolver` y `Poner en pendiente` (con tooltip explicativo) cuando un técnico inspecciona un ticket asignado a otro técnico, reflejando el `403 Forbidden` del servidor.
6. **Terminología SignalR y Ayuda (`useRealtimeTicketHub.ts`, `AgentGuide.tsx`):** Etiqueta optimista estado `3` corregida a `'En proceso (planificado)'`; backticks literales en `/ayuda` convertidos a etiquetas `<code>`.
7. **Layout móvil y Reduced Motion (`AppLayout.tsx`, `MobileDrawer.tsx`, `BottomTabBar.tsx`):** Icono de tema sincronizado vía `MutationObserver` con `disconnect()`; branding/rol/Avatar unificados en drawer móvil; respeto estricto a `prefers-reduced-motion` en `BottomTabBar`.
8. **Cobertura QA ampliada (`redesign-ux-qa.spec.ts`):** Agregadas pruebas de autorización backend `403` por los 4 roles, WCAG 2.2 AA en `/equipo`, `/administracion` y Modal de Planificación, teclado (`Tab`/`Ctrl+K`/`Escape`), `reducedMotion: 'reduce'` y captura de las 18 pantallas (cubriendo las 14 vistas requeridas).

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

**Corrida integral oficial ejecutada:** `node scripts/e2e/run.mjs` (sin filtros, sin skips, fixture desechable H-20 destruido y verificado al concluir).
- **Artifact Run ID:** `ece2fa75298c282b6e901ba43a6567e3` (`frontend/e2e-artifacts/ece2fa75298c282b6e901ba43a6567e3/`)
- **Resultado Playwright:** **69 passed, 0 failed, 0 skipped** — Duración: **12.2 minutos** (exit code `0`).

| Puerta / Suite | Comando oficial ejecutado | Resultado exacto observado | Estado |
|---|---|---|---|
| Frontend ESLint | `pnpm lint` (`eslint src`) | `0 errors, 0 warnings` | **VALIDADO** |
| Frontend TypeScript | `pnpm typecheck` (`tsc --project tsconfig.build.json --noEmit`) | `0 errors` | **VALIDADO** |
| Frontend Unitarias | `pnpm test:unit` | **24 passed, 0 failed, 0 skipped** (5.97s) | **VALIDADO** |
| Frontend Build + PWA | `pnpm build` | Build exitoso (`dist/assets/index-*.js`, `dist/sw.js`) | **VALIDADO** |
| **E2E Integral H-20** | `node scripts/e2e/run.mjs` | **69 passed, 0 failed, 0 skipped** (12.2m) | **VALIDADO** |
| Backend Release Build | `dotnet build src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj -c Release` | `0 Warnings, 0 Errors` (6.50s) | **VALIDADO** |
| Backend Unitarias | `dotnet test tests/GlpiTicketManager.Application.Tests -c Release --no-build` | **95 passed, 0 failed, 0 skipped** (1s) | **VALIDADO** |
| Backend Integración | `dotnet test tests/GlpiTicketManager.Api.Integration.Tests -c Release` | **251 passed, 0 failed, 0 skipped** (16s) | **VALIDADO** |
| GitNexus `detect_changes` | MCP `gitnexus.detect_changes(scope="all")` | Delta RC: 15 símbolos / 25 procesos (`risk_level: critical` por tocar `AppLayout`/`Detail`/`TeamDashboard`; mitigado sin cambios de contratos API/DB y con 439 pruebas automatizadas en verde). | **VALIDADO** |
| Higiene Git | `git diff --check` | Limpio (`0` errores) | **VALIDADO** |
| Escaneo Secretos | `gitleaks git /repo --log-opts="main..HEAD"` | `0 leaks found` | **VALIDADO** |

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
| Publicación en `main` / Despliegue LAN / Aplicación en GLPI productivo | Aprobación humana | Producción | — | Retenido por política de gobernanza | `AWAITING_HUMAN_APPROVAL` | **BLOQUEADO** |

---

## 9. Riesgos Restantes y Confirmación de Protección Productiva

- **Producción 100% intacta:** `glpi-db` y `glpi-app-db` (`Up 44+ hours (healthy)`) y `glpi`, `glpi-api`, `glpi-frontend`, `glpi-lan-frontend`, `glpi-nginx` (`Up 42+ hours`) jamás fueron reiniciados, reconfigurados ni escritos.
- **Riesgos menores residuales (no bloqueantes para RC):**
  1. Chunk principal `dist/assets/index-*.js` (~1.02 MB / 295 KB gzip): candidato a `React.lazy` por ruta en una iteración de optimización posterior.
  2. La validación con usuarios reales y lectores de pantalla físicos queda recomendada como piloto post-revisión antes de declarar conformidad organizacional formal.
  3. Las mejoras de encabezados/ayudas en formularios de GLPI productivo deben aplicarse siguiendo la propuesta segura de la Sección 5 (nunca corriendo `seed-visual-forms.js` contra producción).
