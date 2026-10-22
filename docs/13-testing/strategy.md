# Estrategia Integral de Testing y Aseguramiento de Calidad

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-13-TEST-STRATEGY | **Versión:** 1.1.0 | **Fecha:** 2026-10-22 | **Autor:** GLPI Ticket Manager Team

> **Enmienda 1.1.0 (2026-10-22 — BUG-032 / BUG-033).** Se actualizan las cifras
> verificadas de la pirámide de testing, se documentan las suites `RateLimitingTests`
> y `TicketPersistenceTests`, el spec E2E `kanban-polling.spec.ts`, la disciplina de
> verificación por mutación y la cobertura del typecheck sobre los specs E2E.

## 1. Pirámide de Testing

La estrategia de aseguramiento de calidad del proyecto implementa múltiples niveles de verificación automatizada:

```
          /\
         /  \    E2E Tests (Playwright - 36 tests en 25 specs)
        /----\
       /      \   Integration Tests (xUnit + WebApplicationFactory - 89 tests)
      /--------\
     /          \  Unit Tests (.NET xUnit - 25 tests)
    /------------\
```

> Cifras verificadas con `pnpm exec playwright test --list` (36 tests en 25 archivos) y
> con `dotnet test` en los tres proyectos (`Passed! - Failed: 0, Passed: 89` en
> integración, `Passed: 25` en unitarias).

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
  - `SolutionQueryTests`: Fija las invariantes del **SQL de producción** (`SolutionQueries.Exists`) frente al contrato del API: exige **contenido no vacío** y **ignora** las soluciones obsoletas (`status = 4`); **no** exige una longitud mínima. Evita la divergencia con el doble de pruebas (BUG-031).
  - `ResolveTests`: Cobertura del endpoint atómico `POST /api/tickets/{id}/resolve` (solución corta, contenido vacío/whitespace, ticket desconocido, sin permisos, ya resuelto/cerrado, doble envío → `409`, GLPI auto-resuelve → un único evento SignalR, cierre automático a `6`). 12 casos.
  - `RateLimitingTests` (BUG-032): fija el comportamiento de la política de rate limiting `Expensive`. Verifica (a) que la **cuota de producción no se puede subir silenciosamente** (fijador sobre `appsettings.json`: 20 tokens, 1 token cada 3 s ⇒ 20/min), (b) que la respuesta `429` incluye la cabecera `Retry-After` y un cuerpo `ProblemDetails` con `retryAfterSeconds`, y (c) que el bucket se repone según lo esperado. La cuota de **desarrollo** (`ExpensiveTokenLimit: 200`) es deliberadamente distinta y sólo aplica a `appsettings.Development.json`.
  - `TicketPersistenceTests` (BUG-032 / H-31): verifica que la confirmación de una transición de estado se lee de **GLPI** y no del modelo de lectura en MariaDB. El doble de prueba (`CustomWebApplicationFactory`) modela el estado de GLPI (`_glpiTicketStates`, `_glpiStatusOverrides`) **por separado** del modelo de lectura (`_allTickets`), de modo que se puede simular un desfase entre ambos y comprobar que el estado publicado por el API es el que GLPI confirma.

### 2.3 Pruebas End-to-End (Frontend & E2E)
- **Framework:** Playwright con TypeScript.
- **Ubicación:** `frontend/tests/e2e`
- **Alcance:** Flujos de usuario completos en navegador real (desktop y mobile viewport), gestos táctiles, arrastre de tarjetas en Kanban, validaciones de formularios y sincronización en tiempo real vía SignalR.
- **Suites Clave:**
  - `resolve-ticket.spec.ts`: Flujo UI de resolución con el diálogo (cierre y movimiento a la columna «Resuelto»).
  - `resolve-short-solution.spec.ts` (BUG-031): **Regresión contra el stack real (GLPI 11 + MariaDB)**. (1) Cadena legacy `POST /solutions` con contenido corto `"OK"` → `201` y `PATCH /status {status:5}` → **`204`** (antes era `422`). (2) Flujo UI con `POST /api/tickets/{id}/resolve` con `"OK"` → `200`, el modal se cierra y el ticket pasa a `Resuelto`. Se ejecuta contra SQL y GLPI reales, sin dobles.
  - `kanban-polling.spec.ts` (BUG-032 / H-32): **Regresión contra el polling excesivo.** Con la conexión SignalR en `connected`, el Kanban **no** debe consultar periódicamente `GET /api/tickets/by-group` (endpoint bajo la política `Expensive`, 20 req/min en producción). El spec cuenta las peticiones reales de red durante una ventana de observación de 20 s y exige `≤ 3` peticiones y `0` respuestas `429`. La ventana se implementa con `expect.poll` (sin `waitForTimeout`). Con el frontend en `HEAD` (polling cada 1,5 s) el spec **falla**: tiene dientes.

