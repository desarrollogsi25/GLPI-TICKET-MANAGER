# GLPI Ticket Manager

A custom ticket-management stack on top of [GLPI](https://glpi-project.org/): a .NET 10
Minimal API and a React 19 single-page app that let a support team view and drive GLPI
tickets from a purpose-built interface without reimplementing GLPI's workflow. **Reads**
come straight from the GLPI MariaDB database through Dapper (fast, SQL-shaped), while
**every mutation** goes through GLPI's REST API (`apirest.php`) so notifications, logs,
SLA rules and plugins keep working. Authentication is the API's own JWT.

## Stack Tecnológico

La plataforma está construida con una arquitectura desacoplada y moderna optimizada para alto rendimiento, responsividad y experiencia de usuario fluida:

| Componente | Tecnología | Rol y Características Clave |
|---|---|---|
| **Backend Core** | **.NET 10** Minimal API | C# 13, endpoints de alto rendimiento, validación nativa, typed `HttpClient`, Serilog, OpenAPI/Scalar |
| **Persistencia & Lecturas** | **Dapper** (MariaDB) | Consultas SQL directas y eficientes a la base de datos de GLPI para lecturas ultrarrápidas |
| **Mutaciones Seguras** | **GLPI REST API** | Todas las escrituras pasan por `apirest.php`, garantizando auditoría, historial, plugins y reglas SLA de GLPI |
| **Tiempo Real** | **SignalR** | WebSockets bidireccionales para actualización instantánea de tableros, cambios de estado y push notifications |
| **Frontend Core** | **React 19** + Vite | React Server/Client paradigms, TypeScript estricto, bundle optimizado con pnpm |
| **Estilos & Diseño** | **Tailwind CSS v4** | Motor de estilos de última generación basado en CSS variables, OKLCH y diseño responsive fluido |
| **Estado del Servidor** | **TanStack Query v5** | Cache distribuido, invalidación por eventos SignalR, mutaciones optimistas y background refetching |
| **Estado del Cliente** | **Zustand v5** | Gestión atómica y ultraligera de estado local (autenticación, filtros activos, UI state) |
| **Notificaciones** | **Sonner** | Toasts animados con feedback háptico visual y soporte multi-evento |
| **Drag and Drop** | **@dnd-kit** | Tablero Kanban interactivo con sensores accesibles para puntero, táctil y teclado |
| **Command Palette** | **cmdk** | Búsqueda y navegación global ultra-rápida accionable mediante `Ctrl + K` / `Cmd + K` |
| **Plataforma Base** | **GLPI 11.0 + MariaDB 10.11** | Motor ITIL de tickets y base de datos relacional sobre Docker Compose |

---

## Cómo levantar el proyecto

### Opción A — Todo el stack en Docker (Recomendado)

Inicia todos los contenedores de forma orquestada (MariaDB, GLPI, PostgreSQL de preferencias, API .NET 10 y Frontend React 19):

```powershell
# 1. Clonar el repositorio
git clone https://github.com/desarrollogsi25/GLPI-TICKET-MANAGER.git
cd GLPI-TICKET-MANAGER

# 2. Configurar variables de entorno
Copy-Item .env.example .env

# 3. Compilar e iniciar todo el stack con Docker Compose
docker compose up -d --build
```

**Servicios disponibles una vez levantado:**
- **Frontend SPA:** [http://localhost:5173](http://localhost:5173)
- **API Backend (.NET 10):** [http://localhost:8080](http://localhost:8080) (Documentación en `/scalar` o `/openapi/v1.json`)
- **Health Check API:** [http://localhost:8080/health](http://localhost:8080/health)
- **GLPI Web UI:** [http://localhost:8081](http://localhost:8081)
- **MariaDB GLPI:** `127.0.0.1:3306`

> **Detener los servicios:**  
> - Detener contenedores manteniendo volúmenes y datos: `docker compose down`  
> - Detener y reiniciar limpiando volúmenes: `docker compose down -v`

---

## Credenciales de prueba

Para facilitar las pruebas funcionales, QA y evaluación del sistema, se encuentran preconfigurados los siguientes usuarios con sus respectivos roles y grupos en GLPI.

> **Contraseña universal para todos los usuarios de prueba:**  
> `Password123!`

| Usuario | Contraseña | Rol en la App | Grupo GLPI | Propósito / Funcionalidad |
|---|---|---|---|---|
| `admin_test` | `Password123!` | Administrador | Todos (Global) | Control total, gestión de roles, métricas de todos los grupos y supervisión |
| `lider_dev` | `Password123!` | Supervisor | **Desarrollo** | Vista de cola grupal, asignación de tickets, métricas de rendimiento del grupo Desarrollo |
| `lider_bi` | `Password123!` | Supervisor | **BI** | Supervisión y gestión de tickets del grupo Business Intelligence |
| `lider_sd` | `Password123!` | Supervisor | **Service Desk** | Supervisión y despacho de tickets del grupo Service Desk |
| `tech_dev` | `Password123!` | Técnico | **Desarrollo** | Autoasignación de tickets, actualización de estados, notas técnicas y resolución de incidentes |
| `tech_bi` | `Password123!` | Técnico | **BI** | Atención técnica de solicitudes del grupo BI |
| `tech_sd` | `Password123!` | Técnico | **Service Desk** | Atención de soporte nivel 1, hardware y accesos en Service Desk |
| `user_test` | `Password123!` | Solicitante (Self-Service) | Solicitante | Creación y seguimiento de tickets como usuario final en GLPI |
| `glpi` | `glpi` | Super-Admin Nativo | GLPI Native | Administración directa de la consola GLPI (http://localhost:8081) |

---

### Option B — API + frontend on the host, only GLPI in Docker

Useful for debugging with a local toolchain. Start only the GLPI services, then run the
API and Vite directly:

```powershell
# 1. Start GLPI + MariaDB
docker compose up -d glpi glpi-db      # GLPI UI -> http://localhost:8081

# 2. Configure the API secrets (see next section)
dotnet user-secrets set "GlpiApi:AppToken"  "<GLPI_APP_TOKEN>"  --project src/GlpiTicketManager.Api
dotnet user-secrets set "GlpiApi:UserToken" "<GLPI_USER_TOKEN>" --project src/GlpiTicketManager.Api
dotnet user-secrets set "Database:ConnectionString" "Server=127.0.0.1;Port=3306;Database=glpi;User ID=glpi;Password=<MARIADB_PASSWORD>;Allow User Variables=true;UseAffectedRows=false" --project src/GlpiTicketManager.Api

# 3. Run the API (Development profile -> http://localhost:5280)
dotnet run --project src/GlpiTicketManager.Api

# 4. Run the frontend (http://localhost:5173)
cd frontend
Copy-Item .env.example .env.local   # VITE_PROXY_TARGET defaults to http://localhost:5280
pnpm install
pnpm dev
```

The API refuses to start if a secret is missing or weak, printing
`Configuración inválida: <variable>. Revisa docs/12-security/secrets.md para los pasos.`
This is intentional — there is no fallback to placeholder credentials.

> Running the API on a port other than the default `5280`? Point the frontend proxy at it
> by editing `VITE_PROXY_TARGET` in `frontend/.env.local` (or run with
> `dotnet run --project src/GlpiTicketManager.Api --urls http://localhost:8080`).

## Configure secrets

No real secret value is committed. Locally the API reads them from .NET **user-secrets**
(only loaded when `ASPNETCORE_ENVIRONMENT=Development`); anything non-dev should use
environment variables or a real secret manager.

```powershell
# Required (the API will not boot without them)
dotnet user-secrets set "GlpiApi:AppToken"  "<GLPI_APP_TOKEN>"  --project src/GlpiTicketManager.Api
dotnet user-secrets set "GlpiApi:UserToken" "<GLPI_USER_TOKEN>" --project src/GlpiTicketManager.Api
dotnet user-secrets set "Database:ConnectionString" "Server=127.0.0.1;Port=3306;Database=glpi;User ID=glpi;Password=<MARIADB_PASSWORD>;Allow User Variables=true;UseAffectedRows=false" --project src/GlpiTicketManager.Api

# Inspect / clear
dotnet user-secrets list  --project src/GlpiTicketManager.Api
dotnet user-secrets clear --project src/GlpiTicketManager.Api
```

`Jwt:Key` ships with a known, non-secret development placeholder (≥32 chars) so a fresh
checkout can boot; **override it outside local development** with `JWT_SECRET` (env var)
or user-secrets. See [`docs/12-security/secrets.md`](docs/12-security/secrets.md) for the
full variable list, rotation steps and verification commands.

## Configuring CI secrets

The GitHub Actions CI workflow runs full-stack End-to-End tests against an ephemeral Docker Compose environment bootstrapped with GLPI fixtures (`scripts/glpi-base.sql`). The E2E job requires 6 repository secrets configured in GitHub Actions to authenticate against the databases, GLPI REST API, and JWT tokens.

> **Note:** These credentials belong to the local development/testing GLPI instance bootstrapped from `scripts/glpi-base.sql`, **not** a production environment.

### Required Secrets

| Secret | Description | Source in local `.env` |
|---|---|---|
| `MARIADB_ROOT_PASSWORD` | MariaDB root administrative password | `MARIADB_ROOT_PASSWORD` |
| `MARIADB_PASSWORD` | Password for the `glpi` database user | `MARIADB_PASSWORD` |
| `GLPI_APP_TOKEN` | GLPI API client application token | `GLPI_APP_TOKEN` |
| `GLPI_USER_TOKEN` | API token of the GLPI service/admin user | `GLPI_USER_TOKEN` |
| `JWT_SECRET` | Secret key for signing backend JWT tokens (≥32 chars) | `JWT_SECRET` |
| `APP_DB_PASSWORD` | PostgreSQL password for application database (`app-db`) | `APP_DB_PASSWORD` |

### How to configure in GitHub UI

1. In GitHub, go to repository **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
2. Click **New repository secret**.
3. Add each secret with the corresponding value from your local `.env` file.
4. The workflow validates these secrets in the `Validate required secrets` step and fails fast if any secret is missing.

## Project structure

```
.
├── docker-compose.yml            # MariaDB + GLPI + API + frontend (loopback ports, named volumes)
├── .dockerignore                 # keeps build contexts small and secrets out of the images
├── .env.example                  # template for the Docker/MariaDB/GLPI/JWT values
├── GlpiTicketManager.sln
├── src/
│   ├── GlpiTicketManager.Domain/         # entities, enums (no dependencies)
│   ├── GlpiTicketManager.Application/    # DTOs, services, abstractions
│   ├── GlpiTicketManager.Infrastructure/ # Dapper queries, GLPI REST client, JWT
│   └── GlpiTicketManager.Api/            # Minimal API endpoints, auth, rate limiting, Serilog
│       ├── Dockerfile                    # multi-stage build (sdk:10.0 -> aspnet:10.0, non-root)
│       ├── Program.cs
│       ├── appsettings.json              # empty placeholders only
│       └── appsettings.Development.json  # empty token placeholders (+ tripwire DB password)
├── frontend/
│   ├── src/
│   │   ├── components/                   # layout + shadcn/ui primitives
│   │   ├── features/                     # auth, dashboard, tickets (List/Kanban/Detail)
│   │   ├── hooks/                        # TanStack Query hooks
│   │   ├── lib/                          # axios client, API wrappers, helpers
│   │   └── store/                        # zustand stores (auth, ui, toast)
│   ├── vite.config.ts                    # /api proxy -> VITE_PROXY_TARGET
│   ├── Dockerfile.dev                    # Vite dev server image (hot reload)
│   └── package.json
└── docs/
    ├── 01-architecture/                  # ADRs (integration strategy, decisions)
    ├── 02-modules/tickets/               # module overview + endpoints + write flows
    ├── 04-database/queries/
    ├── 06-infrastructure/
    │   ├── docker.md                     # service map, network diagram, commands
    │   └── environment-variables.md      # variable table (consumer, location, purpose)
    └── 12-security/secrets.md
```

## Running tests locally

### Unit tests (Backend)
```powershell
dotnet test tests/GlpiTicketManager.Application.Tests
```

### Typecheck & Build (Frontend)
```powershell
cd frontend
pnpm install
pnpm typecheck
pnpm build
```

### End-to-End tests (Playwright)
Prerequisites: The Docker stack must be running (`docker compose up -d`).
```powershell
# Reset state / seed fixtures
./scripts/seed-e2e.sh

# Run Playwright tests
cd frontend
pnpm exec playwright test --reporter=list
```

## Accessibility (WCAG 2.1 AA)

The web application is audited and verified against **WCAG 2.1 Level AA** standards:
- **Zero violations** verified with automated `@axe-core/playwright` audits across all 8 core views (`/kanban`, `/tickets`, `/tickets/:id`, `/queue`, `/services`, `/dashboard`, `/preferences`, `/ayuda`).
- **Contrast ratios**: Color contrast &ge; 4.5:1 across both light and dark themes.
- **Focus visible**: Consistent high-visibility focus rings on all interactive elements.
- **Keyboard navigation**: Full keyboard operability, modal/sheet focus trapping, Escape dismiss, and top-level skip links (`#main-content`).
- **Multi-viewport responsive QA**: Audited across mobile (375px), tablet (768px), and desktop (1280px).
- See detailed report in [`docs/09-visual-docs/accessibility.md`](docs/09-visual-docs/accessibility.md).

## Secrets & Security

- **No committed secrets**: Runtime credentials (`.env`, `scripts/config_db.php`, `scripts/glpicrypt.key`, `*.key`) are strictly git-ignored. Configuration templates are provided as `.env.example` and `scripts/config_db.php.template`.
- **Secret Scanning (Gitleaks)**: Automated scan on every push/PR via `.github/workflows/ci.yml` with allowlists configured in `.gitleaks.toml`.
- **Fail-fast validation**: The API rejects default or empty passwords at boot via `StartupConfigurationValidator`.
- For storage, rotation runbooks and leak remediation, see:
  - [`docs/12-security/secrets.md`](docs/12-security/secrets.md) — secret storage, rotation, verification
  - [`docs/07-operations/secret-rotation.md`](docs/07-operations/secret-rotation.md) — standard operating procedure for secret rotation

## Documentation

Start at [`docs/`](docs/):

- [`docs/user-guide.md`](docs/user-guide.md) — Guía básica de usuario (creación de tickets en GLPI, autoasignación, ciclo de vida de estados y Command Palette `Ctrl+K`)
- [`docs/01-architecture/decisions/ADR-022-realtime-and-ui-engineering.md`](docs/01-architecture/decisions/ADR-022-realtime-and-ui-engineering.md) — Arquitectura de tiempo real (SignalR + TanStack Query) y principios de ingeniería de UI (Emil Kowalski)
- [`docs/09-visual-docs/accessibility.md`](docs/09-visual-docs/accessibility.md) — WCAG 2.1 AA audit, fixes, and multi-viewport QA
- [`docs/02-modules/tickets/overview.md`](docs/02-modules/tickets/overview.md) — endpoints, GLPI write chain, frontend write flows
- [`docs/01-architecture/ADR-002-api-glpi-integration.md`](docs/01-architecture/ADR-002-api-glpi-integration.md) — why Dapper reads + REST writes
- [`docs/01-architecture/decisions/ADR-009-system-is-ticket-manager-only.md`](docs/01-architecture/decisions/ADR-009-system-is-ticket-manager-only.md) — el sistema es gestor, no creador de tickets (ADR-009)
- [`docs/12-security/secrets.md`](docs/12-security/secrets.md) — secret storage, rotation, verification
- [`docs/07-operations/secret-rotation.md`](docs/07-operations/secret-rotation.md) — secret rotation procedures and policies
- [`docs/06-infrastructure/docker.md`](docs/06-infrastructure/docker.md) — 4-service stack, network diagram, start/stop/log commands
- [`docs/06-infrastructure/environment-variables.md`](docs/06-infrastructure/environment-variables.md) — every variable, its consumer and where it lives

## Contributing

Todos los cambios a main pasan por PR. El PR requiere:
- Descripción clara (usar `.github/PULL_REQUEST_TEMPLATE.md`)
- Checks CI verdes (secret-scan, backend, frontend, e2e)
- Aprobación de @desarrollogsi25
- Conversaciones resueltas

Emergencias: ver [`docs/07-operations/emergency-procedure.md`](docs/07-operations/emergency-procedure.md).


