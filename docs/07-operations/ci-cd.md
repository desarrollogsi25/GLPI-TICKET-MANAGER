# Optimización de Pipeline CI/CD y Estrategia de Caching

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-07-OPS-CICD | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Propósito y Alcance

Establece las directrices técnicas para la optimización del pipeline de Integración Continua (CI) en GitHub Actions (`.github/workflows/ci.yml`), maximizando la velocidad de ejecución y reduciendo el consumo de créditos y almacenamiento en conformidad con ISO 9001 (Mejora Continua) e ISO 27001 (Gestión Eficiente de Recursos).

## 2. Estrategia de Caching de Dependencias

### 2.1 Dependencias .NET (NuGet Packages)
- **Ruta de Caché:** `~/.nuget/packages`
- **Clave de Caché:** `${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}`
- **Fallback Keys:** `${{ runner.os }}-nuget-`
- **Impacto:** Evita descargar paquetes NuGet en cada ejecución de `dotnet restore`, reduciendo el tiempo de preparación de 15-25 segundos a menos de 2 segundos.

### 2.2 Binarios de Playwright (Navegadores Headless)
- **Ruta de Caché:** `~/.cache/ms-playwright`
- **Clave de Caché:** `${{ runner.os }}-playwright-${{ hashFiles('frontend/pnpm-lock.yaml') }}`
- **Mecanismo de Hidratación:**
  1. El host runner restaura la caché en `~/.cache/ms-playwright`.
  2. Si existe caché local, se transfiere al contenedor de frontend antes de la instalación: `docker compose cp ~/.cache/ms-playwright/. frontend:/root/.cache/ms-playwright/`.
  3. `playwright install chromium` detecta los binarios preexistentes y omite la descarga de ~150 MB.
  4. Al finalizar la suite E2E, se sincronizan los binarios de vuelta al host para persistir en caché.
- **Impacto:** Ahorro directo de ~45 a 60 segundos por cada ejecución de E2E.

### 2.3 Dependencias Frontend (pnpm store)
- Gestionado a través de `actions/setup-node@v4` con `cache: 'pnpm'` indexado por `frontend/pnpm-lock.yaml`.

## 3. Filtros de Rutas Inteligentes (Path Filtering)

Para evitar ejecuciones redundantes sin romper los requerimientos de branch protection de GitHub, se implementa `dorny/paths-filter@v3` en los jobs de Backend y Frontend:

| Job | Reglas de Exclusión | Comportamiento si no hay cambios | Tiempo con Skip |
| :--- | :--- | :--- | :---: |
| **Backend** | `!docs/**`, `!frontend/**` | Omite restore, build y test (.NET 10). Emite status 200 OK. | ~5 segundos |
| **Frontend** | `!docs/**`, `!src/**`, `!tests/GlpiTicketManager.**` | Omite typecheck y bundle Vite. Emite status 200 OK. | ~5 segundos |

> [!NOTE]
> Al mantener los jobs activos pero saltando sus pasos pesados cuando no hay cambios relevantes, se satisfacen las políticas de branch protection obligatorias en `main` sin consumir minutos de CPU.

## 4. Política de Retención de Artefactos

- **Retención previa:** 7 días.
- **Nueva política:** `retention-days: 3`.
- **Alcance:** Reportes HTML y trazas de fallo de Playwright (`playwright-report/`).
- **Beneficio:** Reducción del 57% en almacenamiento acumulado de artefactos temporales en GitHub Actions.

## 5. Tabla Comparativa de Rendimiento y Ahorro Estimado

| Etapa de CI | Tiempo Previo (Sin Caché) | Tiempo Optimizado | Ahorro por Run | Ahorro Mensual Est. (100 runs) |
| :--- | :---: | :---: | :---: | :---: |
| **Backend NuGet Restore** | ~35 seg | ~8 seg | ~27 seg | ~45 min |
| **Frontend pnpm install** | ~40 seg | ~12 seg | ~28 seg | ~46 min |
| **Playwright Browser Download** | ~55 seg | ~3 seg | ~52 seg | ~86 min |
| **Cambios solo en Docs (Skip)** | ~4 min | ~10 seg | ~3.8 min | ~60 min |
| **Total Estimado por Ejecución** | **~4m 30s** | **~2m 45s** | **~1m 45s (39%)** | **~237 minutos** |
