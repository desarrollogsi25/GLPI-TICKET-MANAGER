# Auditoría UX/UI, Dirección Visual y Design System — GLPI Ticket Manager (GSI Service Desk)

**Fecha:** 2026-11-26 (Actualización Release Candidate)
**Rama:** `feat/ux-ui-enterprise-redesign-20261125`
**Base (`main`):** `e4996e8bee1601cda7470ae8105799eeb1842136`
**Commit previo de rediseño:** `44e2005594225797fbfa2f0921aac6e1cca83ea1`
**Dirección Visual:** *Enterprise Precision — IT Service Management*

---

## 1. Referencias de Diseño y Usabilidad Aplicadas

| Referencia | Principios Extraídos y Aplicados |
|---|---|
| **IBM Carbon Design System** | Tablas densas escaneables con encabezados ordenables (`aria-sort`), separadores arquitectónicos de 1px (`border-border`), indicadores de estado que combinan icono + texto (nunca solo color) y jerarquía neutra de superficies (`--background`, `--surface-subtle`, `--card`). |
| **Atlassian Design System (ADS)** | Distinción estricta entre *Lozenges* de estado/prioridad (`StatusBadge`, `PriorityBadge`) y contadores numéricos (*Badges*), atenuación controlada de estados terminales (`Cerrado`) para que los tickets activos destaquen, y panel lateral de metadatos estructurado en Detalle. |
| **Nielsen Norman Group (10 Heurísticas)** | Visibilidad del estado del sistema (`TicketStatusStepper`, `ConnectionIndicator` persistente en header), reconocimiento sobre recuerdo (etiquetas legibles de Urgencia/Impacto en lugar de códigos `3/3`, ejemplos en formularios GLPI), prevención de errores (`ConfirmDialog` en acciones destructivas), control del usuario (botón Volver, limpiar búsqueda/filtros, `Ctrl+K`). |
| **WCAG 2.2 AA** | Eliminación de `user-scalable=no` y `maximum-scale=1.0` en `index.html` (SC 1.4.4), `scroll-padding-top` para evitar foco oculto tras headers sticky (SC 2.4.11), objetivos táctiles mínimos (SC 2.5.8), contraste ≥ 4.5:1 en claro/oscuro y modales, regiones desplazables accesibles por teclado (`tabIndex={0}` en páginas no-Kanban), respeto a `prefers-reduced-motion` y reactivación de la regla `meta-viewport` en `a11y.spec.ts`. |

---

## 2. Inventario Priorizado de Hallazgos Auditados (Antes → Después)

### P0 — Accesibilidad y Seguridad Operativa
- **P0-01 (`frontend/index.html`):** `<meta name="viewport">` contenía `maximum-scale=1.0, user-scalable=no`, bloqueando zoom en dispositivos móviles (fallo WCAG 1.4.4 ocultado con `disableRules(['meta-viewport'])`). **Resuelto:** restaurado escalado libre y reactivada regla en `a11y.spec.ts` junto con etiqueta `wcag22aa`.
- **P0-02 (`PageTransition.tsx` & `index.css`):** `no-scrollbar` ocultaba barras de desplazamiento y faltaba `scroll-padding-top` (WCAG 2.4.11). **Resuelto:** restaurado `custom-scrollbar`, añadido `scroll-padding-top: 4.5rem`, y mantenido `tabIndex={0}` con `focus:outline-none` únicamente en vistas desplazables no-Kanban para cumplir `scrollable-region-focusable` (WCAG 2.1.1) en páginas de lectura como `/ayuda`.
- **P0-03 (`VisualScheduleSelector.tsx` — Fase RC):** Las franjas horarias pasadas pero interactivas dentro del modal de planificación usaban `text-muted-foreground/60` + `opacity-75`, arrojando contraste insuficiente (`2.12:1`–`2.83:1` frente a `4.5:1` WCAG 2.2 AA). **Resuelto:** corregidos los tokens de texto/subtítulo a `text-muted-foreground` (`>5.7:1`), validado con 0 violaciones Axe en el modal abierto.

