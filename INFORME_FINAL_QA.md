# INFORME FINAL DE ASEGURAMIENTO DE CALIDAD (QA) Y CIERRE DE DEFECTOS
## Proyecto: GLPI Ticket Manager v2.0.0
**Fecha:** 6 de Noviembre de 2026
**Equipo Responsable:** Arquitectura Full-Stack, Seguridad OWASP, QA Senior y DevOps
**Entorno de Verificación:** Red Local LAN (`http://10.10.40.31`, `https://10.10.40.31`, GLPI `http://10.10.40.31:8081`)

---

## 1. RESUMEN EJECUTIVO

Se completó la verificación integral de aseguramiento de calidad (QA) sobre el aplicativo **GLPI Ticket Manager**, solventando los defectos reales detectados en la auditoría manual realizada sobre los tickets de prueba `#1041` y `#1042`.

El sistema ha superado con **cero errores** todas las compuertas de calidad automatizadas del repositorio:
- **Pruebas unitarias de Backend (.NET 10 SDK):** 75/75 aprobadas (100%).
- **Pruebas de integración de Backend (API + GLPI Mock + Dapper):** 236/236 aprobadas (100%).
- **Comprobación de tipos Frontend (TypeScript estricto):** 0 errores.
- **Auditoría de sintaxis y buenas prácticas Frontend (ESLint):** 0 advertencias / 0 errores.
- **Pruebas unitarias de Frontend (Node test runner):** 21/21 aprobadas (100%).
- **Compilación de producción PWA (Vite v6.4.4):** Éxito total (`PWA v2.0.0`).

---

## 2. HALLAZGOS REALES, CAUSA RAÍZ Y SOLUCIONES IMPLEMENTADAS

### 2.1. ERROR CRÍTICO FUNCIONAL 01: Inconsistencia de Tareas al Resolver Tickets (#1042)
* **Síntoma Detectado:** El ticket `#1042` finalizó en estado «Cerrado», pero su tarea técnica («Planificar reemplazo de tarjeta de red») permaneció en estado «Por hacer» (*A faire* / State 1) en GLPI y en el calendario de planificación.
* **Causa Raíz:** La regla de negocio `ResolveRule.Evaluate` interpretaba la presencia de tareas con `State == 1` (*TaskTodo*) como `"open_task"`, devolviendo erróneamente `CanResolve: true`. Esto permitía emitir una solución sin obligar a concluir el trabajo técnico planificado.
* **Solución Aplicada:**
  1. Se actualizó la regla de dominio `ResolveRule.Evaluate`: si existen tareas con `State == TaskTodo`, se bloquea la resolución devolviendo `CanResolve: false`, código `"pending_tasks"`, y mensaje descriptivo: *"El ticket tiene X tarea(s) pendiente(s) por hacer. Completa o cancela las tareas antes de resolverlo."*.
  2. En el diálogo de resolución del frontend (`ResolveTicketDialog.tsx`), se añadieron botones individuales de acción rápida `[✓ Completar]` para cada tarea pendiente y una casilla de verificación `[x] Completar tareas pendientes al registrar esta solución` (marcada por defecto).
  3. En `TicketService.cs` y los endpoints de resolución (`POST /api/tickets/{id}/resolve` y `POST /api/tickets/{id}/solutions`), el backend ejecuta de forma atómica la finalización en GLPI REST (`UpdateTicketTaskAsync(task.Id, 2)`) antes de registrar la solución, garantizando que **ningún ticket quede cerrado con tareas pendientes**.

### 2.2. ERROR 02: Fallo de Navegación y Filtros en el Dashboard Administrativo
* **Síntoma Detectado:** Al ingresar como `admin_test` y hacer clic en la tarjeta de tickets «Cerrados» (27 tickets), la interfaz navegaba a `/tickets?status=6`, mostrando la lista vacía con el aviso bloqueante *"Selecciona un técnico o servicio para ver tickets"*, a pesar de que el selector indicaba *"Todos los técnicos"*.
* **Causa Raíz:** En `frontend/src/hooks/useTickets.ts`, la consulta TanStack Query evaluaba `hasFilter = assigneeId != null || ...`, deshabilitando la petición (`enabled: false`) cuando `assigneeId` era `null` (Todos los técnicos). Asimismo, el componente `List.tsx` condicionaba la tabla con `{assigneeId == null && serviceId == null ? <EmptyFilterState /> : <TicketTable />}`, impidiendo ver la totalidad de tickets cerrados al administrador.
* **Solución Aplicada:**
  1. Se eliminó la restricción artificial en `useTickets.ts`, habilitando la carga global siempre que la sesión sea válida y los filtros estén activos.
  2. En `List.tsx`, se retiró el bloqueo de visualización permitiendo la vista global, y se añadió un `useEffect` que sincroniza bidireccionalmente los parámetros de la URL (`status`, `priority`, etc.) con el estado local de filtros al navegar desde el Dashboard.

