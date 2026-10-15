# Módulo de Auditoría (Audit Log)

- **Capa:** `GlpiTicketManager.Application` + `GlpiTicketManager.Infrastructure`
- **Destino de datos:** Tabla `audit_log` en PostgreSQL (`app-db`, ADR-012)
- **Repositorio:** `IAuditRepository` (`GlpiTicketManager.Infrastructure.Repositories.AuditRepository`)

---

## 1. Propósito y Alcance

Registrar de forma inmutable las acciones operativas críticas realizadas por los técnicos y usuarios a través del sistema.

Actualmente se auditan las siguientes acciones:
- **`claim`**: Cuando un técnico se autoasigna un ticket desde la cola (`POST /api/tickets/{id}/claim`).
- **`resolve`**: Cuando un ticket pasa a estado resuelto (`status = 5`) vía `PATCH /api/tickets/{id}/status`.

---

## 2. Formato del Registro

Cada evento de auditoría almacena:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `BIGINT` | Identificador único secuencial generado automáticamente (`GENERATED ALWAYS AS IDENTITY`). |
| `user_id` | `INT` | ID del usuario o técnico en GLPI (`glpi_users.id`) obtenido de los claims del JWT. |
| `action` | `VARCHAR(100)` | Código de la acción auditada (`claim`, `resolve`). |
| `ticket_id` | `INT` | ID del ticket de GLPI sobre el que se operó (`glpi_tickets.id`). |
| `details` | `JSONB` | Metadata adicional estructurada (opcional / nullable). |
| `created_at` | `TIMESTAMPTZ` | Timestamp UTC exacto del registro (`NOW()`). |

---

## 3. Resiliencia ante Fallos (Non-blocking)

> [!IMPORTANT]
> La auditoría **NO bloquea ni aborta** el flujo operacional principal si la base de datos de auditoría experimenta un error.

En `TicketService`:
- La llamada a `_audit.LogAsync(...)` está envuelta en un bloque `try/catch(Exception ex)`.
- Si `LogAsync` arroja una excepción, se registra como advertencia (`_logger.LogWarning(...)`) y el flujo del ticket continúa exitosamente devolviendo el resultado correspondiente al cliente.

---

## 4. Consultas y Verificación

Para consultar los eventos de auditoría registrados en PostgreSQL:

```sql
SELECT id, user_id, action, ticket_id, details, created_at
FROM audit_log
WHERE user_id = 7
ORDER BY created_at DESC;
```

Para verificar entradas de un ticket específico:
```sql
SELECT id, user_id, action, ticket_id, created_at
FROM audit_log
WHERE ticket_id = 11
ORDER BY created_at ASC;
```
