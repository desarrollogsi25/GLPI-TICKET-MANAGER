# Arquitectura de Base de Datos

ISO Header: Database Architecture

## 1. Modelo de Doble Base de Datos

El sistema implementa una **arquitectura de doble base de datos** para desacoplar el core monolítico de GLPI de los datos operativos y administrativos del sistema propio ([ADR-012](../01-architecture/decisions/ADR-012-postgresql-for-own-data.md)).

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     MariaDB 10.11 (glpi-db)     │       │     PostgreSQL 16 (app-db)      │
│         Puerto: 3306            │       │          Puerto: 5432           │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ Tablas GLPI:                    │       │ Tablas Propias del Sistema:     │
│ - glpi_tickets                  │       │ - app_settings                  │
│ - glpi_tickets_users            │       │ - user_preferences             │
│ - glpi_groups_tickets           │       │ - audit_log                     │
│ - glpi_itilsolutions            │       │ - revoked_tokens                │
│ - glpi_itilfollowups            │       │                                 │
│ - glpi_users                    │       │                                 │
│ - glpi_groups                   │       │                                 │
│ - glpi_groups_users             │       │                                 │
│ - glpi_itilcategories           │       │                                 │
│ - glpi_requesttypes             │       │                                 │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

---

## 2. Regla de Oro

> **Un dato vive en una base de datos, nunca en dos.**
> No existe replicación de datos, sincronización en segundo plano ni procesos ETL entre motores.
> Toda referencia entre MariaDB y PostgreSQL es una **clave foránea lógica** gestionada a nivel de código de aplicación (ej. `user_id INT` en `audit_log` referencia `glpi_users.id` en MariaDB).

---

## 3. Responsabilidades por Motor

### MariaDB (`glpi`)
- **Motor oficial de GLPI 11.**
- Almacena tickets, técnicos, usuarios, grupos, soluciones, seguimientos y catálogo de servicios.
- **Acceso:**
  - *Lectura*: Directa vía SQL con Dapper (`MySqlConnector`) para máximo rendimiento.
  - *Escritura*: Híbrida conforme a [ADR-017](../01-architecture/decisions/ADR-017-glpi-write-strategy.md):
    - Estados (`PATCH /status`) y soluciones (`POST /solutions`): vía API REST de GLPI (`apirest.php`) para preservar eventos, notificaciones y reglas nativas.
    - Asignación atómica (`POST /claim`): vía SQL directo transaccional condicional en MariaDB para garantizar prevención estricta de condiciones de carrera entre técnicos.

### PostgreSQL (`glpi_ticket_manager`)
- **Motor propio del gestor de tickets.**
- Almacena configuración global, preferencias de UI/filtros por usuario, log inmutable de auditoría y revocación de JWTs.
- **Acceso:**
  - *Lectura y Escritura*: Directa vía SQL con Dapper (`Npgsql`).
  - Utiliza el estándar SQL moderno `BIGINT GENERATED ALWAYS AS IDENTITY` para PKs autogeneradas.
  - Documentación detallada del esquema: [postgresql-schema.md](postgresql-schema.md).
