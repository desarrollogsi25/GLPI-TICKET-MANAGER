# BUG-031 — No se puede resolver un ticket con solución corta ("OK")

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-11-INC-BUG-031 | **Versión:** 1.0.0 | **Fecha:** 2026-10-21 | **Autor:** GLPI Ticket Manager Team

## 1. Resumen Ejecutivo

- **ID del Incidente:** BUG-031 (ticket H-31)
- **Fecha y Hora de Inicio (UTC):** 2026-10-20 (reporte del usuario), detectado el 2026-10-21
- **Fecha y Hora de Resolución (UTC):** 2026-10-21
- **Severidad:** P2 — Alto (bloquea el cierre de tickets triviales; no hay pérdida de datos)
- **Servicios Afectados:** API de tickets (`POST /api/tickets/{id}/solutions`, `PATCH /api/tickets/{id}/status`), Kanban (flujo de resolución del técnico)
- **Lead del Incidente:** GLPI Ticket Manager Team

**Síntoma reportado por el técnico:** al escribir una solución corta (por ejemplo `OK`) y
confirmar el cierre, el sistema respondía

```
422 Unprocessable Entity
"detail": "Ticket no puede marcarse como resuelto sin solución escrita."
```

aunque la solución **sí** se había creado (la llamada anterior devolvía `201 Created`).
El reintento manual devolvía el error opaco de GLPI `400 "El elemento ya está resuelto"`,
lo que hacía pensar al usuario que el ticket estaba corrupto.

## 2. Impacto en el Negocio y Usuarios

- **Usuarios impactados:** técnicos de mesa de ayuda (rol `technician`) que cierran
  incidencias triviales con una solución breve.
- **Operaciones bloqueadas:** el cierre de tickets desde el Kanban. El técnico quedaba
  con el modal abierto y el ticket sin resolver, con la sensación de que el sistema
  "había guardado la solución pero la rechazaba".
- **Pérdida o inconsistencia de datos:** **Sí, leve**. Cada reintento dejaba una
  solución duplicada en `glpi_itilsolutions` y el ticket fluctuaba entre `Asignado (2)`,
  `Resuelto (5)` y `Cerrado (6)`. No se perdió ninguna solución escrita.

## 3. Cronología de Eventos (Timeline)

| Timestamp (UTC) | Evento / Acción Tomada | Responsable |
| :--- | :--- | :--- |
| 2026-10-20 | Usuario reporta que no puede cerrar tickets con solución corta | Soporte |
| 2026-10-21 09:10 | Se reproduce la cadena `POST /solutions` (201) + `PATCH /status {status:5}` → **422** | Backend Lead |
| 2026-10-21 09:40 | Se identifica la divergencia: la consulta SQL de existencia exigía `CHAR_LENGTH(TRIM(content)) >= 10` | Backend Lead |
| 2026-10-21 10:15 | Se detecta el segundo defecto: GLPI 11 marca el ticket como `Resuelto (5)` al crear la `ITILSolution`, y la secuencia en dos llamadas se contradecía a sí misma | Backend Lead |
| 2026-10-21 11:00 | Se implementa el endpoint atómico `POST /api/tickets/{id}/resolve` (ADR-020) | Backend Lead |
| 2026-10-21 12:30 | Se añade la suite de regresión (`ResolveTests`, `SolutionQueryTests`, `resolve-short-solution.spec.ts`) | QA Lead |
| 2026-10-21 14:00 | Validación en el stack real: matriz de reproducción verde y E2E en verde | QA Lead |
| 2026-10-21 15:00 | Documentación del incidente, KB y ADR-020 publicados | Tech Writer |

## 4. Análisis de Causa Raíz

Se identificaron **dos causas** que se combinaban en la misma pantalla.

### 4.1 Causa raíz principal — regla SQL más estricta que el contrato del API

`SolutionQueries.Exists` (SQL real ejecutado contra MariaDB) exigía:

```sql
AND TRIM(content) <> ''
AND CHAR_LENGTH(TRIM(content)) >= 10   -- ← regla que nadie 정의
```

