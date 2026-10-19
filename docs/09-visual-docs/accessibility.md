# Auditoría de Accesibilidad (WCAG 2.1 AA)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-09-ACCESSIBILITY | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


Este documento registra los estándares, herramientas, fixes implementados y resultados de la auditoría de accesibilidad aplicada en **GLPI Ticket Manager** (Bloque 11).

---

## 1. Estándar y Alcance

- **Estándar objetivo:** WCAG 2.1 Nivel AA (incluyendo reglas WCAG 2.0 A/AA y WCAG 2.1 A/AA).
- **Herramienta de auditoría automatizada:** `@axe-core/playwright` v4.13.0 ejecutado en Playwright.
- **Vistas evaluadas (8 páginas principales):**
  - `/kanban` (Tablero Kanban con drag-and-drop y segmented tabs)
  - `/tickets` (Listado responsivo de tickets, cards móviles y tabla desktop)
  - `/tickets/11` (Detalle de ticket y soluciones)
  - `/queue` (Cola de tickets sin asignar del grupo)
  - `/services` (Catálogo jerárquico de servicios)
  - `/dashboard` (Métricas, accesos directos y tickets pendientes)
  - `/preferences` (Configuración de tema claro/oscuro y densidad)
  - `/ayuda` (Guía del agente y referencias de operación)

---

## 2. Resultados de la Auditoría

- **Violaciones detectadas inicialmente:** 3 tipos (`color-contrast`, `nested-interactive`, `select-name`).
- **Violaciones tras la remediación:** **0 violaciones** (100% compliant en las 8 vistas evaluadas).
- **Tests automatizados en CI:** 8 tests E2E dedicados en `tests/e2e/a11y.spec.ts` que validan `expect(results.violations).toEqual([])` en cada build.

---

## 3. Resumen de Fixes Aplicados

### A. Contraste de Color (WCAG 1.4.3 ≥ 4.5:1)
- **Token `--muted-foreground`:** Ajustado en `index.css` a `oklch(0.50 0 0)` para garantizar un ratio de contraste superior a 5.2:1 sobre fondos blancos y superficies sutiles (`#f5f7ff`).
- **Encabezados de sección en Sidebar (`AppSidebar.tsx`):** Eliminada la transparencia `/70` en los títulos de sección "Principal" y "Ajustes", elevando el contraste de 2.71:1 a >5.0:1.

### B. Elementos Interactivos Anidados (WCAG 4.1.2)
- **Tarjetas Draggable en Kanban (`TicketCard.tsx`):** Al extender los atributos de `@dnd-kit/core`, se asignó explícitamente `role="article"` y `aria-roledescription="draggable"`. Esto evita la anidación prohibida de enlaces (`<a>`) y botones (`<button>`) dentro de un elemento con `role="button"`.

### C. Nombres Accesibles y Formularios (WCAG 4.1.2 / 1.3.1)
- **Selector de grupos (`GroupQueuePage.tsx`):** Añadido `aria-label="Seleccionar grupo de soporte"` al elemento `<Select>`.
- **Buscador móvil (`TicketFiltersBar.tsx`):** Añadido `aria-label="Buscar tickets por título o ID"` al `<Input>`.
- **Estados de confirmación (`PreferencesPage.tsx`):** Añadido `role="status"` al mensaje de guardado exitoso.

### D. Focus Visible y Teclado (WCAG 2.4.7 / 2.1.1)
- **Anillo de foco consistente:** Configurado `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` en botones, enlaces de la barra lateral (`AppSidebar`), pestañas móviles (`BottomTabBar`), tarjetas de tickets (`TicketListCard`, `TicketCard`) y campos de formulario.
- **Focus Trap en Modales y Sheets:**
  - `Dialog.tsx`: Atrapa el foco dentro del diálogo al navegar con `Tab` / `Shift+Tab`, auto-enfoca el primer elemento interactivo y se cierra con `Escape`.
  - `TicketFiltersSheet.tsx`: Atrapa el foco dentro del bottom sheet móvil al pulsar `Tab` y se cierra con `Escape`.

### E. Mecanismo para Saltar Bloques / Skip Link (WCAG 2.4.1)
- Añadido enlace accesible al inicio de `AppLayout.tsx`:
  `<a href="#main-content" className="sr-only focus:not-sr-only ...">Saltar al contenido</a>`
- Asociado con `<main id="main-content" tabIndex={-1}>`.

### F. Movimiento Reducido (WCAG 2.3.3)
- Todas las animaciones respetan `prefers-reduced-motion: reduce`:
  - Hook `useReducedMotion()` de `motion/react` conmuta transiciones a `duration: 0`.
  - La animación `.shimmer-effect` de skeletons se desactiva mediante `@media (prefers-reduced-motion: reduce)`.

---

## 4. Verificación Multi-Viewport

Se capturaron y validaron 24 capturas de pantalla organizadas en `docs/09-visual-docs/screenshots/viewports/`:

| Viewport | Dispositivo de referencia | Comportamiento |
|---|---|---|
| **375×667** | iPhone SE / Móvil compacto | Bottom tabs activas, Sidebar oculta, cards verticales, sheet táctil |
| **768×1024** | iPad Portrait / Tablet | Sidebar visible (`md:flex`), Bottom tabs ocultas, sin desbordamiento horizontal (768px/768px) |
| **1280×720** | Desktop Standard | Layout completo con 5 columnas en Kanban, tablas TanStack y sidebar |
