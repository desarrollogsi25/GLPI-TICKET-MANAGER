# ADR-012: Arquitectura de doble base de datos — MariaDB para GLPI y PostgreSQL para datos propios

- **Status:** Accepted (confirmado por el jefe el 2026-10-14)
- **Date:** 2026-10-14
- **Related:** ADR-002, ADR-009, ADR-011, ADR-013

## Contexto

El responsable del área ("el jefe") solicitó incorporar **PostgreSQL** para la persistencia del sistema propio. Sin embargo, GLPI es una aplicación PHP monolítica que requiere estrictamente MySQL o MariaDB como motor relacional subyacente. Migrar GLPI a PostgreSQL no es viable ni está soportado oficialmente por Teclib/GLPI.

Al mismo tiempo, el sistema propio requiere almacenar datos operativos y de control que no pertenecen al esquema de GLPI y que no deben contaminar las tablas `glpi_*`.

## Decisión

Adoptar una **arquitectura de dos bases de datos complementarias**:

1. **MariaDB (`glpi-db`, puerto 3306)**:
   - Contiene la base de datos de GLPI (`glpi`).
   - Almacena las entidades nativas del negocio: `glpi_tickets`, `glpi_tickets_users`, `glpi_groups_tickets`, `glpi_itilsolutions`, `glpi_itilfollowups`, `glpi_users`, `glpi_groups`, `glpi_groups_users`, `glpi_itilcategories`, `glpi_requesttypes`.
2. **PostgreSQL (`app-db`, puerto 5432)**:
   - Contiene la base de datos propia del sistema (`glpi_ticket_manager`).
   - Almacena exclusivamente los datos propios del sistema en 4 tablas:
     1. `app_settings`: configuración global de la aplicación (clave primaria natural: `key varchar(100)`).
     2. `user_preferences`: preferencias individuales por técnico (clave primaria natural/lógica: `user_id int`).
     3. `audit_log`: registro inmutable de auditoría (clave primaria auto-incremental: `id BIGINT GENERATED ALWAYS AS IDENTITY`).
     4. `revoked_tokens`: lista de tokens JWT revocados (clave primaria natural: `jti varchar(64)`).

### Claves primarias auto-incrementales: BIGINT GENERATED ALWAYS AS IDENTITY

En `audit_log` (y cualquier futura tabla con clave subrogada auto-incremental) se utiliza estrictamente el estándar SQL moderno:
```sql
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

**Nota técnica:**
- `BIGINT GENERATED ALWAYS AS IDENTITY` es el estándar SQL oficial adoptado por PostgreSQL desde la versión 10+.
- Los tipos pseudoclasificados `SERIAL` y `BIGSERIAL` son constructores legacy, propietarios y no estándar, propensos a inconsistencias de permisos y secuencias desvinculadas (bugs de ownership de secuencia al truncar o migrar tablas).
- La cláusula `ALWAYS` previene inserciones manuales accidentales, garantizando la inmutabilidad y secuencialidad estricta del registro de auditoría.
- **Costo de almacenamiento:** en arquitecturas de 64 bits con alineación de memoria (padding) de PostgreSQL, una columna `BIGINT` a menudo ocupa efectivamente el mismo espacio alineado en tupla que un `INT`, eliminando cualquier riesgo de agotamiento de identificadores a 2.14 mil millones de eventos.

### Tipo de dato para referencias a usuarios: `user_preferences.user_id INT`

El tipo de columna para `user_preferences.user_id` (y cualquier campo de referencia a usuarios como `audit_log.user_id`) se define estrictamente como **`INT`** (no `BIGINT`).

**Nota técnica de consistencia de tipos:**
- El tipo de `user_id` es `INT` porque debe coincidir exactamente con `glpi_users.id` en MariaDB (que es `INT`).
- Mantener la consistencia de tipos en claves foráneas lógicas evita conversiones implícitas en consultas y operaciones de cruce (JOIN en memoria o aplicación), lo cual beneficia directamente el rendimiento.
- Esta consistencia de tipos es más importante que la preparación para un crecimiento sobredimensionado que no ocurrirá (el número de usuarios y técnicos está acotado por la organización en GLPI).
- La regla general de utilizar `BIGINT GENERATED ALWAYS AS IDENTITY` para **claves primarias subrogadas autogeneradas** (como `audit_log.id`) sigue siendo plenamente válida.

### Regla de oro

> **Un dato vive en una base de datos, nunca en dos.**
> No existe replicación de datos, sincronización en segundo plano ni ETL entre MariaDB y PostgreSQL.
> Las referencias cruzadas (como `user_id` o `ticket_id` en `audit_log` o `user_preferences`) son **referencias lógicas** a las claves primarias de MariaDB (`glpi_users.id`, `glpi_tickets.id`). No existen Foreign Keys a nivel de motor entre bases de datos.

### Schema final (2026-10-14)

Definición real implementada en `db/migrations/001_init.sql`:

#### `audit_log`
- `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `user_id`: `INT NOT NULL` (referencia lógica a `glpi_users.id`)
- `action`: `VARCHAR(100) NOT NULL` — limitado porque los valores corresponden a un enum corto de acciones operativas
- `ticket_id`: `INT` (nullable, referencia lógica a `glpi_tickets.id`)
- `details`: `JSONB` (flexible, permite agregar contexto sin requerir migraciones DDL por cada campo nuevo)
- `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Índices:** `(user_id, created_at)`, `(ticket_id)` parcial donde no es nulo, `(action)`.

*Notas de diseño:*
- La columna `ip inet` fue diferida al backlog (no es crítica para la funcionalidad inicial del MVP).
- El campo `metadata` se renombró a `details` por consistencia con la terminología del equipo.

#### `user_preferences`
- `user_id`: `INT PRIMARY KEY` (referencia lógica a `glpi_users.id` — mismo tipo entero para evitar conversiones implícitas)
- `prefs`: `JSONB NOT NULL DEFAULT '{}'::jsonb`
- `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `app_settings`
- `key`: `VARCHAR(100) PRIMARY KEY`
- `value`: `TEXT NOT NULL`
- `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_by`: `INT` (nullable, referencia lógica a `glpi_users.id`, añadido en migración 002)

