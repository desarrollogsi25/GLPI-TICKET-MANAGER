# Flujo Operativo del Tablero Kanban

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-03-FLOW-KANBAN | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Propósito

Describe la interacción operativa del técnico y supervisor con el tablero Kanban en resoluciones de escritorio y dispositivos móviles, incluyendo gestos, animaciones y sincronización en tiempo real.

## 2. Experiencia de Escritorio (Desktop ≥ 768px)

- **Distribución:** 5 columnas en paralelo (`Cola del grupo`, `Mis tickets`, `En progreso`, `Pendiente`, `Resuelto`).
- **Drag & Drop:** Implementado con `@dnd-kit/core`.
  - El usuario arrastra tarjetas de una columna a otra siguiendo las transiciones válidas.
  - Al soltar en una columna no permitida, la tarjeta ejecuta una vibración elástica (*shake* `[0, -4, 4, -4, 4, 0]`, 300ms) y regresa a su origen.
- **Continuidad visual:** Al cambiar de columna, la tarjeta física se desliza mediante animación spring (`motion/react`, `layout`, 250ms).

## 3. Experiencia Móvil (Mobile < 768px)

- **Segmented Tabs:** Barra de pestañas horizontal táctil con targets de 44px (`min-h-[44px]`).
- **Navegación:**
  - Selección de tab por tap directo o gesto de arrastre horizontal (*swipe*) entre vistas contiguas.
  - Transición fluida con resorte (`x: -20 / +20` + `opacity`) con `AnimatePresence mode="wait"`.
- **Acciones Táctiles Contextuales:**
  - Cola: Botón `[Asignarme]` con spinner interactivo de carga y salida animada (`scale: 0.9` + `opacity: 0`).
  - Mis tickets: Botón `[Empezar]`.
  - En progreso: Botón `[Resolver]` (abre modal de solución mandatoria).
  - Pendiente: Botón `[Retomar]`.

## 4. Orden de las Tarjetas

- **Columnas activas** (`Cola del grupo`, `Mis tickets`, `En progreso`, `Pendiente`): orden **FIFO** (ascendente) por fecha de última actualización (o de creación si no hubiera actualización). El ticket más antiguo se muestra arriba.
- **Columna `Resuelto`** (agrupa los estados Resuelto 5 y Cerrado 6): orden **LIFO** (descendente), el cambio más reciente arriba.
- **La prioridad no participa en el ordenamiento.** Se conserva únicamente como indicador visual (color de la insignia). Los tickets con prioridad alta y baja se intercalan según su fecha.

## 5. Reglas de Transición de Estado

- El técnico asignado no puede devolver un ticket `Asignado` (2) o `En progreso` (3) al estado `Nuevo` (1).
- `Pendiente` (4) puede avanzar a `En progreso` (2) o resolverse directamente (5).
- Resolver un ticket requiere una solución escrita (ADR-006).
- **Cierre automático:** al resolver un ticket (técnico o administrador), el ticket pasa inmediatamente a `Cerrado` (6) en la misma operación.
- `Resuelto` (5) y `Cerrado` (6) son estados terminales para el técnico: **solo un administrador** puede cambiarlos o reabrirlos. Al intentarlo, el backend responde 403 con el mensaje `Solo un administrador puede cambiar el estado de un ticket resuelto o cerrado.`, que la interfaz muestra en un *toast* de error.
- El cierre manual (`Cerrado` 6) sin resolver también queda restringido a administradores.

## 6. Sincronización en Tiempo Real

- Conexión persistente mediante SignalR (`/hubs/tickets`).
- Al registrarse un cambio por otro técnico (`TicketClaimed` o `TicketStatusChanged`):
  - Invalida la caché de TanStack Query.
  - La tarjeta se mueve automáticamente a su nueva columna con animación física de layout.
  - Se activa un anillo visual de acento violeta (`boxShadow: 0 0 0 2px rgb(109 89 232)`) durante 1.5 segundos.
