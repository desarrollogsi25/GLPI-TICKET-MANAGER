# Auditoría UX/UI, Dirección Visual y Design System — GLPI Ticket Manager (GSI Service Desk)

**Fecha:** 2026-11-25
**Rama:** `feat/ux-ui-enterprise-redesign-20261125`
**Base (`main`):** `e4996e8bee1601cda7470ae8105799eeb1842136`
**Dirección Visual:** *Enterprise Precision — IT Service Management*

---

## 1. Referencias de Diseño y Usabilidad Aplicadas

| Referencia | Principios Extraídos y Aplicados |
|---|---|
| **IBM Carbon Design System** | Tablas densas escaneables con encabezados ordenables (`aria-sort`), separadores arquitectónicos de 1px (`border-border`), indicadores de estado que combinan icono + texto (nunca solo color) y jerarquía neutra de superficies (`--background`, `--surface-subtle`, `--card`). |
| **Atlassian Design System (ADS)** | Distinción estricta entre *Lozenges* de estado/prioridad (`StatusBadge`, `PriorityBadge`) y contadores numéricos (*Badges*), atenuación controlada de estados terminales (`Cerrado`) para que los tickets activos destaquen, y panel lateral de metadatos estructurado en Detalle. |
| **Nielsen Norman Group (10 Heurísticas)** | Visibilidad del estado del sistema (`TicketStatusStepper`, `ConnectionIndicator` persistente en header), reconocimiento sobre recuerdo (etiquetas legibles de Urgencia/Impacto en lugar de códigos `3/3`, ejemplos en formularios GLPI), prevención de errores (`ConfirmDialog` en acciones destructivas), control del usuario (botón Volver, limpiar búsqueda/filtros, `Ctrl+K`). |
| **WCAG 2.2 AA** | Eliminación de `user-scalable=no` y `maximum-scale=1.0` en `index.html` (SC 1.4.4), `scroll-padding-top` para evitar foco oculto tras headers sticky (SC 2.4.11), objetivos táctiles mínimos (SC 2.5.8), contraste ≥ 4.5:1 en claro/oscuro, respeto a `prefers-reduced-motion` y reactivación de la regla `meta-viewport` en `a11y.spec.ts`. |

---

## 2. Inventario Priorizado de Hallazgos Auditados (Antes → Después)

### P0 — Accesibilidad y Seguridad Operativa
- **P0-01 (`frontend/index.html`):** `<meta name="viewport">` contenía `maximum-scale=1.0, user-scalable=no`, bloqueando zoom en dispositivos móviles (fallo WCAG 1.4.4 ocultado con `disableRules(['meta-viewport'])`). **Resuelto:** restaurado escalado libre y reactivada regla en `a11y.spec.ts` junto con etiqueta `wcag22aa`.
- **P0-02 (`PageTransition.tsx` & `index.css`):** `no-scrollbar` ocultaba barras de desplazamiento y `tabIndex={0}` creaba un foco fantasma; faltaba `scroll-padding-top` (WCAG 2.4.11). **Resuelto:** restaurado `custom-scrollbar`, eliminado `tabIndex` redundante y añadido `scroll-padding-top: 4.5rem`.