### P1 — UX/UI Crítico, Autorización UI/Backend y Productividad Diaria
- **P1-01 (Tipografía inconsistente):** `PageHeader` y `Login` usaban fuente editorial serif (`Fraunces`) frente a `Inter` en Detalle/Tablas. **Resuelto:** tipografía unificada *Enterprise Precision* (`Inter` + `JetBrains Mono` para `#IDs` y marcas de tiempo con `tabular-nums`).
- **P1-02 (`GroupQueuePage.tsx`):** En `/queue`, el título del ticket no era clickeable, mostraba `Urgencia 3 · Impacto 3` en crudo y no tenía búsqueda ni filtro de prioridad. **Resuelto:** enlaces clickeables al detalle, botón secundario `Ver`, barra de búsqueda + filtro de prioridad, franja lateral de prioridad y etiquetas humanas (`Media`, `Alta`).
- **P1-03 (`Detail.tsx`):** Acciones sin jerarquía clara, falta de `Volver`, falta de stepper ITIL y botones de mutación habilitados incluso cuando un técnico visualizaba un ticket asignado a otro técnico. **Resuelto:** `TicketStatusStepper` (1→2→3→5→6 + rama Espera), botón `Volver`, botón directo `Asignarme` en tickets en cola, separación *Acciones principales* vs *Estados GLPI*, deshabilitación explícita con tooltip cuando `role === 'technician' && !isAssigned` (coincidiendo 100% con el `403` del backend), distinción visual de notas privadas vs públicas y metadatos ampliados.
- **P1-04 (`Dashboard.tsx`):** Sobrecarga de 10 tarjetas en rejilla de 4 columnas (2 huérfanas). **Resuelto:** 4 KPIs clicables de alta señal + barra operativa de tareas/SLA + cola accionable + distribución interactiva por estado con barras proporcionales reales.
- **P1-05 (`List.tsx` / `TicketTable.tsx` / `TicketFiltersBar.tsx`):** Sin ordenamiento ni `aria-sort`, sin columna `Tipo`, sin rango de paginación y etiquetas desalineadas en barra de filtros. **Resuelto:** ordenamiento con `aria-sort`, columna `Tipo`, `Mostrando X–Y de Z` + selector `15/30/50`, toolbar de 5 filtros alineados en una fila y tarjetas móviles sin truncamiento.
- **P1-06 (`Login.tsx`):** Tarjeta glass flotante sin toggle de visibilidad de contraseña. **Resuelto:** pantalla dividida corporativa con toggle accesible `Mostrar/Ocultar contraseña`.
- **P1-07 (`TeamDashboard.tsx` — Fase RC):** La Consola de Supervisión (`/equipo`) conservaba tarjetas pastel legacy, cast `as any`, barra de filtros *Liquid Glass*, etiqueta `'3 · En Progreso'` en lugar de `'3 · En proceso (planificado)'`, badges sin icono y error sin botón de reintento. **Resuelto:** alineado integralmente a *Enterprise Precision* con KPIs tipados (`MTTR promedio`), `StatusBadge`, `PriorityBadge`, `Avatar`, `EmptyState`, `ErrorState` con `refetch()` y terminología oficial GLPI.
- **P1-08 (`AdminDashboard.tsx` — Fase RC):** El botón `Recuperar ticket` del Watcher GLPI no emitía toast de confirmación/error y un fallo en `/api/admin/watcher-status` se silenciaba. **Resuelto:** feedback explícito con toast en éxito/error y `ErrorState` con reintento ante fallo de consulta del watcher.

### P2 — Consistencia de Marca, Mantenibilidad, Navegación y GLPI Nativo
- **P2-01 (`AppSidebar.tsx` / `AppLayout.tsx` / `MobileDrawer.tsx` / `BottomTabBar.tsx`):** Identidad unificada `GSI Service Desk / GLPI Ticket Manager` en sidebar y drawer móvil, rol explícito + `Avatar` en ambos, sincronización de icono claro/oscuro mediante `MutationObserver` con `disconnect()`, y soporte `useReducedMotion()` en `BottomTabBar`.
- **P2-02 (`PreferencesPage.tsx` — Fase RC):** Corregida fuga de temporizador (`savedMsgTimerRef` limpiado en unmount y re-disparo), eliminada IP LAN hardcodeada (`https://10.10.40.31`) en favor de `window.location.origin` dinámico, y eliminadas tarjetas legacy `rounded-2xl backdrop-blur-md` + `animate-pulse`.
- **P2-03 (`useRealtimeTicketHub.ts` / `AgentGuide.tsx` — Fase RC):** Etiqueta optimista SignalR para estado `3` corregida a `'En proceso (planificado)'`; backticks literales en `AgentGuide.tsx` reemplazados por elementos `<code>` con formato semántico.
- **P2-04 (GLPI 11 Nativo — `scripts/seed-visual-forms.js`):** Formularios con `header`, `description` y `default_value='3'` (Media) en el seed H-20 idempotente y protegido por `scripts/e2e/guard.mjs`.

---

## 3. Design System Incorporado (`frontend/src/components/ui/`)

- `status-badge.tsx`: `StatusBadge` y `PriorityBadge` con icono semántico + etiqueta WCAG AA (`truncate` seguro).
- `empty-state.tsx`: `EmptyState` y `ErrorState` estandarizados con acción de recuperación.
- `section-header.tsx`: `SectionHeader` uniforme para secciones internas.
- `avatar.tsx`: `Avatar` con iniciales, tamaños (`xs | sm | md | lg`) y tonos semánticos.
- `confirm-dialog.tsx`: `ConfirmDialog` (AlertDialog accesible con bloqueo de carga y cierre seguro `Esc`).
- `status-stepper.tsx`: `TicketStatusStepper` para visualización del ciclo de vida ITIL.
- `switch.tsx`: `Switch` accesible (`role="switch"`).
