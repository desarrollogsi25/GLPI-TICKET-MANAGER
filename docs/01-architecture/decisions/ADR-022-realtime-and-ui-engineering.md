# ADR-022 — Sincronización en Tiempo Real (SignalR + React Query) y Principios de Ingeniería UI (Emil Kowalski)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-022 | **Versión:** 1.0.0 | **Fecha:** 2026-10-26 | **Autor:** GLPI Ticket Manager Team / Release Management

---

## 1. Estado
**Accepted** — Vigente a partir de H-42 y H-43.

---

## 2. Contexto y Problema

El sistema de gestión de tickets sobre GLPI 11 opera en un entorno altamente concurrente donde múltiples técnicos, supervisores de área y solicitantes interactúan simultáneamente sobre la misma cola de incidentes y requerimientos.

Los dos principales desafíos arquitectónicos y de experiencia de usuario identificados fueron:

1. **Sincronización de Estado Reactivo vs. Presupuesto de Red:**
   - Evitar el polling incondicional hacia endpoints costosos (como `/api/tickets/by-group` bajo rate limiting `Expensive` de 20 req/min).
   - Mantener el tablero Kanban, la cola del grupo y los contadores del dashboard sincronizados al instante en cuanto cualquier técnico o GLPI modifique un ticket.

2. **Calidad Visual e Interacción Premium (UI Engineering):**
   - Superar los estándares de prototipos simples (MVP) implementando una interfaz de consola SaaS moderna.
   - Garantizar animaciones fluidas, respetuosas de la accesibilidad y con latencia imperceptible, siguiendo los principios de diseño de **Emil Kowalski**.

---

## 3. Decisiones de Arquitectura

### 3.1 Patrón Híbrido: SignalR Hub + TanStack React Query

Se establece el patrón **SignalR Event-Driven Cache Invalidation**:

```text
[GLPI Event / Mutación API] 
       │
       ▼
[SignalR Hub (/hubs/tickets)] ──── WebSocket Broadcast ────► [Hook useRealtimeTicketHub]
                                                                     │
                                                      QueryClient.invalidateQueries(...)
                                                                     │
                                                                     ▼
                                                      [TanStack Query (Re-fetch selectivo)]
                                                                     │
                                                                     ▼
                                                      [Actualización instantánea UI]
```

1. **SignalR como Canal Primario:**
   - El cliente se conecta a `/hubs/tickets` al autenticarse.
   - Los eventos de dominio (`TicketCreated`, `TicketClaimed`, `TicketStatusChanged`, `SolutionAdded`) se transmiten a través de WebSockets en tiempo real.
   - El cliente reacciona invalidando de manera precisa las claves de caché afectadas:
     * `queryKeys.tickets.byGroupQueue(groupId)`
     * `queryKeys.tickets.all`
     * `queryKeys.tickets.detail(ticketId)`
     * `['notifications', 'unread-count']`

2. **Cero Polling con Conexión Activa:**
   - Mientras `connectionState === 'connected'`, los hooks de consulta desactivan el `refetchInterval` (`refetchInterval: false`).
   - Si la conexión se pierde, entra en vigor un fallback conservador de polling cada **30 segundos**, manteniéndose muy por debajo del límite de rate limiting.

3. **Reconexión Idempotente:**
   - Tras el evento `onreconnected`, el cliente re-suscribe al técnico a su grupo asignado (`SubscribeToGroup`) y fuerza una invalidación general para subsanar cualquier evento emitido durante la desconexión.

---

### 3.2 Principios de Ingeniería UI de Emil Kowalski

Para el rediseño y pulido de la interfaz (H-42 / H-43), se codifican e implementan formalmente las siguientes directrices:

#### A. Micro-Animaciones con Propósito y Física Natural
- **Herramienta:** `motion/react` (Motion 14).
- **Duraciones cortas (< 200 ms):** Las aperturas de modales, paneles flotantes y menús usan transiciones rápidas (`duration: 0.16s - 0.20s`) con curvas cúbicas tipo spring (`cubic-bezier(0.23, 1, 0.32, 1)` o resortes `stiffness: 380, damping: 32`).
- **Respeto a Preferencias del Usuario (`prefers-reduced-motion`):**
  Todos los componentes interactivos verifican `useReducedMotion()`. Si el usuario solicita reducción de movimiento, las animaciones se degradan instantáneamente a cambios de opacidad o transiciones con `duration: 0`.

#### B. Sistema de Notificaciones Toasts con Sonner
- **Librería Central:** `sonner` en esquina superior derecha (`position="top-right"`).
- **Diseño No Intrusivo:** Toasts con bordes limpios, iconos vectoriales de Lucide y soporte completo de temas claro/oscuro.
- **Acciones Rápidas:** Soporte para cerrar al vuelo, pausar al pasar el puntero y botones de acción (ej. revertir o ver detalle).

#### C. Command Palette Global (`cmdk`)
- Activación global por teclado mediante `Ctrl + K` (o `Cmd + K` en macOS).
- Permite salto rápido a módulos (Kanban, Tickets, Cola, Servicios, Dashboard, Ayuda), cambio instantáneo de tema claro/oscuro y búsqueda rápida sin tocar el ratón.

#### D. Diseño Responsivo Móvil con Cero Desbordamiento
- Viewport móvil validado estrictamente a `375px` y `390px`.
- Regla: `scrollWidth <= innerWidth` obligatorio en todas las pantallas.
- Reemplazo de tablas densas en móvil por tarjetas apiladas con áreas de toque táctil de al menos 44×44 px.
- Menú lateral colapsable transformado en Bottom Sheet / Drawer deslizante en pantallas pequeñas.

#### E. Accesibilidad Visual y Contraste WCAG 2.1 Nivel AA
- Todas las combinaciones de color texto/fondo garantizan un ratio de contraste &ge; 4.5:1 en texto estándar y &ge; 3.0:1 en texto grande/componentes.
- Badges de alerta y notificación utilizan rojos con luminancia controlada (`bg-red-600` / `oklch(0.48 0.22 27)`) para asegurar legibilidad con texto blanco.
- Indicadores de foco visibles (`focus-visible:ring-2`) en todos los botones y campos interactivos.

---

## 4. Consecuencias y Verificación

- **Positivas:**
  * El usuario experimenta una aplicación viva y reactiva sin demoras de actualización.
  * Se elimina el riesgo de errores 429 por exceso de peticiones.
  * La interfaz posee un acabado premium, rápido y coherente con estándares internacionales de diseño.
- **Verificación Automatizada:**
  * `frontend/tests/e2e/kanban-polling.spec.ts`: Garantiza 0 polling mientras SignalR esté conectado.
  * `frontend/tests/e2e/a11y.spec.ts`: Audita las 8 vistas con Axe Core verificando 0 violaciones WCAG 2.1 AA.
  * `frontend/tests/qa/h42-verification.mjs`: Valida los 19 criterios específicos de UI/UX, animaciones y Command Palette.
