# Estrategia Integral de Testing y Aseguramiento de Calidad

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-13-TEST-STRATEGY | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Pirámide de Testing

La estrategia de aseguramiento de calidad del proyecto implementa múltiples niveles de verificación automatizada:

```
          /\
         /  \    E2E Tests (Playwright - 26 tests)
        /----\
       /      \   Integration Tests (xUnit + WebApplicationFactory - 45 tests)
      /--------\
     /          \  Unit Tests (.NET xUnit - 19 tests)
    /------------\
```

## 2. Tipos de Pruebas

### 2.1 Pruebas Unitarias (Backend)
- **Framework:** xUnit, FluentAssertions, Moq.
- **Ubicación:** `tests/GlpiTicketManager.Application.Tests`
- **Alcance:** Lógica de negocio pura, validadores, mapeos de DTOs, cálculos de SLA y algoritmos de autorización.
- **Ejecución:** En memoria, sin dependencias de base de datos ni red.

### 2.2 Pruebas de Integración (Backend)
- **Framework:** `Microsoft.AspNetCore.Mvc.Testing` (`CustomWebApplicationFactory`).
- **Ubicación:** `tests/GlpiTicketManager.Api.Integration.Tests`
- **Alcance:** Endpoints HTTP completos, autenticación JWT, políticas de autorización grupal, persistencia con PostgreSQL y concurrencia.
- **Suites Clave:**
  - `ConcurrencyTests`: Valida comportamiento ante reclamos concurrentes (HTTP 200 vs HTTP 409).
  - `FollowupPrivacyTests`: Garantiza que notas privadas nunca se filtren a roles no autorizados (H-08).
  - `ReopenTests`: Valida ciclo completo de reapertura y preservación de estados (ADR-019).
  - `TicketWorkflowTests`: Transiciones de ciclo de vida de tickets y validación de solución (H-24).

### 2.3 Pruebas End-to-End (Frontend & E2E)
- **Framework:** Playwright con TypeScript.
- **Ubicación:** `frontend/tests/e2e`
- **Alcance:** Flujos de usuario completos en navegador real (desktop y mobile viewport), gestos táctiles, arrastre de tarjetas en Kanban, validaciones de formularios y sincronización en tiempo real vía SignalR.

## 3. Criterios de Aceptación en CI/CD

Ningún código se integra a `main` si no cumple con:
1. `dotnet build` sin errores ni warnings críticos.
2. 100% de tests unitarios e integración aprobados (`dotnet test`).
3. Verificación de tipos en frontend (`pnpm typecheck` o `tsc --noEmit`).
4. 100% de tests E2E aprobados en Playwright.
5. Análisis estático de secretos limpio con Gitleaks.
6. Un test E2E que solo pasa tras reintento (flaky) cuenta como fallo: `failOnFlakyTests` está activo cuando `CI=true`.

## 4. Observabilidad del E2E en CI (H-41)

El job `e2e` de `.github/workflows/ci.yml` publica **siempre** (`if: always()`) el artifact `playwright-e2e-artifacts` (retención 7 días). El paso falla si el artifact queda vacío (`if-no-files-found: error`).

| Ruta dentro del artifact | Contenido |
|---|---|
| `playwright-report/index.html` | Reporte HTML de Playwright (`open: 'never'`) |
| `test-results/results.json` | Resultado JSON, incluye intento (`retry`) de cada test |
| `test-results/junit.xml` | Resultado JUnit |
| `test-results/<test>/trace.zip` | Trace por intento fallido (`trace: 'retain-on-failure'`); también screenshot y video |
| `logs/{frontend,api,glpi,app-db}.log` | Logs completos con timestamps de cada servicio de `docker compose` |
| `logs/compose-ps.txt` | Estado de los contenedores |

Cómo leerlo: descargar el artifact desde la página del run, abrir un trace con `pnpm exec playwright show-trace test-results/<test>/trace.zip` (o `playwright-report/index.html`) y correlacionar la hora del fallo con `logs/api.log` y `logs/frontend.log` (Vite).

El job e2e se fija a `ubuntu-24.04` (resto de jobs en `ubuntu-latest`) para descartar la migración de `ubuntu-latest` como variable, y tiene `timeout-minutes: 25`.