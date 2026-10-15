# GLPI Ticket Manager

A custom ticket-management stack on top of [GLPI](https://glpi-project.org/): a .NET 10
Minimal API and a React 19 single-page app that let a support team view and drive GLPI
tickets from a purpose-built interface without reimplementing GLPI's workflow. **Reads**
come straight from the GLPI MariaDB database through Dapper (fast, SQL-shaped), while
**every mutation** goes through GLPI's REST API (`apirest.php`) so notifications, logs,
SLA rules and plugins keep working. Authentication is the API's own JWT.

## Stack

| Layer | Technology |
|---|---|
| API | .NET 10 Minimal API, Dapper (reads), typed `HttpClient` (GLPI writes), Serilog, Scalar, native rate limiting, own JWT |
| Frontend | React 19 + Vite + pnpm, TanStack Query/Table, zustand, @dnd-kit/core, react-router-dom 7, React Hook Form + zod, axios, Tailwind CSS v4 |
| Platform | GLPI 11.0 + MariaDB 10.11 (Docker Compose) |

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download/dotnet/10.0) (see `global.json`)
- [Node.js 22](https://nodejs.org/) and [pnpm](https://pnpm.io/) (`corepack enable pnpm`)
- [Docker](https://www.docker.com/) with the Compose plugin

## Getting started

### Option A — the whole stack in Docker (single command)

```powershell
# 1. Clone
git clone https://github.com/desarrollogsi25/GLPI-TICKET-MANAGER.git
cd GLPI-TICKET-MANAGER

# 2. Create the environment file and fill in the secrets (git-ignored).
#    Set the MARIADB_* passwords, the GLPI_* tokens and JWT_SECRET.
Copy-Item .env.example .env

# 3. Build and start the whole stack: MariaDB + GLPI + API + frontend.
docker compose up -d --build
#    frontend        -> http://localhost:5173
#    API             -> http://localhost:8080   (/health, /openapi/v1.json, /scalar)
#    GLPI web UI     -> http://localhost:8081
#    MariaDB         -> 127.0.0.1:3306

# Subsequent starts reuse the built images (no recompilation, ~17 s):
docker compose up -d
```

`docker compose down` stops everything but keeps the named volumes (GLPI install and
database survive); `docker compose down -v` wipes them. See
[`docs/06-infrastructure/docker.md`](docs/06-infrastructure/docker.md) for the service map,
the network diagram and the log commands.

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

## Documentation

Start at [`docs/`](docs/):

- [`docs/09-visual-docs/accessibility.md`](docs/09-visual-docs/accessibility.md) — WCAG 2.1 AA audit, fixes, and multi-viewport QA
- [`docs/02-modules/tickets/overview.md`](docs/02-modules/tickets/overview.md) — endpoints, GLPI write chain, frontend write flows
- [`docs/01-architecture/ADR-002-api-glpi-integration.md`](docs/01-architecture/ADR-002-api-glpi-integration.md) — why Dapper reads + REST writes
- [`docs/01-architecture/decisions/ADR-009-system-is-ticket-manager-only.md`](docs/01-architecture/decisions/ADR-009-system-is-ticket-manager-only.md) — el sistema es gestor, no creador de tickets (ADR-009)
- [`docs/12-security/secrets.md`](docs/12-security/secrets.md) — secret storage, rotation, verification
- [`docs/06-infrastructure/docker.md`](docs/06-infrastructure/docker.md) — 4-service stack, network diagram, start/stop/log commands
- [`docs/06-infrastructure/environment-variables.md`](docs/06-infrastructure/environment-variables.md) — every variable, its consumer and where it lives