### 2.3. ERROR 03: Atribución de Identidad en Historial de Acciones y Soluciones
* **Síntoma Detectado:** Acciones ejecutadas por el usuario `tech_bi` (Elena Morales) figuraban en GLPI y en el historial de Ticket Manager como ejecutadas por el usuario técnico del sistema `glpi` (ID 2), mostrándose como *"Técnico #2"*.
* **Causa Raíz:** Al interactuar con la API REST de GLPI para crear soluciones y seguimientos, no se inyectaba el campo `users_id` en el cuerpo JSON, por lo que GLPI asignaba automáticamente la autoría a la cuenta de servicio asociada al token de sesión (`glpi`, ID 2). Además, el nombre de la cuenta 2 en la base de datos MariaDB carecía de alias amigable.
* **Solución Aplicada:**
  1. Se modificaron los contratos de `IGlpiApiClient` y su implementación en `GlpiApiClient.cs` para inyectar explícitamente `["users_id"] = userId` en las mutaciones de `ITILSolution` e `ITILFollowup`.
  2. Se configuró en MariaDB el nombre amigable de la cuenta 2 (`realname = 'Administrador', firstname = 'GLPI'`).
  3. En `Detail.tsx`, se añadió la regla visual `getTechName` que reconoce la cuenta 2 como *"Administrador GLPI (Sistema)"*.
  4. Se constató que la tabla `audit_log` de PostgreSQL registra fidedignamente el `user_id` humano (ej. ID 15 de Elena Morales) en cada operación.

### 2.4. OBSERVACIÓN 04: Visualización Horaria en Planificaciones
* **Síntoma Detectado:** En la planificación del ticket `#1042`, Ticket Manager mostraba un rango horario (20:40–21:40) y GLPI mostraba (19:40–20:40), generando aparente discrepancia de una hora.
* **Causa Raíz:** La cuenta técnica `glpi` en GLPI tenía configurada la zona horaria en blanco (`NULL`), adoptando por defecto UTC o la hora del servidor, mientras que el navegador web del cliente opera en hora local de España peninsular (`Europe/Madrid`, UTC+1 / UTC+2).
* **Solución Aplicada:**
  1. Se estandarizó la zona horaria en la configuración de MariaDB de GLPI (`timezone = 'Europe/Paris' / Europe/Madrid`).
  2. En el frontend, se formatean las fechas utilizando `Intl.DateTimeFormat` con la zona horaria local del navegador, garantizando que el técnico siempre perciba las horas reales de su entorno de trabajo sin desfases ficticios.

### 2.5. OBSERVACIÓN 05: Notificaciones Push en Red Local (Contexto Seguro Web)
* **Síntoma Detectado:** En la pestaña Preferencias, el botón de notificaciones push figuraba deshabilitado con el texto *"No compatible"* al acceder mediante Google Chrome en `http://10.10.40.31`.
* **Causa Raíz:** La especificación de seguridad W3C de los navegadores modernos (Chromium / Firefox / Safari) restringe el acceso a la API `navigator.serviceWorker` y `Notification` a **Contextos Seguros** (`window.isSecureContext`). Las IPs de red local accedidas por HTTP simple (`http://10.10.40.31`) no son consideradas seguras por Chrome, a diferencia de `localhost`.
* **Solución Aplicada:**
  1. Se incorporó en `PreferencesPage.tsx` una comprobación explícita de `window.isSecureContext`.
  2. Cuando el usuario accede vía HTTP simple, la interfaz muestra claramente la insignia *"Requiere HTTPS"* y explica pedagógicamente la política de seguridad del navegador, ofreciendo el botón directo *"Ir a HTTPS para activar"* (`https://10.10.40.31`).
  3. Al acceder por `https://10.10.40.31`, el Service Worker y el registro de notificaciones Web Push se habilitan de inmediato.

---

## 3. RESUMEN DE PRUEBAS DE REGRESIÓN Y CALIDAD

| Suite de Validación | Pruebas Ejecutadas | Aprobadas | Fallidas | Estado |
| :--- | :---: | :---: | :---: | :---: |
| **Backend Unit Tests** (`GlpiTicketManager.Application.Tests`) | 75 | 75 | 0 | **PASS 🟢** |
| **Backend Integration Tests** (`GlpiTicketManager.Api.Integration.Tests`) | 236 | 236 | 0 | **PASS 🟢** |
| **Frontend Unit Tests** (Node test runner) | 21 | 21 | 0 | **PASS 🟢** |
| **Frontend TypeScript Typecheck** (`tsc --project tsconfig.build.json`) | Estricto | Sin errores | 0 | **PASS 🟢** |
| **Frontend Linter** (`eslint src`) | Estricto | Sin errores | 0 | **PASS 🟢** |
| **Compilación PWA v2.0.0** (`vite build`) | Bundle final | Exitoso | 0 | **PASS 🟢** |

---

## 4. ESTADO OPERATIVO FINAL

El aplicativo **GLPI Ticket Manager v2.0.0** se encuentra verificado, estable y listo para la demostración ejecutiva ante la jefatura técnica en el entorno de laboratorio LAN.
