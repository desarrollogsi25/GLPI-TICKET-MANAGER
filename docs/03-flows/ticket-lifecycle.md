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
 [ 2. Asignado ] <──(Reapertura POST /reopen)─── [ 5. Resuelto ]
                                                            │
                                                   (Cierre administrativo)
                                                            ▼
                                                     [ 6. Cerrado ]
```

## 4. Reglas de Transición y Guards

1. **Claim (1 → 2)**:
   - Solo permitido si el ticket está en estado `New` (1) y no tiene técnico asignado.
   - Ejecutado mediante `UPDATE` condicional atómico en base de datos.
2. **Inicio (2 → 3)**:
   - Técnico cambia el estado a `Planned` (3) mediante `PATCH /api/tickets/{id}/status`.
3. **Pausa y Reanudación (3 ↔ 4)**:
   - Transiciones bidireccionales entre `Planned` (3) y `Waiting` (4).
4. **Resolución (3 → 5)**:
   - Guard estricto: exige la existencia de una solución escrita con al menos 10 caracteres significativos en `glpi_itilsolutions` (H-24).
5. **Reapertura (5/6 → 2)**:
   - Permite a Admin, Supervisor o Técnico asignado reactivar un ticket cerrado o resuelto conservando la trazabilidad (ADR-019).
