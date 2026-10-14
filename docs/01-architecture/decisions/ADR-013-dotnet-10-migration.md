# ADR-013: Migración de .NET 9 a .NET 10 (LTS)

- **Status:** Accepted
- **Date:** 2026-10-14
- **Related:** ADR-002, ADR-009, ADR-012

## Contexto

El backend del sistema propio fue construido inicialmente utilizando .NET 9 como Target Framework (`net9.0`). .NET 9 es una versión de soporte a corto plazo (*Standard Term Support - STS*), cuyo ciclo de vida oficial finaliza en noviembre de 2026 (18 meses de soporte).

El cliente y la dirección técnica solicitaron formalmente migrar la plataforma a **.NET 10**, versión con soporte a largo plazo (*Long Term Support - LTS*), cuyo ciclo de mantenimiento y parches de seguridad se extiende durante 3 años, hasta noviembre de 2028.

## Decisión

Migrar todos los proyectos de la solución a `net10.0`:

1. **Configuración de SDK (`global.json`)**:
   - Fijar la versión del SDK en `10.0.100` (con rollForward compatible).
2. **Proyectos C#**:
   - Actualizar `<TargetFramework>net10.0</TargetFramework>` en los 5 proyectos:
     * `GlpiTicketManager.Domain`
     * `GlpiTicketManager.Application`
     * `GlpiTicketManager.Infrastructure`
     * `GlpiTicketManager.Api`
     * `GlpiTicketManager.Tests`
3. **Contenedores Docker**:
   - Actualizar `Dockerfile`: imágenes base `mcr.microsoft.com/dotnet/sdk:10.0` y `mcr.microsoft.com/dotnet/aspnet:10.0-alpine`.
4. **Pipeline CI/CD**:
   - Actualizar `.github/workflows/ci.yml`: `dotnet-version: '10.0.x'`.
5. **Ecosistema de paquetes NuGet**:
   - Actualizar librerías clave compatibles con .NET 10:
     * `Serilog.AspNetCore` / `Serilog` (versión 10.x)
     * `Npgsql` (10.x)
     * `Scalar.AspNetCore` (2.x)
     * `MySqlConnector` (2.5.0+)

## Motivos

- **Soporte extendido LTS**: Cobertura garantizada hasta noviembre de 2028 frente al vencimiento prematuro de .NET 9 en noviembre de 2026.
- **Rendimiento mejorado**: Optimizaciones en RyuJIT, serialización JSON nativa y asignaciones de memoria en Minimal APIs.
- **Bajo impacto de incompatibilidad**: La superficie de cambios entre ASP.NET Core 9 y 10 es mínima para arquitecturas basadas en Minimal APIs y Dapper.
  * El método de extensión `.WithOpenApi()` se marca como deprecado en favor del soporte OpenAPI nativo de ASP.NET Core (`AddOpenApi()` / `MapOpenApi()`), el cual nuestro proyecto ya utiliza desde su diseño base.

## Consecuencias

- **Plan de ejecución**: La migración a .NET 10 se ejecutará como parte inicial del Bloque 2, antes de la remoción de endpoints y DTOs de creación de tickets.
- **Verificación**: Los 20 tests unitarios xUnit y los tests E2E deben continuar ejecutándose en verde sin advertencias de compilación ni fallas de regresión.
- **Riesgo y mitigación**: Verificar que no existan llamadas heredadas a `.WithOpenApi()`.

## Referencias

- Requerimiento confirmado por el cliente y dirección el 2026-10-14.
