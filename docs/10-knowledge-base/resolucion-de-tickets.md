# KB — Resolución de tickets (BUG-031 / H-31)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-10-KB-RESOLUCION | **Versión:** 1.0.0 | **Fecha:** 2026-10-21 | **Autor:** GLPI Ticket Manager Team

## 1. Objetivo

Describir el flujo correcto para resolver un ticket en GLPI Ticket Manager,
incluyendo la corrección aplicada para los **tickets con solución corta** (por ejemplo
`OK`, `Listo`) introducida por [ADR-020](../01-architecture/decisions/ADR-020-resolucion-atomic-de-ticket.md).

## 2. ¿Cómo resolver un ticket? (flujo correcto)

El botón **«Resolver»** del Kanban utiliza el **endpoint atómico**

```
POST /api/tickets/{id}/resolve
Content-Type: application/json

{ "content": "<solución escrita>" }
```

El sistema:

1. Valida que la solución no esté vacía y no supere los 2000 caracteres.
2. Comprueba que el usuario puede resolverlo (técnico asignado, o supervisor/admin según corresponda).
3. Escribe la solución en GLPI.
4. **GLPI 11 marca el ticket como Resuelto (5) automáticamente al crear la solución.** El API relee el estado y lo cierra a **Cerrado (6)** para que el ticket no quede en un estado bloqueado.
5. Registra la operación en auditoría y emite **un único** evento en tiempo real.
6. El ticket aparece en la columna **«Resuelto»** del Kanban.

## 3. Reglas importantes

| Regla | Detalle |
|---|---|
| **Solución obligatoria** | No se puede resolver un ticket sin una solución escrita. Si el campo está vacío, el botón «Resolver» permanece deshabilitado. |
| **Soluciones cortas permitidas** | Se permiten soluciones breves como `OK`, `Listo`, `Solucionado`. Ya **no** existe un mínimo de 10 caracteres. |
| **Solo el técnico asignado o con permisos** | Un técnico no asignado recibe `403 Forbidden`. Un supervisor/admin puede resolver tickets de sus grupos (o todos, si es admin). |
| **Un ticket ya resuelto/cerrado** | Al reintentar, el sistema responde `409 Conflict` con un mensaje en español. **No** se duplica la solución. |
| **Doble clic protegido** | El botón se deshabilita al primer clic para evitar envíos duplicados. |
| **Cierre automático** | Tras resolver, el ticket pasa a `Cerrado (6)`. Sólo un administrador puede reabrir un ticket cerrado. |

## 4. Errores comunes (y qué hacer)

| Error HTTP | Mensaje (ejemplo) | Causa | Solución |
|---|---|---|---|
| `400 Bad Request` | *"La solución no puede estar vacía."* | Campo vacío o sólo espacios. | Escriba una descripción breve de la solución. |
| `400 Bad Request` | *"La solución supera los 2000 caracteres."* | Demasiado texto. | Reduzca el contenido o adjunte el detalle en un seguimiento. |
| `403 Forbidden` | *"Solo el técnico asignado puede resolver este ticket."* | Usuario sin permisos sobre el ticket. | Asigne el ticket o contacte a su supervisor. |
| `404 Not Found` | *"Ticket no encontrado."* | El ticket fue eliminado o no existe. | Actualice la lista; si persiste, contacte a soporte. |
| `409 Conflict` | *"El ticket ya fue resuelto o está cerrado. Si necesita seguir trabajando, solicite la reapertura a un administrador."* | Ya fue resuelto antes (o hay un envío duplicado). | No reenvíe el formulario. Si necesita modificar la solución, reabra el ticket con un administrador. |
| `422 Unprocessable Entity` | *"Ticket no puede marcarse como resuelto sin solución escrita."* | Falta una solución válida (flujo legacy). | Use el botón **«Resolver»** del Kanban, o escriba la solución antes de cambiar el estado. |
| `502 Bad Gateway` | *"Error de comunicación con GLPI..."* | GLPI no responde. | Reintente en unos segundos. Si persiste, contacte a Soporte/DevOps. |

## 5. Preguntas frecuentes

### ¿Por qué antes fallaba con una solución corta?
Porque el comprobante en el servidor exigía al menos **10 caracteres** y, además, GLPI 11
marca el ticket como **Resuelto** al crear la solución. La corrección ([BUG-031](../11-incidents/BUG-031-resolucion-ticket-solucion-corta.md))
elimina ese mínimo y unifica el flujo en un **endpoint atómico**.

### ¿Sigue funcionando el flujo antiguo (escribir solución + cambiar estado)?
Sí, por **compatibilidad**. Sin embargo, el flujo preferido es el botón **«Resolver»**
del Kanban. Si se usa el flujo antiguo, el sistema también es ahora compatible con
soluciones cortas y traduce los errores de GLPI al contrato del API.

### ¿Puedo resolver desde el detalle del ticket?
Sí. El botón **«Resolver»** también está disponible en la vista de detalle (`/tickets/{id}`).
Usa la misma lógica atómica.

### ¿Qué pasa si pulso dos veces «Resolver»?
El botón se deshabilita tras el primer clic. Si el envío se duplica por cualquier
razón, el segundo intento responde **`409 Conflict`** y no crea una segunda solución.

## 6. Soporte y referencias

- [BUG-031 — Incidente y post-mortem](../11-incidents/BUG-031-resolucion-ticket-solucion-corta.md)
- [ADR-020 — Resolución atómica de tickets](../01-architecture/decisions/ADR-020-resolucion-atomic-de-ticket.md)
- [ADR-006 — Autoasignación y solución obligatoria para cerrar](../01-architecture/decisions/ADR-006-self-assign-and-solution-required.md)
- [Módulo de Tickets — Documentación técnica](../02-modules/tickets/overview.md)
- [Estrategia de Testing](../13-testing/strategy.md)
