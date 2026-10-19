# ADR-014: Modelo de roles de autorización (Technician, Supervisor, Admin)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-014 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


- **Status:** Accepted
- **Date:** 2026-10-16
- **Related:** ADR-009, ADR-012

## Contexto

Para cerrar las vulnerabilidades BOLA y responder a la necesidad del negocio de contar con un modelo de acceso estricto, la aplicación requiere distinguir entre tres niveles de privilegio operativo:
1. **Technician**: Modelo estricto donde el técnico solo tiene acceso a sus propios tickets asignados y a los tickets nuevos (sin asignar) de sus grupos para poder auto-asignárselos.
2. **Supervisor**: Visión y gestión completa de todos los tickets pertenecientes a sus grupos de trabajo.
3. **Admin**: Acceso y gestión global de todos los tickets y métricas del sistema.

En GLPI, los perfiles (`glpi_profiles`) son heterogéneos y pueden cambiar o variar entre instalaciones (ej. `Super-Admin = 4`, `Admin = 3`, `Technician = 6`, `Supervisor = 7`). Además, una organización puede requerir promover temporal o permanentemente a un usuario en la aplicación sin alterar su perfil nativo en GLPI.

## Decisión

1. **Definir tres roles canónicos en la aplicación**:
   - `technician` (valor numérico / prioridad 1)
   - `supervisor` (prioridad 2)
   - `admin` (prioridad 3)

2. **Persistencia en PostgreSQL (`app-db`) mediante dos tablas complementarias**:
   - `role_profile_mapping`: Mapea perfiles de GLPI (`glpi_profile_id INT PRIMARY KEY`) al rol de la aplicación (`app_role TEXT CHECK (...)`).
   - `user_role_overrides`: Permite asignar un rol específico a un usuario (`user_id INT PRIMARY KEY`), con registro de quién lo otorgó (`granted_by`), fecha (`granted_at`) y motivo (`reason`).

3. **Mecanismo de resolución (`IUserRoleResolver`) en el login**:
   - Primero consulta `user_role_overrides` para el `user_id`. Si existe override, se respeta ese rol.
   - Si no existe override, consulta los perfiles asignados al usuario en `glpi_profiles_users` cruzados con `role_profile_mapping` y toma el rol de mayor jerarquía (`admin` > `supervisor` > `technician`).
   - Si no existe mapeo aplicable, se asigna por defecto `technician`.

4. **Inclusión de claim en el JWT**:
   - El token JWT emitido por la API incluye el claim `"role"` con el valor canónico (`technician`, `supervisor`, o `admin`).
   - Esto evita consultas repetitivas a base de datos en cada endpoint y permite que tanto el middleware como las políticas de autorización (`TicketAccessPolicy`, `DashboardAccessPolicy`) extraigan el rol de forma inmediata.

5. **Aplicación estricta de la seguridad en el servidor**:
   - `TicketAccessPolicy`:
     * `Admin`: Acceso irrestricto.
     * `Supervisor`: Acceso a cualquier ticket de sus grupos.
     * `Technician`: Solo puede ver y modificar tickets asignados a él, o ver tickets en estado Nuevo (1) sin asignar de sus grupos para poder reclamarlos.
   - `DashboardAccessPolicy`:
     * `Admin`: Métricas globales consolidadas.
     * `Supervisor`: Métricas agregadas correspondientes a sus grupos.
     * `Technician`: Métricas estrictamente personales (tickets propios asignados y cola; sin carga de otros técnicos).

## Alternativas rechazadas

- **Hardcodeo de IDs de perfiles en código C#**: Inflexible ante cambios en GLPI y propenso a errores entre entornos de desarrollo, testing y producción.
- **Uso directo de roles de GLPI sin mapeo**: Los perfiles de GLPI contienen decenas de flags ITIL granulares que complican el modelo conceptual y acoplan innecesariamente la API al esquema interno de perfiles de GLPI.
- **Autorización delegada al frontend**: Viola el principio de defensa en profundidad; el cliente web solo adapta y oculta controles visuales por conveniencia, pero el servidor valida rigurosamente cada operación.

## Consecuencias

- **Positivas**:
  * Cierre definitivo de BOLA en endpoints de tickets y dashboard.
  * Flexibilidad para promover técnicos a supervisores o administradores sin tocar la base de datos de GLPI.
  * Resolución limpia y rápida de claims en el token JWT.
- **Negativas / Coste**:
  * Requiere mantener sincronizada la tabla `role_profile_mapping` con los perfiles existentes en GLPI.
  * La resolución de roles durante el login consulta ambas bases de datos (PostgreSQL para overrides/mapeos y MariaDB para perfiles del usuario).
