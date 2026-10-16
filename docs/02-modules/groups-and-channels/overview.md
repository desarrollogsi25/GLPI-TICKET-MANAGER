# Módulo de Grupos y Canales (Groups & Channels)

## Descripción
El módulo de grupos y canales expone catálogos maestros leídos directamente desde el esquema de GLPI en MariaDB para alimentar los selectores de colas, filtros y canales de entrada en la interfaz de usuario.

Ambos endpoints son dinámicos y reflejan en tiempo real cualquier cambio realizado en la base de datos o en la interfaz administrativa de GLPI.

---

## Origen de Datos

| Catálogo | Tabla GLPI | Filtros de Negocio | DTO Expuesto |
|---|---|---|---|
| **Grupos de Técnicos** | `glpi_groups` | `entities_id = @EntityId AND is_assign = 1` | `GroupDto(int Id, string Name)` |
| **Canales de Entrada** | `glpi_requesttypes` | `is_active = 1` | `ChannelDto(int Id, string Name)` |

---

## Endpoints

### 1. `GET /api/groups`
- **Autenticación**: Requerida (Bearer JWT).
- **Parámetros**: Derivados del token JWT (`entity_id` del usuario autenticado; default 0).
- **Regla de negocio**:
  - Filtra por la entidad asignada al usuario.
  - Excluye grupos que no puedan recibir asignación de tickets (`is_assign = 0`).
  - Ordena alfabéticamente por `name ASC`.
- **Respuesta (200 OK)**:
  ```json
  [
    { "id": 1, "name": "Call Center" },
    { "id": 2, "name": "Soporte Nivel 1" }
  ]
  ```

### 2. `GET /api/channels`
- **Autenticación**: Requerida (Bearer JWT).
- **Regla de negocio**:
  - Devuelve todos los canales con `is_active = 1`.
  - Canales desactivados por administradores en GLPI son excluidos automáticamente.
  - Ordena alfabéticamente por `name ASC`.
- **Respuesta (200 OK)**:
  ```json
  [
    { "id": 4, "name": "Direct" },
    { "id": 2, "name": "E-Mail" },
    { "id": 1, "name": "Helpdesk" },
    { "id": 6, "name": "Other" },
    { "id": 3, "name": "Phone" },
    { "id": 5, "name": "Written" }
  ]
  ```

---

## Sincronización con GLPI
- La lectura se ejecuta directamente sobre las tablas maestras de MariaDB mediante Dapper (`GroupRepository` y `ChannelRepository`).
- No existe almacenamiento intermedio ni caché estática en el backend.
- En el frontend, React Query utiliza un `staleTime` de 5 minutos para evitar consultas redundantes por navegación, pero se revalida al expirar o al invalidar explícitamente.
