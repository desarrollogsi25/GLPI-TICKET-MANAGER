# Authentication and JWT Revocation

- **Layer:** `GlpiTicketManager.Api` + `GlpiTicketManager.Infrastructure`
- **Identity Provider:** Credenciales verificadas contra base de datos GLPI (`glpi_users`).
- **Token Format:** JWT (HMAC-SHA256, expiración configurada en `Jwt:ExpiryMinutes`).
- **Storage de Revocación:** Tabla `revoked_tokens` en `app-db` (PostgreSQL).

## 1. Arquitectura de Tokens

El sistema emite sus propios tokens JWT independientes de GLPI para las peticiones del frontend:
- **`sub`**: Identificador entero del usuario en GLPI (`user.UserId`).
- **`jti`**: UUID v4 único generado para cada token en login (`Guid.NewGuid().ToString()`).
- **`exp`**: Timestamp Unix UTC de expiración del token.
- **Claims adicionales**: `unique_name`, `name`, `display_name`, `profile_id`, `entity_id`.

> [!NOTE]
> No se utilizan refresh tokens en la versión actual. La expiración natural del token o el cierre explícito de sesión invalidan el acceso.

## 2. Flujo de Login (`POST /api/auth/login`)

1. El usuario envía credenciales `{ "username": "...", "password": "..." }`.
2. `IAuthService` verifica el hash de contraseña en `glpi_users` (BCrypt).
3. `IJwtTokenService` firma el JWT con la clave simétrica (`Jwt:Key`).
4. Se devuelve `{ "accessToken": "...", "tokenType": "Bearer", "expiresAt": "...", "user": { ... } }`.

## 3. Validación y Control de Revocación (`OnTokenValidated`)

Cada petición a endpoints protegidos pasa por el middleware de autenticación JWT:
1. Se valida la firma del token, emisor, audiencia y tiempo de vida (`TokenValidationParameters`).
2. En el evento `JwtBearerEvents.OnTokenValidated`:
   - Se extrae el `jti` del token. Si no existe, se rechaza la petición (`context.Fail`).
   - Se consulta `IRevokedTokenRepository.IsRevokedAsync(jti)`.
   - Si el `jti` está registrado en `revoked_tokens`, se invoca `context.Fail("Token has been revoked.")`, devolviendo **HTTP 401 Unauthorized**.

## 4. Flujo de Logout (`POST /api/auth/logout`)

Endpoint autenticado (`RequireAuthorization`):
1. Extrae `jti`, `sub` y `exp` de los claims del usuario autenticado.
2. Convierte `exp` a `DateTime` UTC (`expires_at`).
3. Registra el token en la base de datos PostgreSQL:
   ```sql
   INSERT INTO revoked_tokens (jti, user_id, revoked_at, expires_at)
   VALUES (@Jti, @UserId, NOW(), @ExpiresAt)
   ON CONFLICT (jti) DO NOTHING;
   ```
4. Devuelve **HTTP 204 NoContent**.
5. Cualquier intento posterior de reutilizar el mismo token es bloqueado con **HTTP 401** por `OnTokenValidated`.

## 5. Mantenimiento y Purga Automática (`RevokedTokenCleanupService`)

Para evitar el crecimiento indefinido de la tabla `revoked_tokens`:
- `RevokedTokenCleanupService` se ejecuta como un `BackgroundService` en el contenedor `glpi-api`.
- Se ejecuta al arrancar y posteriormente en intervalos de **1 hora** (`TimeSpan.FromHours(1)`).
- Ejecuta `IRevokedTokenRepository.PurgeExpiredAsync()`, eliminando los registros cuya fecha `expires_at < NOW()`, ya que dichos tokens ya han expirado naturalmente y serían rechazados por el validador estándar de JWT sin requerir chequeo en base de datos.
