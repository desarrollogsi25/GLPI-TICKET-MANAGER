# Registro de Incidencias y Acciones Correctivas (Non-Conformity Log)

> **Control Documental ISO 9001:2015 / Cláusula 10.2 (No Conformidad y Acción Correctiva)**  
> **Código:** DOC-QA-REG-002 | **Versión:** 2.0.0 | **Fecha:** 2026-11-05 | **Responsable:** QA & Release Manager

---

## 1. Registro de No Conformidades y Soluciones Técnicas

| ID Incidencia | Severidad | Descripción del Hallazgo | Causa Raíz Identificada | Acción Correctiva / Preventiva | Estado |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **INC-H55-01** | Media | Latencia percibida al pulsar "Asignarme" en la cola de grupo. | La mutación optimista solo actualizaba tickets existentes en la misma consulta pero no movía el ticket entre la cola de grupo y la cola personal del usuario de forma inmediata. | Reescritura de `onMutate` en `useClaimTicketMutation`: remueve optimísticamente el elemento de `['tickets', 'group-queue']` y lo antepone a `['tickets', 'byAssignee', userId]`. | **Cerrada 🟢** |
| **INC-H55-02** | Baja | Notificaciones Push y SignalR sin contexto del grupo de origen. | El backend en `NotificationDispatcherService` enviaba un payload genérico sin consultar el nombre del grupo técnico asociado en GLPI. | Adición de `ResolveGroupNameAsync` en backend para adjuntar `groupName` al payload SignalR y Push, y adición de acción `"Ir al grupo"` en el Toast. | **Cerrada 🟢** |
| **INC-H55-03** | Baja | Objetivos táctiles menores a 44x44px en botones móviles auxiliares. | Clases CSS `h-8` y `h-9` en botones del encabezado móvil y botón de autoasignación de cola. | Incorporación de la clase `min-h-[44px] min-w-[44px]` en todos los botones interactivos de la vista móvil. | **Cerrada 🟢** |
| **INC-H55-04** | Baja | Re-renders no deseados de tarjetas Kanban al asignar un ticket. | El comparador `React.memo` de `TicketCard.tsx` no evaluaba `assigneeIds`, impidiendo memoizar eficientemente tarjetas no afectadas. | Actualización del comparador para incluir la verificación tipada de `assigneeIds`. | **Cerrada 🟢** |
| **INC-QA-20261105-01** | Media | Clic interceptado al seleccionar la categoría en el formulario nativo de GLPI. | GLPI 11 sustituye el `<select>` nativo por un widget Select2 durante la hidratación; el clic sobre el elemento nativo competía con ese reemplazo. | Helper `selectNativeCategory` en `frontend/tests/e2e/support/glpi-form.ts` que espera al widget, selecciona la opción por texto visible y exige que el título deje de ser `-----`. | **Cerrada 🟢** |
| **INC-QA-20261105-02** | Media | Timeline de ticket desactualizado tras planificar o reprogramar una tarea técnica. | La consulta de tareas podía estar en vuelo con datos leídos antes del commit de la mutación; al invalidar sin cancelar, TanStack Query dejaba la respuesta previa en caché. | `invalidateTicketCaches` en `frontend/src/hooks/useTickets.ts:97` invalida `queryKeys.tickets.tasks(ticketId)` con `cancelRefetch: true` antes de refrescar `tickets.all`. | **Cerrada 🟢** |
| **INC-QA-20261105-03** | Baja | Selectores de columna Kanban ambiguos entre escritorio y móvil en las pruebas automatizadas. | El selector por texto (`text=Asignado`) coincidía también con las pestañas segmentadas móviles ocultas. | Columna Kanban expone `data-column-id` (`frontend/src/features/tickets/Kanban.tsx:203`); las pruebas seleccionan por ese atributo. | **Cerrada 🟢** |
| **INC-QA-20261105-04** | Media | HTTP 409 de GLPI al planificar tareas consecutivas del mismo técnico en E2E. | GLPI rechaza solapamientos de calendario para un mismo técnico; varias pruebas usaban el mismo bloque «ahora + 15 min». | `confirmPlanning` en `frontend/tests/e2e/support/planning.ts:13` reserva un bloque aleatorio de 2 h dentro de las 800 h siguientes; el backend mantiene la comprobación de conflicto de calendario antes de escribir. | **Cerrada 🟢** |
| **INC-QA-20261105-05** | Baja | `git push` fallaba con `could not read Username for 'https://github.com'`. | El shim de Git basado en contenedor no tenía acceso al helper de credenciales de Windows. | Se usó el binario Git nativo de Windows con la autenticación de GitHub CLI. Incidencia de entorno, no del producto. | **Cerrada 🟢** |
| **INC-QA-20261105-06** | Media | Toast «Error de red — No se pudo conectar al servidor» al navegar entre vistas con consultas en vuelo. | React Query aborta consultas al desmontar el componente; axios las rechaza con `ERR_CANCELED` y sin `response`, y el interceptor de `apiClient` las clasificaba como caída de red. | Predicado `isNetworkFailure` en `frontend/src/lib/api/network-error.ts`, usado por `apiClient.ts`, que excluye cancelaciones; regresión en `frontend/tests/unit/network-error.test.mjs` y reproducción en navegador contra el servidor de desarrollo. | **Cerrada 🟢** |

---

## 2. Validación de Cierre

Validación del 2026-11-05 (agente automatizado, sin QA manual humano):

- Backend Release sin warnings; 51 pruebas de aplicación y 217 de integración PASS.
- Frontend: typecheck 0, 14 pruebas unitarias PASS y build de producción correcto.
- QA exploratorio `frontend/tests/qa/exploratory-roles.mjs`: 142/142 comprobaciones PASS en 8 cuentas × 2 viewports (1440×900 y 390×844), incluida la regresión del toast falso de red.
- Ticket #1026 verificado en GLPI persistente como Cerrado (estado 6) con dos `TicketTask` reales; ticket #1027 creado desde el catálogo nativo y enrutado al grupo Service Desk.
- Suite E2E H-20: ejecución local BLOCKED por falta de memoria del host; validada en CI run [42083334351](https://github.com/desarrollogsi25/GLPI-TICKET-MANAGER/actions/runs/42083334351) sobre el commit `2b1bd98`: 45/45 PASS en 3,6 min, con los cuatro jobs en verde.