### P1 — UX/UI Crítico y Productividad Diaria
- **P1-01 (Tipografía inconsistente):** `PageHeader` y `Login` usaban fuente editorial serif (`Fraunces`) frente a `Inter` en Detalle/Tablas. **Resuelto:** tipografía unificada *Enterprise Precision* (`Inter` + `JetBrains Mono` para `#IDs` y marcas de tiempo con `tabular-nums`).
- **P1-02 (`GroupQueuePage.tsx`):** En `/queue`, el título del ticket no era clickeable (impedía inspeccionar el ticket antes de tomarlo), mostraba `Urgencia 3 · Impacto 3` en crudo y no tenía búsqueda ni filtro de prioridad. **Resuelto:** enlaces clickeables al detalle, botón secundario `Ver`, barra de búsqueda + filtro de prioridad, franja lateral de prioridad y etiquetas humanas (`Media`, `Alta`).
- **P1-03 (`Detail.tsx`):** Acciones duplicadas sin jerarquía visual clara, ausencia de botón `Volver`, falta de progreso visual del ciclo de vida ITIL y ausencia de botón directo `Asignarme` para tickets sin técnico. **Resuelto:** nuevo `TicketStatusStepper` (1→2→3→5→6 + rama Espera), botón `Volver`, botón directo `Asignarme` en tickets en cola, separación clara de *Acciones principales* vs *Estados GLPI*, diferenciación visual de notas privadas vs públicas y metadatos ampliados (Grupo, Urgencia/Impacto, Cerrado).
- **P1-04 (`Dashboard.tsx`):** Sobrecarga de 10 tarjetas idénticas en rejilla de 4 columnas (dejando 2 huérfanas) con códigos internos `GLPI 1..6` en subtítulos. **Resuelto:** 4 KPIs operativos de alta señal + barra operativa de tareas programadas/SLA + lista accionable de cola + distribución interactiva por estado con barras proporcionales reales.
- **P1-05 (`List.tsx` / `TicketTable.tsx`):** Encabezados de tabla sin ordenamiento interactivo ni `aria-sort`, sin columna de `Tipo`, sin rango de paginación ni selector de tamaño de página, y uso de emojis (`🎫`, `⚠️`). **Resuelto:** ordenamiento por clic con iconos y `aria-sort`, columna `Tipo`, rango `Mostrando X–Y de Z` + selector `15/30/50`, y componentes `EmptyState`/`ErrorState`.
- **P1-06 (`Login.tsx`):** Ondas decorativas grises, tarjeta glass flotante sin botón para mostrar/ocultar contraseña. **Resuelto:** pantalla dividida profesional (panel corporativo oscuro con pilares operativos + formulario limpio con toggle `Mostrar/Ocultar contraseña`).

### P2 — Consistencia de Marca, Navegación y GLPI Nativo
- **P2-01 (`AppSidebar.tsx` / `AppLayout.tsx`):** Subtítulo genérico `"Workspace SaaS"`, breadcrumb de `/kanban` etiquetado erróneamente como `"Mis tickets"`, falta de indicador de rol en perfil y falta de bordes separadores. **Resuelto:** identidad `GSI Service Desk / GLPI Ticket Manager`, breadcrumb corregido a `Kanban`, rol visible en perfil, bordes arquitectónicos `1px` y estado SignalR visible en cabecera desktop.
- **P2-02 (`Kanban.tsx` / `TicketCard.tsx` / `ServicesPage.tsx` / `AgentGuide.tsx` / `AdminDashboard.tsx` / `PreferencesPage.tsx`):** Emojis en estados vacíos/error, pulsación perpetua en badges de prioridad y ausencia de buscador en el árbol de categorías ITIL. **Resuelto:** iconografía Lucide uniforme, franjas de prioridad limpias sin fatiga visual y buscador en árbol ITIL.
- **P2-03 (GLPI 11 Nativo — `scripts/seed-visual-forms.js`):** Formularios sin encabezado guía, preguntas sin ejemplos contextuales y campo Urgencia inicializado en `-----`. **Resuelto (vía motor nativo GLPI 11, sin tocar core PHP ni BD productiva):** añadidos `header`, `description` y `default_value='3'` (Media) en el seed H-20 reproducible.

---

## 3. Design System Incorporado (`frontend/src/components/ui/`)

- `status-badge.tsx`: `StatusBadge` y `PriorityBadge` con icono semántico + etiqueta WCAG AA.
- `empty-state.tsx`: `EmptyState` y `ErrorState` estandarizados con acción de recuperación.
- `section-header.tsx`: `SectionHeader` uniforme para secciones internas.
- `avatar.tsx`: `Avatar` con iniciales, tamaños (`xs | sm | md | lg`) y tonos semánticos.
- `confirm-dialog.tsx`: `ConfirmDialog` (AlertDialog accesible con bloqueo de carga y cierre seguro `Esc`).
- `status-stepper.tsx`: `TicketStatusStepper` para visualización del ciclo de vida ITIL.
- `switch.tsx`: `Switch` accesible (`role="switch"`).
