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