### 2.4 Disciplina de verificación (mutación)

Una prueba que no puede fallar no es una prueba. Toda regresión introducida para
proteger un defecto debe verificarse contra el código **defectuoso**, no sólo contra
el corregido. La comprobación se hace revirtiendo el fix y comprobando que la prueba
falla:

| Regresión | Comprobación de dientes | Resultado |
|---|---|---|
| `kanban-polling.spec.ts` | Frontend revertido a `HEAD` | **FAIL** en la aserción de conteo de peticiones |
| `TicketPersistenceTests` | `TicketService` vuelve a leer del modelo de lectura | **4 de 5** casos fallan |
| `RateLimitingTests` | Se elimina `OnRejected` (429 sin `Retry-After` ni cuerpo) | **1 de 4** falla: `ExpensiveEndpoint_WhenRateLimited_ReturnsRetryAfterHeader` |

### 2.5 Ejecución local vs. CI (importante)

`frontend/playwright.config.ts` usa presupuestos **más estrictos en local** que en CI:

| Ajuste | Local | CI (`CI=true`) |
|---|---|---|
| `timeout` por test | 30 s | 90 s |
| `expect.timeout` | 5 s | 15 s |
| `retries` | 0 | 2 |
| `failOnFlakyTests` | desactivado | **activo** |

Consecuencias prácticas:

- Un spec que se acerca al límite de 30 s local (por ejemplo
  `realtime-reopen.spec.ts`, que ronda los 29-34 s) **puede fallar en local y pasar en
  CI**. Un timeout local no es un defecto funcional: hay que repetirlo con el
  presupuesto de CI antes de abrir un incidente.
- La suite local debe ejecutarse con las **mismas variables de entorno que CI**
  (`E2E_GLPI_URL`, `E2E_GLPI_NATIVE=false`, `E2E_DESK_URL`, credenciales). Sin
  `E2E_GLPI_NATIVE=false`, `full-user-journey.spec.ts` intenta abrir la interfaz
  nativa de GLPI en `http://localhost:8081`, que no es alcanzable desde el contenedor
  del runner: ese fallo es de **entorno**, no del código bajo prueba.
- `CI=true` activa `failOnFlakyTests`: un test que sólo pasa tras reintento hace
  fallar el job. Es la configuración que hay que usar para medir la estabilidad real.

## 3. Criterios de Aceptación en CI/CD

Ningún código se integra a `main` si no cumple con:
1. `dotnet build` sin errores ni warnings críticos.
2. 100% de tests unitarios e integración aprobados (`dotnet test`).
3. Verificación de tipos en frontend (`pnpm typecheck` o `tsc --noEmit`). El `tsconfig.json` del frontend incluye **`tests`**, de modo que los specs E2E de Playwright también se verifican estáticamente en el job `frontend` (BUG-033: antes quedaban fuera del typecheck y sólo se detectaban en tiempo de ejecución).
4. 100% de tests E2E aprobados en Playwright.
5. Análisis estático de secretos limpio con Gitleaks.
6. Un test E2E que solo pasa tras reintento (flaky) cuenta como fallo: `failOnFlakyTests` está activo cuando `CI=true`.
7. **La cuota de rate limiting de producción no se modifica para tapar un defecto del cliente**: `RateLimitingTests.ProductionConfiguration_KeepsTheExpensiveQuotaUnchanged` fija los valores de `appsettings.json` (20 tokens, 1 token cada 3 s, 100 por usuario).

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