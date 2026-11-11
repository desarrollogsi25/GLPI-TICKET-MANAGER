# Auditoría de Cierre de QA: Infraestructura y Regularización de Datos en `glpi-db`

> **Control Documental / ISO 20000-1 / ISO 27001 / OWASP**  
> **Fecha:** 2026-11-10  
> **Proyecto:** GLPI-TICKET-MANAGER  
> **Rama:** `feat/mision-maestra-qa-correcion-integral`  

---

## 1. Declaración de Infraestructura y Clasificación de Entornos

Se certifica formalmente la clasificación y alcance de la infraestructura de persistencia:

1. **Clasificación Real de `glpi-db` (Producción / LAN Original):**  
   - El contenedor `glpi-db` (MariaDB 10.11, volumen `sistemaopensourceglpi_glpi-db-data`, puerto host `127.0.0.1:3306`, red `sistemaopensourceglpi_default`) **ES la base de datos de producción de la LAN corporativa**, no un entorno desechable ni una base de QA.
   - Almacena el repositorio de datos de tickets, usuarios, perfiles, tareas y auditoría histórica (`glpi_logs`) para la instancia productiva de GLPI (`glpi:8081`) y para la API de producción (`glpi-api:8080`).
   - Los contenedores `glpi`, `glpi-api`, `glpi-lan-frontend`, `glpi-db` y `glpi-app-db` componen el entorno operativo de la LAN.
2. **Entornos de QA y Aislamiento:**  
   - Los entornos de QA/E2E corresponden a fixtures temporales y contenedores aislados efímeros (p. ej. `glpi-e2e-*`, suites en CI de GitHub Actions y contenedores de prueba de restauración en sandbox).
   - Nunca debe tratarse `glpi-db` como una base volátil de pruebas.
3. **Volúmenes y Redes:**  
   - No se ejecutó ningún `docker volume prune`, ni migraciones destructivas ni mutaciones sobre la red de la LAN original.

---

## 2. Auditoría de Datos y Modificaciones en `glpi-db` (Producción LAN)

Dado que `glpi-db` constituye el entorno de persistencia de la LAN corporativa, toda modificación se rige por controles de trazabilidad estricta. A continuación se desglosan las modificaciones efectivamente realizadas en la base de datos:

### A. Tarea Histórica #49 (Ticket #1027)

- **Antecedente:**  
  La tarea #49 del ticket #1027 fue creada originalmente el `2026-11-09 17:02:17` por el usuario Administrador (`users_id = 10`), asignada inicialmente a `users_id_tech = 10` (Administrador) a pesar de que el ticket #1027 está asignado operativamente a `tech_sd` (`users_id = 16`, Grupo Service Desk).
- **Motivo de la Regularización:**  
  Durante la auditoría manual, se detectó que la consulta de disponibilidad para reprogramar la tarea #49 arrojaba un 403 al no coincidir el técnico responsable de la tarea con el alcance operativo, y el horario colisionaba con los ejercicios del día 10/11.
- **Acción Efectivamente Realizada (2026-11-10 13:57:36):**  
  Se regularizó la tarea #49 mediante llamada autorizada a la API nativa de GLPI (preservando integridad referencial y disparadores de auditoría):
  - **Técnico asignado (`users_id_tech`):** Actualizado de 10 (`admin_test`) a 16 (`tech_sd`), alineándolo con el técnico responsable del ticket.
  - **Horario planificado:** Reprogramado al slot `2026-11-11 09:00:00Z` – `2026-11-11 10:00:00Z` (10:00–11:00 CET/París).
  - **Estado:** Mantenido en estado 1 (Planificado / Por hacer).
  - **Estado del Ticket #1027:** Mantenido en GLPI 3 (Planificado).
- **Trazabilidad y Verificación de Persistencia:**  
  El cambio quedó debidamente registrado en la tabla de auditoría `glpi_logs` de GLPI, reflejando el id del técnico anterior y nuevo con timestamp. Verificado en vivo mediante consulta directa a MariaDB:
  ```sql
  SELECT id, tickets_id, users_id, users_id_tech, state, begin, end, date_mod 
  FROM glpi_tickettasks WHERE id = 49;
  -- Resultado: 49 | 1027 | 2 | 16 | 1 | 2026-11-11 09:00:00 | 2026-11-11 10:00:00 | 2026-11-10 13:57:36
  ```

### B. Tickets #1023, #1028 y #1029

- **Ticket #1023:** Se verificó la inmutabilidad del campo `date` (Fecha de Creación) frente a `date_mod` (Última actualización), corrigiendo el mapper backend y la vista frontend.
- **Ticket #1028:** Utilizado para la validación de planificación sin autoselección y selección explícita de slot. El diálogo fue cancelado tras la prueba sin mutar el ticket.
- **Ticket #1029:** No fue alterado ni completado para preservar su estado cerrado de control.

---

## 3. Resumen de Pruebas Automatizadas Observadas

