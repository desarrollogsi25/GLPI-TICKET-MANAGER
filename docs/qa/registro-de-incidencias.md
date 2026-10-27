# Registro de Incidencias y Acciones Correctivas (Non-Conformity Log)

> **Control Documental ISO 9001:2015 / Cláusula 10.2 (No Conformidad y Acción Correctiva)**  
> **Código:** DOC-QA-REG-002 | **Versión:** 1.0.0 | **Fecha:** 2026-10-27 | **Responsable:** QA & Release Manager

---

## 1. Registro de No Conformidades y Soluciones Técnicas

| ID Incidencia | Severidad | Descripción del Hallazgo | Causa Raíz Identificada | Acción Correctiva / Preventiva | Estado |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **INC-H55-01** | Media | Latencia percibida al pulsar "Asignarme" en la cola de grupo. | La mutación optimista solo actualizaba tickets existentes en la misma consulta pero no movía el ticket entre la cola de grupo y la cola personal del usuario de forma inmediata. | Reescritura de `onMutate` en `useClaimTicketMutation`: remueve optimísticamente el elemento de `['tickets', 'group-queue']` y lo antepone a `['tickets', 'byAssignee', userId]`. | **Cerrada 🟢** |
| **INC-H55-02** | Baja | Notificaciones Push y SignalR sin contexto del grupo de origen. | El backend en `NotificationDispatcherService` enviaba un payload genérico sin consultar el nombre del grupo técnico asociado en GLPI. | Adición de `ResolveGroupNameAsync` en backend para adjuntar `groupName` al payload SignalR y Push, y adición de acción `"Ir al grupo"` en el Toast. | **Cerrada 🟢** |
| **INC-H55-03** | Baja | Objetivos táctiles menores a 44x44px en botones móviles auxiliares. | Clases CSS `h-8` y `h-9` en botones del encabezado móvil y botón de autoasignación de cola. | Incorporación de la clase `min-h-[44px] min-w-[44px]` en todos los botones interactivos de la vista móvil. | **Cerrada 🟢** |
| **INC-H55-04** | Baja | Re-renders no deseados de tarjetas Kanban al asignar un ticket. | El comparador `React.memo` de `TicketCard.tsx` no evaluaba `assigneeIds`, impidiendo memoizar eficientemente tarjetas no afectadas. | Actualización del comparador para incluir la verificación tipada de `assigneeIds`. | **Cerrada 🟢** |

---

## 2. Validación de Cierre

Todas las acciones correctivas fueron verificadas contra la batería de pruebas de regresión automatizada (40/40 Playwright) y pruebas manuales interactivas, confirmando cero regresiones de lógica de negocio o fallos en consola.
