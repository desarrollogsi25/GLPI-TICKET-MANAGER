# Rate Limiting y Control de Consumo de Recursos (OWASP API4)

Este documento describe la arquitectura, configuración y estrategias de prueba del subsistema de rate limiting en GLPI Ticket Manager, diseñado para mitigar ataques de denegación de servicio (DoS) y consumo indiscriminado de recursos computacionales (OWASP API4: Unrestricted Resource Consumption).

---

## 1. Políticas de Rate Limiting

El sistema implementa limitación de tasa nativa de .NET 9 (`Microsoft.AspNetCore.RateLimiting`) con tres políticas diferenciadas según la criticidad y costo computacional de los endpoints:

| Política | Algoritmo | Parámetro por Defecto (Producción) | Clave de Partición | Endpoints Protegidos |
| :--- | :--- | :--- | :--- | :--- |
| **`login`** | Fixed Window | 5 intentos / 1 min (`QueueLimit = 0`) | Dirección IP remota | `POST /api/auth/login` |
| **`per-user`** | Fixed Window | 100 requests / 1 min (`QueueLimit = 0`) | `userId:ip` | Rutas generales autenticadas (`/api/tickets`, `/api/preferences`, etc.) |
| **`expensive`** | Token Bucket | 20 tokens de capacidad, 1 token / 3s (`QueueLimit = 0`) | `userId` | Consultas pesadas de agregación: `GET /api/dashboard/stats`, `GET /api/tickets/by-group` |

> [!IMPORTANT]
> **Regla de QueueLimit = 0**:
> Todas las políticas mantienen `QueueLimit = 0`. Las peticiones que excedan el límite son rechazadas de inmediato con código HTTP `429 Too Many Requests`. No se encolan peticiones para evitar consumo excesivo de memoria del servidor.

---

## 2. Estrategia por Entorno

Para permitir pruebas continuas y suites automatizadas de alto volumen sin comprometer la seguridad en producción, las políticas son configurables por entorno:

### Producción (`appsettings.json`)
Límites estrictos que protegen el backend y la base de datos GLPI de saturación:
```json
{
  "RateLimiting": {
    "ExpensiveTokenLimit": 20,
    "ExpensiveTokensPerPeriod": 1,
    "ExpensiveReplenishmentSeconds": 3,
    "PerUserRequestLimit": 100,
    "LoginAttemptLimit": 5
  }
}
```

### Desarrollo (`appsettings.Development.json`)
El límite de la política `expensive` se eleva a 200 tokens para permitir que las pruebas funcionales y la suite E2E de Playwright ejecuten flujos completos sin colisiones de cuota:
```json
{
  "RateLimiting": {
    "ExpensiveTokenLimit": 200
  }
}
```
*Nota: Solo se sobreescribe el límite de tokens costosos; el resto de parámetros y `QueueLimit = 0` se heredan de la configuración base.*

---

## 3. Configuración en Código

Las opciones se modelan en `RateLimitOptions` (`src/GlpiTicketManager.Api/RateLimiting/RateLimitPolicies.cs`):

```csharp
public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimiting";

    public int ExpensiveTokenLimit { get; set; } = 20;
    public int ExpensiveTokensPerPeriod { get; set; } = 1;
    public int ExpensiveReplenishmentSeconds { get; set; } = 3;
    public int PerUserRequestLimit { get; set; } = 100;
    public int LoginAttemptLimit { get; set; } = 5;
}
```

En `Program.cs`, el middleware se configura leyendo dinámicamente de `IConfiguration`:

```csharp
builder.Services.AddRateLimiter(options =>
{
    var rateLimitOptions = builder.Configuration
        .GetSection(RateLimitOptions.SectionName)
        .Get<RateLimitOptions>() ?? new RateLimitOptions();

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Configuración de políticas login, per-user y expensive...
});
```

---

## 4. Pruebas y Validación

### Tests de Integración (`RateLimitingTests.cs`)
Los tests en `tests/GlpiTicketManager.Api.Integration.Tests` **no dependen de archivos de configuración externos**. Utilizan `WithWebHostBuilder` y colecciones en memoria para inyectar explícitamente los límites que van a validar:

1. **`DashboardStats_After20Requests_Returns429`**:
   - Sobrescribe `ExpensiveTokenLimit = 20` y `ExpensiveReplenishmentSeconds = 3`.
   - Realiza 21 llamadas consecutivas a `/api/dashboard/stats`.
   - Valida que las primeras 20 llamadas retornan `200 OK` y la petición número 21 retorna `429 Too Many Requests`.

2. **`Tickets_After100Requests_Returns429`**:
   - Sobrescribe `PerUserRequestLimit = 100`.
   - Realiza 101 llamadas consecutivas a `/api/tickets`.
   - Valida que las primeras 100 llamadas retornan `200 OK` y la petición número 101 retorna `429 Too Many Requests`.

### Pruebas E2E (Playwright)
Corren contra el entorno `Development` (capacidad de 200 tokens). La desacoplación del badge del layout garantiza que navegar entre pantallas no consuma tokens de la política `expensive`.