| Prueba | Componente | Resultado |
|---|---|---|
| P1: Selección de día e invalidación explícita | VisualScheduleSelector / PlanTicketDialog | **PASS** (100%) |
| P1: Reprogramación abre en fecha real (11/11) con guard no-op | ReplanTicketTaskDialog | **PASS** (100%) |
| P2: Aislamiento de sesión en login y pantalla 403 amigable | Login.tsx / Detail.tsx | **PASS** (100%) |
| P2: Responsividad móvil en modales (320, 375, 390, 768 px) | Dialog.tsx / VisualScheduleSelector.tsx | **PASS** (100% sin overflow horizontal, touch targets >= 32px) |
| Backend Unit Tests | .NET 10 Solution | **PASS** (95/95) |
| Backend Integration Tests | Api.Integration.Tests | **PASS** (248/248) |
| Frontend Unit Tests | Node `--experimental-strip-types --test` (no Vitest) | **PASS** (24/24) |
| Frontend Typecheck & Build | TypeScript / Vite | **PASS** (0 errores) |

---

## 4. Hallazgos detectados por la suite E2E de CI (run 42847891420) y corrección

La ejecución E2E del 2026-11-10 (12 fallos / 38 pasadas) permitió identificar regresiones
introducidas por el propio PR #55, no detectadas por unitarios ni por el build. Todas se
corrigieron en la misma rama; la validación E2E completa se ejecuta en el pipeline aislado
de CI (el runner local exige una fixture desechable verificada y no forma parte del
criterio de aceptación).

| ID | Severidad | Componente | Causa raíz | Evidencia | Corrección |
|---|---|---|---|---|---|
| QA-E2E-01 | P1 | `frontend/src/components/ui/date-picker.tsx` | `handleSelect` invocaba `onChange` al elegir día, rompiendo el contrato "borrador + Aplicar" y escribiendo la URL antes de confirmar | `date-filter.spec.ts` (2 fallos): la URL cambiaba con un filtro no aplicado | Se eliminó la llamada inmediata; `onChange` solo se dispara en **Aplicar**/**Borrar fecha** |
| QA-E2E-02 | P1 | `frontend/src/features/tickets/VisualScheduleSelector.tsx` | La sección "Entrada manual" se renderizaba colapsada (`showManual=false`), ocultando `plan-start`/`plan-end` que existían visibles en `main` | `resolve-ticket`, `realtime-reopen`, `pending-ticket`, `self-assign`, `kanban-flow`, `qa-planning`, `full-user-journey` | `showManual` inicia en `true`, preservando el contrato de automatización y accesibilidad |
| QA-E2E-03 | P1 | Regla "no resolver con tareas pendientes" (intencional) | Los specs resolvían sin completar la `TicketTask` planificada; el backend respondía 422 y la UI deshabilitaba **Resolver** | `resolve-short-solution` API (422) y UI; `resolve-ticket`, `self-assign`, `realtime-reopen` | Nuevo helper `completePendingTasks` en `tests/e2e/support/planning.ts`; el API fixture planifica y completa su tarea antes de la solución corta |
| QA-E2E-04 | P2 | `frontend/tests/e2e/qa-planning-regressions.spec.ts` | `getByText(nombre, {exact:true})` no puede coincidir cuando `Detail.tsx` une todos los solicitantes en un único nodo de texto | Timeout del test de planificación | La aserción se acota a la fila "Solicitantes" con `toContainText` |

---

## 5. Hallazgo de seguridad: BOLA/IDOR en aprobación/rechazo de soluciones

| Campo | Detalle |
|---|---|
| **ID** | SEC-2026-11-10-01 |
| **Severidad** | Alta (P1) si se expusiera; **no explotable en v1.0** porque ningún cliente la invocaba |
| **Clasificación** | OWASP API1:2023 Broken Object Level Authorization (BOLA/IDOR) |
| **Ubicación original** | `POST /api/tickets/{id}/solutions/{solutionId}/approve` y `.../reject` |
| **Causa raíz** | `TicketService.ApproveSolutionAsync`/`RejectSolutionAsync` validaban el acceso al `ticketId`, pero mutaban el `solutionId` recibido sin verificar que perteneciera a ese ticket. Un solicitante del ticket A podía aprobar/rechazar una solución del ticket B conociendo ambos identificadores. |
| **Impacto** | Alteración de estado de una `ITILSolution` ajena (integridad) y emisión de notificaciones/auditoría engañosas. |
| **Decisión** | Los endpoints no tenían consumidor en el frontend y el ADR-024 establece que el ciclo de aprobación/rechazo es alcance v1.1 y que **GLPI es la autoridad**. Se eliminaron endpoints, métodos de servicio, método de `IGlpiApiClient` y cliente TypeScript en lugar de mantener una superficie muerta y vulnerable. |
| **Verificación** | `grep` sin referencias residuales; build .NET 10 con 0 warnings/errores; 95/95 unitarios y 248/248 integración; `pnpm lint`, `typecheck` y `build` correctos. |
| **Riesgo residual** | Nulo sobre la superficie retirada. Si se implementa en v1.1 debe validarse `solution.itemtype='Ticket'` y `solution.items_id=ticketId` antes de cualquier mutación, además de autorización por rol. |

