# ADR-010: Modelo de usuario externo con cuenta en GLPI

- **Status:** Accepted
- **Date:** 2026-10-14
- **Supersedes:** ADR-005
- **Related:** ADR-004, ADR-009, ADR-011, ADR-013

## Contexto

En el diseño anterior (ADR-005), se asumía que los solicitantes externos (llamadas telefónicas o usuarios sin cuenta institucional) debían registrarse sin cuenta en `glpi_users`, utilizando `users_id = 0`, el campo `alternative_email` en `glpi_tickets_users` y un bloque de texto parseable estructurado dentro del campo `content` del ticket.

El responsable del área ("el jefe") y el cliente revisaron y modificaron formalmente esta decisión:
1. Todos los solicitantes externos deben ser usuarios identificados con cuenta formal en `glpi_users`.
2. Las cuentas para estos usuarios externos son creadas y aprovisionadas directamente por el personal de **Service Desk** desde la interfaz administrativa de GLPI.
3. El sistema propio no es un sistema de administración de identidades ni de altas de usuarios.
4. Con su cuenta en GLPI, el usuario externo puede autenticarse en el portal estándar de GLPI (`helpdesk.public.php`) con perfil de autoservicio para crear sus propios tickets y consultar el estado y seguimiento de sus requerimientos.

## Flujo confirmado (2026-10-14)

1. **Service desk crea la cuenta del externo en GLPI UI**: La mesa de servicio únicamente gestiona el alta de usuarios en `glpi_users`.
2. **El externo crea sus propios tickets**: Una vez provista la cuenta, el usuario externo entra de manera autónoma al portal GLPI (`helpdesk.public.php`) y crea **sus propios tickets**.
3. **Service desk NO crea tickets a nombre de terceros**: Se elimina la práctica de creación delegada de tickets por parte de la mesa de servicio. Cada usuario es responsable de registrar su caso.
4. **El sistema propio NO crea cuentas ni tickets**: Toda la operativa de altas queda 100% circunscrita a GLPI nativo.

## Decisión

1. **Identidad unificada en `glpi_users`**:
   Todo solicitante (sea interno o externo) es una entidad persistida con un identificador entero válido (`id > 0`) en la tabla `glpi_users`.
2. **Creación descentralizada en GLPI**:
   La creación y mantenimiento de cuentas para usuarios externos es responsabilidad exclusiva de Service Desk en GLPI. El sistema propio **NO crea cuentas de usuario ni tickets**.
3. **Autonomía del solicitante**:
   El usuario externo accede directamente al portal GLPI para registrar sus requerimientos y consultar el progreso.
4. **Desestimación del modelo `users_id = 0`**:
   Se abandona el uso de `alternative_email` con `users_id = 0` como mecanismo arquitectónico principal de vinculación de solicitantes externos.

## Consecuencias

- **Eliminación del parseo de datos de llamante**:
  El bloque de texto "Llamante: ... · Tel: ... · Empresa: ..." embebido en la descripción del ticket deja de ser necesario, simplificando la visualización del contenido.
- **Relaciones limpias en el modelo relacional**:
  Todos los registros en `glpi_tickets_users` vinculan directamente un `tickets_id` con un `users_id` existente y validado por GLPI.
- **Sin impacto en el sistema propio**:
  Al eliminarse la creación de tickets en el sistema propio (según ADR-009), los formularios de captura de solicitantes externos quedan completamente fuera de nuestro alcance.
- **Superación de ADR-005**:
  ADR-005 queda formalmente reemplazado por este documento.