#### `revoked_tokens`
- `jti`: `VARCHAR(64) PRIMARY KEY`
- `user_id`: `INT NOT NULL`
- `revoked_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `expires_at`: `TIMESTAMPTZ NOT NULL`
- **Índices:** `(expires_at)`.

> [!NOTE]
> **Desviaciones respecto al diseño inicial:** `action` se limitó a `varchar(100)`, `metadata` se renombró a `details`, `ip` se difirió al backlog. Todas son decisiones de diseño deliberadas que mejoran la coherencia o reducen la superficie inicial del MVP.

### Stack técnico

- **Acceso a datos**: Dapper + `Npgsql` para PostgreSQL; Dapper + `MySqlConnector` para MariaDB.
- **Sin EF Core**: Se mantiene la consistencia con el acceso de alto rendimiento y consultas explícitas ya implementadas con Dapper.
- **Sin Redis**: `revoked_tokens` y configuraciones globales residen directamente en PostgreSQL con índices adecuados.

## Alternativas rechazadas

- **Migrar GLPI completo a PostgreSQL**: Inviable técnicamente. GLPI 11 no ofrece soporte para PostgreSQL en su capa PDO/DBAL.
- **Almacenar todo en MariaDB**: Rechazada. Contradice la directriz explícita de dirección de utilizar PostgreSQL para el desarrollo propio y mezclaría esquemas ajenos con el core de GLPI.
- **Entity Framework Core para PostgreSQL y Dapper para MariaDB**: Rechazada. Introduciría dualidad de paradigmas ORM vs Micro-ORM innecesaria; Dapper satisface completamente ambos escenarios de forma uniforme y ligera.

## Consecuencias

- **Positivas**:
  - Separación limpia de responsabilidades: el esquema de GLPI se mantiene intocado e íntegro ante futuras actualizaciones de GLPI 11.
  - Datos de auditoría y configuración protegidos bajo el motor preferido por la organización (PostgreSQL).
  - Adopción estricta de estándares SQL modernos (`IDENTITY`) sin dependencia de tipos legacy `SERIAL`.
  - Alto rendimiento sin sobrecarga de capas complejas.
- **Negativas / Compromisos**:
  - Infraestructura ampliada: adición del servicio `app-db` (imagen `postgres:16-alpine`) en `docker-compose.yml`.
  - La API .NET 10 gestiona dos cadenas de conexión y dos factorías de conexión (`IDbConnection`).
  - Estrategia de respaldos (`backup`) separada: volcado lógico de MariaDB (`mariadb-dump`) y de PostgreSQL (`pg_dump`).
