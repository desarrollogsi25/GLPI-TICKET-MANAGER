# ADR-020 — Resolución atómica de ticket (enmienda ADR-006)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-020 | **Versión:** 1.0.0 | **Fecha:** 2026-10-21 | **Autor:** GLPI Ticket Manager Team


- **Estado:** Aceptado (Accepted)
- **Fecha:** 2026-10-21
- **Enmienda a:** [ADR-006 — Self-assign y solución obligatoria para cerrar](ADR-006-self-assign-and-solution-required.md)
- **Relacionado:** ADR-002 (API ↔ GLPI), ADR-017 (estrategia de escritura), ADR-018 (SignalR), ADR-019 (reapertura)

## Contexto

ADR-006 fijó dos reglas de negocio: la **autoasignación** del técnico y la
**obligatoriedad de una solución escrita** para poder resolver un ticket. La segunda
regla se enuncia así en el ADR:

> «Una solución **no cambia** el estado del ticket: escribir la solución y mover el
> ticket a Resuelto son dos operaciones independientes.»

Esa premisa resultó **empíricamente falsa** en GLPI 11 y es la causa raíz de
[BUG-031](../../11-incidents/BUG-031-resolucion-ticket-solucion-corta.md).

Verificación contra el stack real (GLPI 11 + MariaDB) antes de esta decisión:

```
POST /apirest.php/ITILSolution  { itemtype: "Ticket", items_id: 9501, content: "OK" }
  → 201 Created
GET  /api/tickets/9501  →  status = 5 (Solved)     ← GLPI resolvió el ticket por su cuenta
```

En GLPI 11, **crear una `ITILSolution` mueve el ticket a `Resuelto (5)`**. Por tanto la
secuencia legacy de dos llamadas se contradecía a sí misma:

```
POST /api/tickets/{id}/solutions   → 201   (GLPI deja el ticket en 5)
PATCH /api/tickets/{id}/status 5   → el ticket ya está en 5; el backend reescribe el
                                      estado y luego lo cierra a 6
reintento                           → GLPI responde 400 "El elemento ya está resuelto"
```

Con una solución corta (`"OK"`) el flujo era aún peor: la comprobación de existencia de
la solución exigía `CHAR_LENGTH(TRIM(content)) >= 10`, así que el backend respondía
`422 "Ticket no puede marcarse como resuelto sin solución escrita"` **aunque la
solución sí existiera**.

Además, el contrato de errores no distinguía un conflicto de estado (`409`) de un
fallo de GLPI (`502`), por lo que el técnico recibía mensajes internos de GLPI sin
acción posible.

## Decisión

### 1. Enmienda a ADR-006

Se **enmienda** ADR-006 en su premisa central:

> «Escribir una solución **sí** puede cambiar el estado del ticket: en GLPI 11 la
> creación de una `ITILSolution` deja el ticket en `Resuelto (5)`. El API no debe
> asumir lo contrario ni esperar que el cambio de estado sea idempotente en GLPI; debe
> **releer el estado** tras la escritura y actuar en consecuencia.»

La regla de negocio de ADR-006 se mantiene intacta: **ningún ticket se resuelve sin una
solución escrita con contenido no vacío**. Lo que cambia es el **mecanismo**, no la regla.

### 2. Endpoint atómico `POST /api/tickets/{id}/resolve`

Se decide que la resolución de un ticket sea **una única operación** en el API, en
lugar de dos llamadas coordinadas por el cliente:

```
POST /api/tickets/{id}/resolve
{ "content": "OK" }
```

Secuencia interna (`TicketService.ResolveAsync`):

1. **Validar** el contenido: no vacío, ≤ 2000 caracteres → si no, `400`.
2. **Autorizar** antes de escribir nada: `CanAddSolutionAsync` **y**
   `EvaluateStatusTransitionAsync(userId, role, ticketId, Solved)` → si no, `403`.
   Sólo el técnico **asignado**, su supervisor o un administrador pueden resolver.
3. **Comprobar el estado actual**: si el ticket ya está `Resuelto (5)` o `Cerrado (6)`,
   no hay nada que hacer → `409 Conflict`.
4. **Escribir la solución** (`POST /ITILSolution` en GLPI). Si GLPI responde que el
   elemento ya está resuelto o cerrado, se traduce a `409 Conflict`.
5. **Releer el estado** del ticket y escribir `5` **sólo si GLPI no lo aplicó** (por
   ejemplo, si la solución se marcó como obsoleta).
