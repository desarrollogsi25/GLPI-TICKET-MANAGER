# Autorización y Control de Acceso (RBAC + ABAC)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-12-AUTHORIZATION | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


Este documento describe el modelo de autorización implementado en GLPI Ticket Manager para mitigar vulnerabilidades BOLA (*Broken Object Level Authorization*) y aplicar el principio de mínimo privilegio.

---

## 1. Modelo de Roles

La aplicación reconoce tres roles canónicos definidos en el enum `AppRole`:

1. **`Technician` (Técnico)**:
   - Rol operativo base.
   - Modelo de acceso estricto: solo puede visualizar y gestionar tickets asignados a su propio `userId`, o tickets en estado Nuevo (1) sin asignar de sus grupos de trabajo.
   - Acceso al dashboard restringido a métricas personales.

2. **`Supervisor` (Supervisor)**:
   - Rol de supervisión y gestión departamental.
   - Puede ver, modificar estado y agregar soluciones a cualquier ticket que pertenezca a sus grupos asignados.
   - Acceso al dashboard con métricas agregadas de sus grupos de trabajo.

3. **`Admin` (Administrador)**:
   - Control y visibilidad global de todo el sistema.
   - Puede consultar cualquier ticket, modificar su estado, consultar colas de cualquier grupo y ver métricas globales consolidadas.

---

## 2. Matriz de Permisos: Rol × Operación

| Operación / Endpoint | Técnico (`technician`) | Supervisor (`supervisor`) | Administrador (`admin`) |
| :--- | :--- | :--- | :--- |
| **GET /api/tickets** (Listado) | Filtrado forzado a tickets propios asignados | Tickets propios / asignados | Global |
| **GET /api/tickets/{id}** (Detalle) | Asignado a él **O** (Estado 1 + Sin asignar + Grupo del usuario) | Pertenece a sus grupos | Cualquier ticket |
| **PATCH /api/tickets/{id}/status** | Solo si asignado a él | Pertenece a sus grupos | Cualquier ticket |
| **POST /api/tickets/{id}/claim** | Estado 1 + Sin asignar + Grupo del usuario | Estado 1 + Sin asignar + Grupo del usuario | Permitido |
| **POST /api/tickets/{id}/solutions** | Solo si asignado a él | Pertenece a sus grupos | Cualquier ticket |
| **POST /api/tickets/{id}/reopen** | Solo si asignado a él | Pertenece a sus grupos | Cualquier ticket |
| **GET /api/tickets/by-group** | Grupo pertenece al usuario | Grupo pertenece al usuario | Cualquier grupo |
| **GET /api/dashboard/stats** | Métricas personales (sin workload ajeno) | Métricas de sus grupos | Métricas globales completas |

---

## 3. Resolución de Roles (`IUserRoleResolver`)

La resolución se ejecuta en cada inicio de sesión (`AuthService.LoginAsync`) mediante la siguiente precedencia:

1. **Consulta de overrides individuales**:
   Busca en la tabla `user_role_overrides` de PostgreSQL para el `userId`. Si existe un registro, se asigna directamente ese rol.
2. **Cruce de perfiles GLPI con mapeo**:
   Si no hay override, se obtienen los perfiles del usuario en MariaDB (`glpi_profiles_users`) y se cruzan con `role_profile_mapping` en PostgreSQL. Se selecciona el rol de mayor prioridad:
   $$\text{admin (3)} > \text{supervisor (2)} > \text{technician (1)}$$
3. **Fallback por defecto**:
   Si el usuario no tiene perfiles mapeados, se le asigna `technician`.

El rol resuelto se sella en el JWT bajo el claim `"role"`, permitiendo una verificación libre de accesos a base de datos en las peticiones posteriores.

---

## 4. Promoción de Usuarios (Overrides)

Para promover o cambiar el rol de un usuario sin alterar su configuración de perfiles nativa en GLPI, se inserta o actualiza un registro en `user_role_overrides`:

```sql
INSERT INTO user_role_overrides (user_id, app_role, granted_by, granted_at, reason)
VALUES (7, 'supervisor', 2, NOW(), 'Promocion temporal a lider de turno')
ON CONFLICT (user_id) DO UPDATE
SET app_role = EXCLUDED.app_role,
    granted_by = EXCLUDED.granted_by,
    granted_at = NOW(),
    reason = EXCLUDED.reason;
```

Para revocar la promoción y volver al rol derivado de GLPI:
```sql
DELETE FROM user_role_overrides WHERE user_id = 7;
```

---

## 5. Auditoría de Seguridad

Cualquier cambio de rol mediante override o acción sensible sobre tickets (`claim`, `resolve`) genera un registro inmutable en `audit_log`:

```sql
SELECT id, user_id, action, ticket_id, details, created_at
FROM audit_log
ORDER BY id DESC
LIMIT 20;
```

---

## 6. Visibilidad de Followups Privados (H-08)

La privacidad de seguimientos y notas técnicas (`glpi_itilfollowups.is_private = 1`) se aplica rigurosamente en la capa de datos en el backend, no en el frontend, mediante el parámetro de consulta SQL `@CanSeePrivate`:

- **Administrador (`Admin`)**: Visualiza todos los followups (públicos y privados) de cualquier ticket.
- **Supervisor (`Supervisor`)**: Visualiza followups privados si el ticket pertenece a uno de sus grupos asignados (`userGroups.Intersect(ticketGroups).Any()`).
- **Técnico Asignado (`Technician`)**: Visualiza followups privados únicamente si está explícitamente asignado al ticket (`IsUserAssignedToTicketAsync(userId, ticketId)`).
- **Solicitante / Observador (`Requester / Observer`)**: Nunca tienen acceso a followups privados (`is_private = 1`).

### Implementación en SQL
El repositorio ejecuta la consulta parametrizada `TicketQueries.FollowupsByTicketFiltered`:

```sql
WHERE f.itemtype = 'Ticket'
  AND f.items_id = @TicketId
  AND (@CanSeePrivate = 1 OR f.is_private = 0)
```

La política `TicketAccessPolicy.CanSeePrivateFollowupsAsync(userId, role, ticketId)` evalúa las relaciones antes de la consulta, asegurando que los seguimientos confidenciales nunca viajen por la red hacia clientes no autorizados.