El contrato del API (validado en `SolutionInsertAsync`) sólo exige **contenido no
vacío** y un máximo de 2000 caracteres; explícitamente se permiten soluciones breves
(ADR-006 / H-24). La consulta de verificación, en cambio, exigía 10 caracteres, por lo
que una solución de 2 caracteres:

1. se insertaba correctamente (`201 Created`),
2. no era encontrada por la comprobación previa al cambio de estado,
3. y el `PATCH /status { "status": 5 }` respondía `422`.

> **Por qué no lo detectaron los tests:** el doble de pruebas (`CustomWebApplicationFactory`)
> reimplementaba la comprobación en memoria con la semántica correcta ("no vacío"), por lo
> que la suite verde y el comportamiento real divergían. El SQL de producción nunca se
> ejecutaba en los tests de integración. La nueva suite `SolutionQueryTests` fija esta
> invariante sobre el SQL real para que no vuelva a divergir.

### 4.2 Causa raíz secundaria — GLPI 11 auto-resuelve al crear la solución

En GLPI 11 la creación de una `ITILSolution` mueve el ticket a `Resuelto (5)` por su
cuenta. La secuencia legacy en dos llamadas (primero `POST /solutions`, después
`PATCH /status`) se contradecía: la segunda llamada pedía un cambio de estado que GLPI
ya había aplicado, y cualquier reintento se traducía en el `400 "El elemento ya está
resuelto"` de GLPI. Además, el `400` de GLPI se devolvía al cliente sin traducir, de
modo que el mensaje no explicaba la causa real.

> ADR-006 afirmaba que «una solución no cambia el estado del ticket». La verificación
> empírica contra GLPI 11 demuestra lo contrario; ADR-020 corrige esa premisa.

### 4.3 Causa contribuyente — contrato de error incompleto

El API no distinguía «el ticket ya está resuelto» (un **conflicto de estado**, `409`) de
«GLPI rechazó la petición» (un **fallo de GLPI**, `502`). El técnico recibía un `400`
con un texto interno de GLPI que no indicaba qué hacer.

## 5. Evidencia de Reproducción

Reproducción contra el stack real (GLPI 11 + MariaDB), con el harness
`scratch/h31-repro.ps1`:

### Antes de la corrección

```
### G2. PATCH /status {status:5} tras solución corta
    HTTP 422
    {"title":"Operación no válida","status":422,
     "detail":"Ticket no puede marcarse como resuelto sin solución escrita."}

### H. POST /solutions sobre un ticket ya en estado 5
    HTTP 400
    {"title":"Error de validación","status":400,
     "detail":"El elemento ya está resuelto."}   ← mensaje interno de GLPI
```

### Después de la corrección

```
### G2. PATCH /status {status:5} tras solución corta
    HTTP 204

### H. POST /solutions sobre un ticket ya en estado 5
    HTTP 409
    {"title":"Conflicto de estado","status":409,
     "detail":"No se puede agregar una solución al ticket 9501 porque ya fue resuelto."}
```

La regresión está fijada por tests que **fallan sin la corrección**:

| Nivel | Artefacto | Comportamiento sin la corrección |
|---|---|---|
| Unitario (SQL real) | `SolutionQueryTests.ExistsQuery_DoesNotRequireAMinimumLength` | `FAIL` (detecta el `>= 10`) |
| Integración | `ResolveTests` (12 casos) | El endpoint `/resolve` no existe → `404` |
| E2E (stack real) | `frontend/tests/e2e/resolve-short-solution.spec.ts` | `422 "Ticket no puede marcarse como resuelto sin solución escrita."` |

## 6. Corrección Aplicada

1. **`SolutionQueries.Exists`**: se elimina el mínimo de 10 caracteres. El contrato
   válido es «contenido no vacío»; las soluciones obsoletas (`status = 4`) siguen sin
   contar. Cubierto por `SolutionQueryTests`.