6. **Cerrar automáticamente a `6` (Cerrado)**, como ya establecía ADR-006: sólo un
   administrador puede reabrir un ticket cerrado, de modo que dejar el ticket en
   `Resuelto` bloquearía al técnico.
7. **Auditar** la operación con la acción `resolve` en `audit_log`.
8. **Emitir un único evento** SignalR `TicketStatusChanged` con el estado final (6).

La operación **no** es transaccional en el sentido de base de datos: GLPI no expone
transacciones sobre su API REST. La atomicidad es **lógica** (una sola llamada, un
único resultado observable) y el estado intermediate es recuperable: un ticket que quedó
en `5` con solución escrita es un estado válido y reintentable.

### 3. Contrato de códigos HTTP

El endpoint de resolución (y el de creación de solución) usan un contrato explícito:

| Código | Significado | Ejemplo |
|---|---|---|
| `400 Bad Request` | Formato o contenido inválido | `content` vacío, > 2000 caracteres, cuerpo ausente |
| `401 Unauthorized` | JWT ausente o inválido | — |
| `403 Forbidden` | El usuario no puede resolver este ticket | Técnico no asignado, ticket de otro grupo |
| `404 Not Found` | El ticket no existe | — |
| `409 Conflict` | Conflicto de estado: el ticket ya está resuelto o cerrado | Reintento del técnico, doble envío |
| `422 Unprocessable Entity` | Regla de dominio incumplida | Falta la solución escrita para resolver |
| `502 Bad Gateway` | GLPI falló o devolvió un error no interpretable | Sesión GLPI caída, error de red |

El `400 "El elemento ya está resuelto"` de GLPI **nunca** se propaga al cliente: se
traduce a `409 Conflict` con un mensaje en español accionable.

### 4. El frontend realiza una sola llamada

El diálogo de resolución (`ResolveTicketDialog.tsx`) deja de orquestar dos peticiones
(`POST /solutions` + `PATCH /status`) y llama una sola vez a `/resolve`. Se añade un
guard de doble envío (`useRef` + estado `isSubmitting`) que deshabilita el botón de
confirmación desde el primer clic, de modo que un doble clic no genera dos
resoluciones.

Los endpoints legacy (`POST /solutions`, `PATCH /status`) **se mantienen** por
compatibilidad con clientes externos, y el flujo legacy se corrige para que una
solución corta tampoco devuelva `422`.

## Alternativas descartadas

1. **Mantener las dos llamadas y hacer idempotente el `PATCH /status`.** Descartada:
   el problema no es sólo la idempotencia; entre ambas llamadas el ticket queda en un
   estado transitorio observable por otros usuarios y por el evento en tiempo real. Con
   `workers > 1` dos técnicos podrían cerrar el mismo ticket a la vez.
2. **Subir el mínimo de la solución a 10 caracteres.** Descartada: contradice el
   contrato del API (H-24), que existe precisamente para permitir cierres rápidos, y
   traslada una regla de UI al servidor.
3. **Forzar el estado a 5 antes de escribir la solución.** Descartada: con GLPI 11 la
   solución se escribiría sobre un ticket ya resuelto, que es exactamente el escenario
   que GLPI rechaza con «El elemento ya está resuelto».
4. **No auto-cerrar a 6.** Descartada: sólo un administrador puede reabrir un ticket
   cerrado (ADR-019), por lo que dejarlo en `Resuelto (5)` bloquearía al técnico que
   necesita volver a trabajar el ticket.

## Consecuencias

**Positivas**

- El técnico hace **una** acción y obtiene **un** resultado: no hay estados
  intermedios ni contradicciones entre el backend y GLPI.
- El contrato de errores es accionable y en español.
- Se elimina la divergencia entre el doble de pruebas y el SQL de producción mediante
  `SolutionQueryTests`, que fija las invariantes sobre el SQL real.

**Negativas / costes**

- Un cliente externo que encadenase `POST /solutions` + `PATCH /status` sigue
  funcionando, pero ahora puede recibir `409` en el segundo paso si el ticket ya fue
  resuelto por el primero: es un comportamiento más honesto que el `400` opaco de GLPI.
- El endpoint `/resolve` duplica parte de la lógica de `UpdateStatusAsync`; la
  duplicación se mantiene mínima y cubierta por `ResolveTests`.

## Enlaces

- [BUG-031 — Incidente y post-mortem](../../11-incidents/BUG-031-resolucion-ticket-solucion-corta.md)
- [KB — Resolución de tickets](../../10-knowledge-base/resolucion-de-tickets.md)
- [Módulo de tickets — flujo de resolución](../../02-modules/tickets/overview.md)
