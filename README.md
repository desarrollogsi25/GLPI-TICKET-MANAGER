# GLPI Ticket Manager

A custom ticket-management stack on top of [GLPI](https://glpi-project.org/): a .NET 9
Minimal API and a React 19 single-page app that let a support team view and drive GLPI
tickets from a purpose-built interface without reimplementing GLPI's workflow. **Reads**
come straight from the GLPI MariaDB database through Dapper (fast, SQL-shaped), while
**every mutation** goes through GLPI's REST API (`apirest.php`) so notifications, logs,
SLA rules and plugins keep working. Authentication is the API's own JWT.

## Stack

| Layer | Technology |
|---|---|
| API | .NET 9 Minimal API, Dapper (reads), typed `HttpClient` (GLPI writes), Serilog, Scalar, native rate limiting, own JWT |
| Frontend | React 19 + Vite + pnpm, TanStack Query/Table, zustand, @dnd-kit/core, react-router-dom 7, React Hook Form + zod, axios, Tailwind CSS v4 |
| Platform | GLPI 11.0 + MariaDB 10.11 (Docker Compose) |

## Prerequisites

- [.NET SDK 9](https://dotnet.microsoft.com/download/dotnet/9.0) (see `global.json`)
- [Node.js 22](https://nodejs.org/) and [pnpm](https://pnpm.io/) (`corepack enable pnpm`)
- [Docker](https://www.docker.com/) with the Compose plugin

## Getting started

```powershell
# 1. Clone
git clone https://github.com/desarrollogsi25/GLPI-TICKET-MANAGER.git
cd GLPI-TICKET-MANAGER

# 2. Provide the database passwords for the Docker stack (git-ignored)
Copy-Item .env.example .env      # then edit .env and fill MARIADB_* values

# 3. Start GLPI + MariaDB (first boot initialises the GLPI volumes)
docker compose up -d
#    GLPI UI  -> http://localhost:8081

# 4. Configure the API secrets (see next section)
dotnet user-secrets set "GlpiApi:AppToken"  "<GLPI_APP_TOKEN>"  --project src/GlpiTicketManager.Api
dotnet user-secrets set "GlpiApi:UserToken" "<GLPI_USER_TOKEN>" --project src/GlpiTicketManager.Api
dotnet user-secrets set "Database:ConnectionString" "Server=127.0.0.1;Port=3306;Database=glpi;User ID=glpi;Password=<MARIADB_PASSWORD>;Allow User Variables=true;UseAffectedRows=false" --project src/GlpiTicketManager.Api

# 5. Run the API (Development profile -> http://localhost:5280)
dotnet run --project src/GlpiTicketManager.Api

# 6. Run the frontend (http://localhost:5173)
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

## Project structure

```
.
├── docker-compose.yml            # GLPI 11.0 + MariaDB 10.11 (loopback ports, named volumes)
├── .env.example                  # template for the Docker/MariaDB passwords
├── GlpiTicketManager.sln
├── src/
│   ├── GlpiTicketManager.Domain/         # entities, enums (no dependencies)
│   ├── GlpiTicketManager.Application/    # DTOs, services, abstractions
│   ├── GlpiTicketManager.Infrastructure/ # Dapper queries, GLPI REST client, JWT
│   └── GlpiTicketManager.Api/            # Minimal API endpoints, auth, rate limiting, Serilog
│       ├── Program.cs
│       ├── appsettings.json              # empty placeholders only
│       └── appsettings.Development.json  # empty token placeholders (+ tripwire DB password)
├── frontend/
│   ├── src/
│   │   ├── components/                   # layout + shadcn/ui primitives
│   │   ├── features/                     # auth, dashboard, tickets (List/Kanban/Detail/dialog)
│   │   ├── hooks/                        # TanStack Query hooks
│   │   ├── lib/                          # axios client, API wrappers, helpers
│   │   └── store/                        # zustand stores (auth, ui, toast)
│   ├── vite.config.ts                    # /api proxy -> VITE_PROXY_TARGET
│   └── package.json
└── docs/
    ├── 01-architecture/                  # ADRs (integration strategy, create DTO)
    ├── 02-modules/tickets/               # module overview + endpoints + write flows
    ├── 04-database/queries/
    ├── 06-infrastructure/docker.md
    └── 12-security/secrets.md
```

## Documentation

Start at [`docs/`](docs/):

- [`docs/02-modules/tickets/overview.md`](docs/02-modules/tickets/overview.md) — endpoints, GLPI write chain, frontend write flows
- [`docs/01-architecture/ADR-002-api-glpi-integration.md`](docs/01-architecture/ADR-002-api-glpi-integration.md) — why Dapper reads + REST writes
- [`docs/01-architecture/decisions/ADR-003-ticket-create-dto.md`](docs/01-architecture/decisions/ADR-003-ticket-create-dto.md) — create-ticket contract
- [`docs/12-security/secrets.md`](docs/12-security/secrets.md) — secret storage, rotation, verification
- [`docs/06-infrastructure/docker.md`](docs/06-infrastructure/docker.md) — container layout
