# Preferences module

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-02-MOD-PREFERENCES | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


- **Layer:** `GlpiTicketManager.Application` + `GlpiTicketManager.Api`
- **Writes/Reads via:** PostgreSQL + Dapper (`IUserPreferencesRepository`)
- **Storage:** Tabla `user_preferences` en `app-db` (PostgreSQL)
- **Auth:** API-issued JWT (`ClaimsPrincipal.GetUserId()`)

## Purpose

Permite a los usuarios guardar y recuperar sus preferencias de interfaz (UI), tales como tema visual, idioma, filtros predeterminados o configuraciones de vista, de forma desacoplada de la base de datos de GLPI.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/preferences` | JWT | Obtiene las preferencias del usuario autenticado |
| `PUT` | `/api/preferences` | JWT | Actualiza o inserta (upsert) las preferencias del usuario |

Documentación interactiva disponible en **Scalar** (`/scalar/v1`) y especificación OpenAPI en `/openapi/v1.json`.

## Modelo de Datos

PostgreSQL almacena las preferencias en la tabla `user_preferences`:

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id     INT PRIMARY KEY,
    prefs       JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- **`user_id`**: Identificador entero del usuario en GLPI (obtenido del claim `sub` / `nameid` en el JWT).
- **`prefs`**: Columna `JSONB` en PostgreSQL. En la capa de aplicación y DTO se transporta como `string` JSON para flexibilidad total en el cliente sin requerir migraciones de esquema por cada nuevo ajuste de UI.
- **`updated_at`**: Marca temporal en UTC actualizada automáticamente en cada upsert (`NOW()`).

## Contrato y Validación

### GET `/api/preferences`
- Si el usuario no tiene preferencias guardadas en la base de datos, el endpoint devuelve status `200 OK` con defaults:
  ```json
  {
    "prefs": "{}"
  }
  ```
- Si existen preferencias, devuelve `200 OK` con el contenido JSON guardado:
  ```json
  {
    "prefs": "{\"theme\":\"dark\",\"lang\":\"es\"}"
  }
  ```

### PUT `/api/preferences`
Payload:
```json
{
  "prefs": "{\"theme\":\"dark\",\"lang\":\"es\"}"
}
```

Reglas de validación:
1. **No vacío**: `prefs` no puede ser nulo o espacios en blanco (`ValidationException`).
2. **Límite de tamaño**: `prefs` no puede superar los 8 KB (8192 caracteres).
3. **Sintaxis JSON válida**: `prefs` debe ser parseable como JSON (`System.Text.Json.JsonDocument.Parse`). Si no es válido, se lanza `ValidationException` (mapeada a HTTP 400 por `GlobalExceptionHandler`).
4. **Respuesta**: HTTP `204 NoContent` en caso de éxito tras ejecutar un `UPSERT` atómico (`ON CONFLICT (user_id) DO UPDATE`).

## UI

- **Ruta:** `/preferences` (`PreferencesPage.tsx`)
- **Navegación:** Enlace "Preferencias" en el menú de navegación (`AppLayout.tsx`).
- **Campos configurables:**
  1. **Tema (`theme`):** Claro (`light`) u Oscuro (`dark`). Default: `light`.
  2. **Densidad (`density`):** Cómoda (`comfortable`) o Compacta (`compact`). Default: `comfortable`.
- **Persistencia:** Al presionar "Guardar", se envían las opciones serializadas vía `PUT /api/preferences` con el hook `useUpdatePreferencesMutation`. Las preferencias se leen con `usePreferencesQuery`.
- **Aplicación de atributo `data-theme`:** Se establece el atributo `data-theme` en el elemento raíz `<html>` (`document.documentElement.setAttribute('data-theme', theme)`). Nota: No altera reglas de CSS en esta versión (dark mode completo es una característica futura), pero el atributo está presente y activo tanto al guardar como al recargar la app.

## Archivos Relacionados

- Entidad: `src/GlpiTicketManager.Domain/Entities/UserPreference.cs`
- DTOs: `src/GlpiTicketManager.Application/Dtos/Preferences/`
- Abstracción: `src/GlpiTicketManager.Application/Abstractions/IUserPreferencesRepository.cs`
- Repositorio Dapper: `src/GlpiTicketManager.Infrastructure/Repositories/UserPreferencesRepository.cs`
- Endpoints: `src/GlpiTicketManager.Api/Endpoints/PreferencesEndpoints.cs`
- UI Page: `frontend/src/features/preferences/PreferencesPage.tsx`
- Hooks: `frontend/src/hooks/usePreferences.ts`
- Tests E2E:
  - `frontend/tests/e2e/preferences.spec.ts` (API directa)
  - `frontend/tests/e2e/preferences-ui.spec.ts` (flujo UI completo)
