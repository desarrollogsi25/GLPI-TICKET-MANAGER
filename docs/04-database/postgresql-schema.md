# Esquema de Base de Datos PostgreSQL (`glpi_ticket_manager`)

Este documento describe el esquema relacional de PostgreSQL utilizado para los **datos propios del sistema**, según lo establecido en el [ADR-012](../01-architecture/decisions/ADR-012-postgresql-for-own-data.md).

---

## 1. Principios y Convenciones de Diseño

1. **Separación de Responsabilidades:**
   - MariaDB almacena exclusivamente el core de GLPI (`glpi_*`).
   - PostgreSQL almacena la configuración, preferencias, auditoría y tokens del sistema propio.
   - **Regla de oro:** Un dato vive en una base de datos, nunca en dos.
2. **Claves Primarias Subrogadas:**
   - Se utiliza estrictamente el estándar SQL moderno: `BIGINT GENERATED ALWAYS AS IDENTITY`.
   - Se prohíben tipos no estándar o legacy como `SERIAL` y `BIGSERIAL`.
3. **Referencias Cruzadas a GLPI (Foreign Keys Lógicas):**
   - Las referencias a usuarios (`user_id`) o tickets (`ticket_id`) son estrictamente de tipo **`INT`**, coincidiendo exactamente con los tipos de `glpi_users.id` y `glpi_tickets.id` en MariaDB.
   - No existen foreign keys a nivel de motor de base de datos; la integridad referencial se gestiona a nivel de aplicación.
4. **Tipos Temporales y Semiestructurados:**
   - Fechas y marcas de tiempo usan `TIMESTAMPTZ` (`timestamp with time zone`).
   - Datos semiestructurados (preferencias de UI, payloads de auditoría) usan `JSONB`.

---

## 2. Tablas

### `app_settings`
Configuración global de la aplicación gestionada por administradores.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `key` | `VARCHAR(100)` | NO | — | Clave única de configuración (PK natural) |
| `value` | `TEXT` | NO | — | Valor de la configuración (texto o JSON serializado) |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |
| `updated_by` | `INT` | SÍ | — | ID del usuario que actualizó el ajuste (ref. lógica a `glpi_users.id`) |

- **Índices:**
  - `app_settings_pkey`: `PRIMARY KEY (key)`

---

### `user_preferences`
Preferencias de interfaz y filtros guardados por técnico/usuario.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `user_id` | `INT` | NO | — | ID de usuario de GLPI (`glpi_users.id`, PK lógica) |
| `prefs` | `JSONB` | NO | `'{}'::jsonb` | Objeto JSON con preferencias de vistas y filtros |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |

- **Índices:**
  - `user_preferences_pkey`: `PRIMARY KEY (user_id)`

---

### `audit_log`
Registro inmutable de auditoría para acciones operativas (cambios de estado, asignaciones, soluciones).

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `id` | `BIGINT` | NO | `GENERATED ALWAYS AS IDENTITY` | Identificador único secuencial inmutable (PK) |
| `user_id` | `INT` | NO | — | ID del usuario/técnico que ejecutó la acción (`glpi_users.id`) |
| `action` | `VARCHAR(100)` | NO | — | Código de la acción (ej. `CLAIM_TICKET`, `UPDATE_STATUS`) |
| `ticket_id` | `INT` | SÍ | `NULL` | ID del ticket sobre el que operó (`glpi_tickets.id`), si aplica |
| `details` | `JSONB` | SÍ | `NULL` | Detalles contextuales de la operación (estado previo/nuevo, etc.) |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp exacto del evento |

- **Índices:**
  - `audit_log_pkey`: `PRIMARY KEY (id)`
  - `idx_audit_log_user_created`: `(user_id, created_at)`
  - `idx_audit_log_ticket_id`: `(ticket_id) WHERE ticket_id IS NOT NULL` (índice parcial)
  - `idx_audit_log_action`: `(action)`

---

### `revoked_tokens`
Lista negra de identificadores de tokens JWT revocados antes de su expiración natural. Utilizada activamente por el endpoint `POST /api/auth/logout` y validada en `JwtBearerEvents.OnTokenValidated`.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `jti` | `VARCHAR(64)` | NO | — | Identificador único del JWT (`jti` claim, PK) |
| `user_id` | `INT` | NO | — | ID del usuario propietario del token (`glpi_users.id`) |
| `revoked_at` | `TIMESTAMPTZ` | NO | `NOW()` | Momento en el que se revocó el token |
| `expires_at` | `TIMESTAMPTZ` | NO | — | Expiración natural del token (permite depuración periódica) |

- **Índices:**
  - `revoked_tokens_pkey`: `PRIMARY KEY (jti)`
  - `idx_revoked_tokens_expires_at`: `(expires_at)`
- **Mantenimiento:** El servicio en segundo plano `RevokedTokenCleanupService` ejecuta `PurgeExpiredAsync()` cada hora eliminando registros con `expires_at < NOW()`.

---

### `role_profile_mapping`
Mapeo de perfiles de GLPI (`glpi_profiles.id`) hacia los roles canónicos de la aplicación (`technician`, `supervisor`, `admin`).

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `glpi_profile_id` | `INT` | NO | — | ID del perfil en GLPI (`glpi_profiles.id`, PK) |
| `app_role` | `TEXT` | NO | — | Rol asignado (`technician`, `supervisor`, `admin`) con `CHECK` |
| `notes` | `TEXT` | SÍ | — | Notas explicativas del perfil mapeado |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |

- **Índices:**
  - `role_profile_mapping_pkey`: `PRIMARY KEY (glpi_profile_id)`

---

### `user_role_overrides`
Overrides individuales de rol para elevar o redefinir permisos de usuarios sin alterar GLPI.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `user_id` | `INT` | NO | — | ID del usuario (`glpi_users.id`, PK lógica) |
| `app_role` | `TEXT` | NO | — | Rol forzado (`technician`, `supervisor`, `admin`) con `CHECK` |
| `granted_by` | `INT` | NO | — | ID del usuario administrador que otorgó el rol |
| `granted_at` | `TIMESTAMPTZ` | NO | `NOW()` | Momento en el que se otorgó el override |
| `reason` | `TEXT` | SÍ | — | Justificación administrativa del override |

- **Índices:**
  - `user_role_overrides_pkey`: `PRIMARY KEY (user_id)`
  - `idx_user_role_overrides_user`: `(user_id)`

---

## 3. Inicialización y Migraciones

- Las migraciones residen en el directorio `db/migrations/`:
  - `001_init.sql`: Configuración inicial, auditoría y preferencias.
  - `002_revoked_tokens.sql`: Blacklist de tokens JWT revocados.
  - `003_roles.sql`: Mapeo de perfiles GLPI y overrides individuales de roles.
- En Docker Compose, se montan en `/docker-entrypoint-initdb.d:ro`, aplicándose automáticamente por orden léxico en el arranque inicial del contenedor `app-db`.
- Todas las sentencias DDL utilizan `IF NOT EXISTS` para garantizar idempotencia.
