# Plan de Pruebas de Calidad (QA Master Test Plan)

> **Control Documental ISO 9001:2015 / Cláusula 8.6 (Liberación de Productos y Servicios)**  
> **Código:** DOC-QA-PLN-001 | **Versión:** 2.1.0 | **Fecha:** 2026-10-27 | **Aprobador:** Tech Lead & QA Lead

---

## 1. Alcance y Objetivos

Este documento formaliza los casos de prueba, criterios de aceptación y registros de ejecución manual y automatizada para la plataforma **GLPI Ticket Manager**. Aplica a todas las interfaces operativas (Desktop, Tablet, Mobile) y componentes de sincronización en tiempo real (SignalR, Web Push).

---

## 2. Matriz de Casos de Prueba (Misión H-55)

| ID Caso | Módulo / Componente | Descripción del Escenario | Rol Evaluado | Criterio de Aceptación | Resultado | Fecha Ejecución | Evidencia |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **TC-H55-01** | UI / Responsive Mobile | Visualización del tablero Kanban en viewport móvil 390x844 (iPhone 14) | `tech_sd` | Colapso a columna única con pestañas segmentadas, sin scroll horizontal, tap targets >= 44px. | **PASS 🟢** | 2026-10-27 | `h55-1-kanban-mobile-390.png` |
| **TC-H55-02** | UI / Responsive Desktop | Visualización del tablero Kanban en viewport desktop 1440x900 | `tech_sd` | Disposición en 5 columnas paralelas, fondo translúcido Liquid Glass, scrollbars invisibles (`no-scrollbar`). | **PASS 🟢** | 2026-10-27 | `h55-2-kanban-desktop-1440.png` |
| **TC-H55-03** | Notificaciones / Contextual | Recepción de notificación de ticket nuevo en Service Desk con botón "Ir al grupo" | `tech_sd` | Toast contextual incluye nombre del grupo ("Service Desk") y botón de acción que redirige al grupo sin desorientar. | **PASS 🟢** | 2026-10-27 | `h55-3-contextual-notification.png` |
| **TC-H55-04** | Backend / Supervisión Live | Asignación y resolución de ticket en tiempo real reflejado en Dashboard de Equipo | `lider_sd` | Contador y métricas del líder se actualizan automáticamente vía SignalR sin refrescar la página. | **PASS 🟢** | 2026-10-27 | `h55-4-leader-sd-dashboard.png` |
| **TC-H55-05** | UI / Optimistic Mutate | Auto-asignación de ticket con latencia percibida 0ms | `tech_sd` | Tarjeta desaparece de la cola y aparece en "Mis tickets" instantáneamente antes de la respuesta HTTP. | **PASS 🟢** | 2026-10-27 | Verificación en código y suite E2E |
| **TC-H55-06** | Calidad / Consola F12 | Auditoría de excepciones en consola de navegador | `lider_sd`, `tech_sd` | Cero errores rojos (0 códigos 401, 403, 500 o fallos de WebSocket). | **PASS 🟢** | 2026-10-27 | Logs de suite `h55-verification.mjs` |

---

## 3. Criterios de Liberación y Aprobación

- **Pruebas Automatizadas:** 100% de los 40 tests de Playwright (`tests/e2e/*.spec.ts`) en verde.
- **Rendimiento:** Latencia de mutación percibida menor a 50ms (0ms optimista).
- **Accesibilidad y Ergonomía:** Cumplimiento de directrices WCAG 2.5.5 para áreas táctiles mínimas (44x44px).
- **Estado de Aprobación:** **APPROVED 🟢**
