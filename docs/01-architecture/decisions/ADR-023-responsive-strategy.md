# ADR-023 — Estrategia de Diseño Adaptable Multi-Dispositivo (Mobile-First, Liquid Glass y Latencia Cero)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-023 | **Versión:** 1.0.0 | **Fecha:** 2026-10-27 | **Autor:** GLPI Ticket Manager Team / Tech Lead H-55

---

## 1. Estado
**Accepted** — Vigente a partir de la misión H-55.

---

## 2. Contexto y Problema

El ecosistema GLPI Ticket Manager es utilizado por técnicos de campo, coordinadores y supervisores en una amplia variedad de factores de forma:
1. **Dispositivos Móviles (Smartphones ~390px):** Técnicos en tránsito resolviendo incidencias in-situ. Requieren objetivos táctiles precisos (tap targets mínimos de 44x44px), ergonomía con una sola mano, cero scroll horizontal indeseado y navegación segmentada.
2. **Tablets (iPads / Pantallas intermedias 768px - 1024px):** Supervisores en reuniones de guardia revisando métricas de equipo y colas operativas.
3. **Escritorios de Alta Resolución (Desktop 1440px+):** Operadores de Service Desk y centros de operaciones (NOC) gestionando flujo paralelo de tickets.

Asimismo, la percepción de velocidad en operaciones críticas (como asignarse un ticket de la cola) requería eliminar la latencia entre la acción del usuario y el reflejo visual inmediato en el tablero Kanban.

---

## 3. Decisiones de Arquitectura

### 3.1 Arquitectura Responsive Híbrida (Segmented Tabs en Móvil vs. 5 Columnas en Desktop)

Para resolver el dilema de densidad de información sin comprometer la legibilidad ni forzar scroll horizontal complejo:
- **Dispositivos Móviles (`< md`, < 768px):**
  - El Kanban conmuta automáticamente a una vista de columna única con pestañas segmentadas (`KanbanSegmentedTabs`) que permiten deslizarse rápidamente entre estados (*Cola*, *Mis tickets*, *En progreso*, *Pendiente*, *Resuelto*).
  - La navegación principal colapsa en un Drawer lateral (`MobileDrawer`) y una barra de acceso rápido inferior (`BottomTabBar`).
  - Los encabezados colapsan utilidades auxiliares mientras mantienen la campana de notificaciones (`NotificationBell`) siempre accesible y visible.
- **Dispositivos de Escritorio (`>= md`, >= 768px / 1440px):**
  - Disposición completa en rejilla paralela de 5 columnas (`grid-cols-5`) con scroll vertical independiente (`no-scrollbar`) y capacidades Drag & Drop completas con `@dnd-kit`.

### 3.2 Cumplimiento de Tap Targets (WCAG 2.5.5 / Apple HIG)

Todos los elementos interactivos primarios en interfaces móviles se configuran con un tamaño mínimo de área de pulsación de **44x44px**:
- Botones de acción contextual en tarjetas Kanban (`Asignarme`, `Empezar`, `Pausar`, `Resolver`): `min-h-[44px] min-w-[44px]`.
- Botones de encabezado móvil (Hamburguesa, Búsqueda, Cambio de tema, Notificaciones, Logout): `min-h-[44px] min-w-[44px]`.
- Botón de auto-asignación en la vista de cola de grupo (`GroupQueueCard`): `min-h-[44px] min-w-[105px]`.

### 3.3 Asignación Optimista Multi-Caché (Latencia Percibida 0ms)

En la mutación `useClaimTicketMutation`:
1. Se cancelan consultas concurrentes activas: `queryClient.cancelQueries({ queryKey: ['tickets'] })`.
2. Se captura una instantánea de retroceso para rollback en caso de fallo de red.
3. Se remueve atómicamente el ticket de la cola de grupo (`['tickets', 'group-queue']`).
4. Se antepone inmediatamente el ticket actualizado con `status: 2` (Asignado) y `assigneeIds: [userId]` a la lista de tickets del técnico (`['tickets', 'byAssignee', userId]`).
5. Se memoizan las tarjetas `TicketCard` comparando `assigneeIds` de manera que el resto de las tarjetas del tablero no experimenten re-renders redundantes.

### 3.4 Enriquecimiento Contextual de Notificaciones (SignalR y Web Push)

Cada notificación de creación de ticket (`TicketCreated`) emitida por el backend incluye:
- `ticketId`: Identificador del ticket.
- `groupId`: Identificador numérico del grupo técnico responsable.
- `groupName`: Nombre descriptivo resuelto de la base de datos (e.g., *Service Desk*, *Infraestructura*).
- Mensaje claro con llamada a la acción: Botón `"Ir al grupo"` que enruta a `/kanban?groupId={id}` sin alterar de forma forzada la vista del usuario a menos que este interactúe voluntariamente.

---

## 4. Consecuencias y Verificación

- **Rendimiento:** Latencia de asignación reducida a 0ms percibidos.
- **Usabilidad:** Experiencia táctil sin errores de pulsación accidental ni desbordamiento horizontal en viewports de 390px.
- **Trazabilidad:** Verificado mediante pruebas automatizadas Playwright (40/40 en verde) y suite de pruebas manuales E2E `h55-verification.mjs`.