2. **Nuevo endpoint atómico `POST /api/tickets/{id}/resolve`** (`ResolveTicketRequest`,
   `ITicketService.ResolveAsync`, `TicketService.ResolveAsync`):
   - valida el contenido y la autorización (`CanAddSolutionAsync` **y**
     `EvaluateStatusTransitionAsync(..., Solved)`) **antes de cualquier escritura**;
   - escribe la solución (GLPI auto-resuelve → 5);
   - relee el estado y escribe `5` sólo si GLPI no lo aplicó;
   - cierra automáticamente a `6` (Closed);
   - registra la auditoría `resolve`;
   - emite **un único** evento SignalR `TicketStatusChanged`.
3. **Traducción de errores**: `409 Conflict` para «el ticket ya está resuelto/cerrado»,
   `422` para reglas de dominio, `400` para formato inválido, `403` para falta de
   permisos, `404` para ticket inexistente y `502` para fallo de GLPI.
4. **Frontend**: `ResolveTicketDialog` realiza **una sola** llamada a `/resolve` con un
   guard de doble envío (`useRef` + `isSubmitting`); mensajes al técnico en español.

## 7. Verificación

| Verificación | Resultado |
|---|---|
| Suite de integración backend (Docker, .NET 10) | **82/82 PASSED** |
| Regresión unitaria (SQL restaurado a `>= 10`) | `SolutionQueryTests` **FAIL** (prueba válida) |
| E2E contra el stack real (con SQL antiguo) | `resolve-short-solution.spec.ts` **FAIL** con el `422` reportado |
| E2E contra el stack real (con la corrección) | **3/3 PASSED** (`resolve-short-solution` ×2, `resolve-ticket` ×1) |
| Matriz de reproducción `scratch/h31-repro.ps1` | verde (204 / 409 en los casos de conflicto) |
| Verificación de tipos frontend (`tsc --noEmit`) | exit 0 |

## 8. Acciones Correctivas y Preventivas

| Acción | Tipo | Responsable | Fecha objetivo | Estado |
| :--- | :--- | :--- | :--- | :--- |
| Corregir `SolutionQueries.Exists` y añadir test que fije el SQL de producción | Corrección | Backend Lead | 2026-10-21 | ✅ Hecho |
| Publicar el endpoint atómico `POST /api/tickets/{id}/resolve` (ADR-020) | Corrección | Backend Lead | 2026-10-21 | ✅ Hecho |
| Sustituir la secuencia de dos llamadas en el frontend por una sola | Corrección | Frontend Lead | 2026-10-21 | ✅ Hecho |
| Traducir el `400` de GLPI «ya está resuelto» a `409 Conflict` | Corrección | Backend Lead | 2026-10-21 | ✅ Hecho |
| Test de regresión automatizado (unitario + E2E contra stack real) | Prevención | QA Lead | 2026-10-21 | ✅ Hecho |
| Revisar el resto de consultas SQL frente al contrato del API (divergencia doble de pruebas) | Prevención | Backend Lead | 2026-10-28 | 🔄 En curso |
| Incorporar el caso «solución corta» a la UAT manual de 5 minutos | Prevención | QA Lead | 2026-10-21 | ✅ Hecho |

## 9. Lecciones Aprendidas

- **Un doble de pruebas que reimplementa la lógica de producción es una fuente de
  falsos negativos.** La divergencia entre `CustomWebApplicationFactory` y el SQL real
  permitió que el defecto llegara a producción. Los tests de integración deben
  apoyarse en el SQL de producción (o, como mínimo, fijar sus invariantes).
- **Las reglas de negocio implícitas del proveedor (GLPI) deben estar escritas.**
  ADR-006 contenía una premisa incorrecta sobre el comportamiento de GLPI 11
  que nadie verificó de forma empírica.
- **Un `4xx` de un proveedor externo no debe propagarse opaco al usuario final**: cada
  causa de negocio tiene su propio código HTTP y su propio mensaje.

## 10. Documentos Relacionados

- [ADR-020 — Resolución atómica de tickets (enmienda ADR-006)](../01-architecture/decisions/ADR-020-resolucion-atomic-de-ticket.md)
- [KB — Resolución de tickets (guía de operación)](../10-knowledge-base/resolucion-de-tickets.md)
- [Módulo de tickets — flujo de resolución](../02-modules/tickets/overview.md)
- [Estrategia de testing](../13-testing/strategy.md)
- [Plantilla de post-mortem](post-mortem-template.md)
