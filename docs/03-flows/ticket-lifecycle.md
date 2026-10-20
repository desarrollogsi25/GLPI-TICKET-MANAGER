# Flujo de Ciclo de Vida del Ticket

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-03-FLOW-LIFECYCLE | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Propósito

Este documento define la máquina de estados y el ciclo de vida completo de las incidencias gestionadas a través del sistema, alineado con el modelo de datos de GLPI y las decisiones de arquitectura del proyecto (ADR-006, ADR-017, ADR-019).

## 2. Máquina de Estados ITIL en GLPI

| Estado ID | Nombre Canónico | Código de Color | Descripción Operativa |
|---|---|---|---|
| **1** | `New` (Nuevo) | Slate / Gris | Incidencia registrada en GLPI sin técnico asignado. Disponible en la cola de grupo. |
| **2** | `Assigned` (Asignado) | Azul | Incidencia tomada por un técnico (`claim`) o asignada formalmente. En espera de inicio de trabajo. |
| **3** | `Planned` (En progreso) | Índigo | Técnico trabajando activamente en el diagnóstico o resolución de la incidencia. |
| **4** | `Waiting` (Pendiente) | Ámbar | Trabajo pausado por espera de respuesta externa, proveedor o usuario solicitante. |
| **5** | `Solved` (Resuelto) | Esmeralda | Solución técnica documentada y aplicada en GLPI (`glpi_itilsolutions`). |
| **6** | `Closed` (Cerrado) | Neutro | Incidencia validada administrativamente y cerrada en GLPI. |

## 3. Diagrama de Transiciones

```
 [ 1. Nuevo (Cola) ] ──(Autoasignación / Claim)──> [ 2. Mis Tickets (Asignado) ]
                                                             │
                                                      (Iniciar trabajo)
                                                             ▼
 [ 4. Pendiente (Espera) ] <──(Pausar/Reanudar)──> [ 3. En progreso ]
                                                             │
                                                   (Registrar Solución)
                                                             ▼
                                                       [ 5. Resuelto ]
                                                             │
                                          (Cierre AUTOMÁTICO al resolver)
                                                             ▼
                                                       [ 6. Cerrado ]

 (Reapertura 5/6 → 2: SOLO Administrador)
```

La máquina de estados es **monótona hacia adelante** para el técnico: `Nuevo → Asignado → En progreso ↔ Pendiente → Resuelto → Cerrado`. No existe retroceso hacia `Nuevo` una vez asignado.

## 4. Reglas de Transición y Guards

1. **Claim (1 → 2)**:
   - Solo permitido si el ticket está en estado `New` (1) y no tiene técnico asignado.
   - Ejecutado mediante `UPDATE` condicional atómico en base de datos.
2. **Inicio (2 → 3)**:
   - Técnico cambia el estado a `Planned` (3) mediante `PATCH /api/tickets/{id}/status`.
3. **Pausa y Reanudación (3 ↔ 4)**:
   - Transiciones bidireccionales entre `Planned` (3) y `Waiting` (4).
4. **Resolver (3/4 → 5)**:
   - Exige la existencia de una solución escrita en `glpi_itilsolutions` (ADR-006). La ausencia de solución se rechaza con `422 Unprocessable Entity`.
5. **Cierre automático (5 → 6)**:
   - Al resolverse un ticket, el sistema lo pasa inmediatamente a `Cerrado` (6) en la misma operación, sin intervención manual. Un fallo del cierre automático se registra como advertencia y no revierte la resolución.
6. **Sin retroceso a Nuevo (2/3 → 1)**:
   - Un técnico no puede devolver un ticket `Asignado` (2) o `En progreso` (3) al estado `Nuevo` (1). El intento responde `403` con el mensaje `No puedes devolver un ticket asignado o en progreso al estado Nuevo.`
7. **Cierre manual (→ 6)**: reservado a administradores (`403` para técnicos).
8. **Estados terminales y Reapertura (5/6 → 2)**:
   - `Resuelto` (5) y `Cerrado` (6) son **terminales para el técnico**.
   - **Solo un administrador** puede cambiar el estado de un ticket resuelto o cerrado o reabrirlo (ADR-019). El intento del técnico responde `403` con `Solo un administrador puede cambiar el estado de un ticket resuelto o cerrado.`
   - La reapertura conserva la trazabilidad registrando el motivo como seguimiento privado.
9. **Transiciones idempotentes (5 → 5)**:
   - Confirmar el estado ya vigente está permitido; esto cubre el efecto colateral de GLPI, que marca el ticket como `Resuelto` al crear la solución antes de que la aplicación confirme el cambio y aplique el cierre automático.
