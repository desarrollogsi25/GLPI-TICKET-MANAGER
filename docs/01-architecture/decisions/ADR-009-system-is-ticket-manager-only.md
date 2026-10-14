# ADR-009: El sistema propio es únicamente gestor de tickets (no creador)

- **Status:** Accepted
- **Date:** 2026-10-14
- **Supersedes:** ADR-003, ADR-007
- **Related:** ADR-002, ADR-004, ADR-006, ADR-010, ADR-011, ADR-012

## Contexto

El MVP inicial del sistema propio incluía la capacidad de crear tickets a través de un diálogo modal (`CreateTicketDialog.tsx`), enviando un `POST /api/tickets` que interactuaba con la API REST de GLPI (`/apirest.php/Ticket`).

Tras la revisión del alcance con dirección y el responsable del área ("el jefe"), se definió de forma explícita que:
1. **GLPI es y debe ser la única fuente de creación de tickets**: los tickets nacen en el portal GLPI (`helpdesk.public.php`) o son registrados directamente por el personal de Service Desk en la interfaz administrativa de GLPI.
2. El sistema propio tiene como objetivo exclusivo optimizar la **gestión, asignación rápida ("claim") y resolución** de los tickets existentes para los técnicos de soporte y call center.
3. Permitir la creación dual generaba duplicación de lógica de negocio (matrices de prioridad, reglas de negocio de GLPI, SLAs, validación de categorías y campos obligatorios) y sobrecarga de mantenimiento.

## Decisión

El sistema propio **NO creará tickets**. Se transforma formalmente en un **gestor de tickets exclusivo** ("Ticket Manager").

Todas las responsabilidades de alta de tickets, captura de datos iniciales del solicitante y clasificación primaria quedan delegadas al 100% en GLPI.

## Implicaciones

1. **Backend**:
   - Se deprecará y eliminará el endpoint `POST /api/tickets`.
   - El DTO `CreateTicketRequest` y sus validaciones asociadas se eliminarán del dominio de la aplicación.
2. **Frontend**:
   - Se retirará el componente modal `CreateTicketDialog.tsx` y el botón de acción de creación en la barra de herramientas.
3. **Tests**:
   - Los 3 tests E2E de Playwright enfocados en el flujo de creación de tickets (`creation.spec.ts`) serán retirados en el Bloque 2 de refactorización.
4. **Superficie de integración**:
   - La API de GLPI ya no se invocará para escritura de nuevos tickets; el sistema interactúa con MariaDB para lecturas (`SELECT`) y escrituras operativas específicas (asignación vía `glpi_tickets_users`, soluciones vía `glpi_itilsolutions`).

## Alternativas rechazadas

- **Mantener creación dual (GLPI + Sistema propio)**: Rechazada. Mantiene complejidad innecesaria, desincroniza las reglas de validación de GLPI 11 y obliga a duplicar el catálogo de servicios y formularios dinámicos.
- **Creación mediante API REST con webhook de retorno**: Rechazada. Añade latencia, acoplamiento frágil y no aporta valor frente a que los usuarios y la mesa de entrada utilicen el portal nativo de GLPI.

## Consecuencias

- **Positivas**:
  - Reducción de código: -1 endpoint REST (`POST /api/tickets`), -1 componente complejo de UI (`CreateTicketDialog.tsx`), -3 tests E2E.
  - Cero discrepancias con los plugins, reglas de negocio y automatizaciones nativas de GLPI al crear incidentes o solicitudes.
  - Reducción drástica de la superficie de ataque y del riesgo de datos inconsistentes en `glpi_tickets`.
- **Negativas / Compromisos**:
  - Los técnicos que deseen crear un ticket manual deberán acceder a la interfaz nativa de GLPI.
