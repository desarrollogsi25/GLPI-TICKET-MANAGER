# Docker Infrastructure

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-06-DOCKER | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## Single-command stack

`docker compose up -d` starts the **whole** stack — MariaDB, GLPI, the .NET API and the
Vite dev server — with no manual step. The first time (or after changing a Dockerfile or
the project set) add `--build`.

```
docker compose up -d --build   # first boot / after changing a Dockerfile or a csproj
docker compose up -d           # subsequent boots, reuses the built images (≈ 17 s)
```

## Services

Every service runs with `restart: unless-stopped` and an explicit `container_name`.

| Service | Image / build | Container | Loopback port | `depends_on` |
|---|---|---|---|---|
| `glpi-db` | `mariadb:10.11` | `glpi-db` | `127.0.0.1:3306` | — |
| `glpi` | `glpi/glpi:11.0` | `glpi` | `127.0.0.1:8081` | `glpi-db` (healthy) |
| `api` | build `src/GlpiTicketManager.Api/Dockerfile` | `glpi-api` | `127.0.0.1:8080` | `glpi-db` (healthy), `glpi` (started), `app-db` (healthy) |
| `frontend` | build `frontend/Dockerfile.dev` | `glpi-frontend` | `127.0.0.1:5173` | `api` |
| `app-db` | `postgres:16-alpine` | `glpi-app-db` | `127.0.0.1:5432` | — |

- **glpi-db** — MariaDB 10.11. Healthcheck: `healthcheck.sh --connect --innodb_initialized`
  (waits for the server to accept connections *and* for InnoDB to be ready).
- **glpi** — GLPI 11.0 web UI. Starts only once `glpi-db` is healthy.
- **api** — .NET 10 Minimal API. Multi-stage build: `sdk:10.0` restore/publish stage →
  `aspnet:10.0` runtime stage. The restore layer copies only the `.sln`, `global.json` and
  the four `.csproj` files (with `--link`) so a source change does not invalidate NuGet.
  Runs as the non-root `app` user (uid/gid 1654, already present in the runtime image).
- **frontend** — Vite dev server on `node:22-alpine` with `pnpm` pinned to the lockfile
  version and `--frozen-lockfile`. The sources are bind-mounted for hot reload; the
  container's `node_modules` live in an anonymous volume so they are not shadowed by the
  host directory.
- **app-db** — PostgreSQL 16 (Alpine). Persistencia para datos propios del sistema (ADR-012:
  `app_settings`, `user_preferences`, `audit_log`, `revoked_tokens`). Healthcheck:
  `pg_isready -U app -d glpi_ticket_manager`. Aplica automáticamente las migraciones
  desde `./db/migrations` montado como read-only en `/docker-entrypoint-initdb.d`.
  Para resetear sus datos: `docker compose down -v` o eliminar el volumen `app-db-data`.

## Network — how the containers reach each other

Inside the compose network services resolve each other by **service name**, never via the
host loopback ports:

- API → database: `Server=glpi-db;Port=3306;…` (TCP).
- API → app-db: `Host=app-db;Port=5432;Database=glpi_ticket_manager;…` (TCP).
- API → GLPI: `GlpiApi__BaseUrl=http://glpi/apirest.php/` (HTTP port 80 inside the network).
- Browser → frontend → API: the browser calls same-origin `/api` on `:5173`; Vite proxies
  it to `http://api:8080` via `VITE_PROXY_TARGET`. Same-origin means **no CORS** is needed.

```
browser
  │ http://localhost:5173
  ▼
frontend (Vite dev) ──/api (Vite proxy)──► api (.NET 10)
                                             │  Dapper / TCP 3306
                                             ├────────────────────────► app-db (PostgreSQL 16)
                                             ▼
                                          glpi-db (MariaDB 10.11)
                                             ▲
                                             │ (GLPI's own connection)
api ──REST apirest.php/ :80──► glpi (GLPI 11.0)

browser ── http://localhost:8081 ──► glpi (GLPI web UI, for administration only)
```

## Volumes

The `glpi/glpi:11.0` image persists its state under **`/var/glpi`** (`config`, `files`,
`logs`, `marketplace`) and its plugins under **`/var/www/glpi/plugins`**
(source: <https://hub.docker.com/r/glpi/glpi> → *Volumes* and *Path configuration*).

The GLPI 9.x paths (`/var/lib/glpi`, `/etc/glpi`, `/var/www/glpi/marketplace`) are **not**
used by the 11.0 image: mounting them would leave the real config and data directories
unpersisted, so a container recreation would lose the install.
See `docs/01-architecture/decisions/ADR-001-glpi-docker-setup.md`.

| Named volume | Container path | Contents |
|---|---|---|
| `glpi-data` | `/var/glpi` | GLPI config, files, logs, marketplace |
| `glpi-plugins` | `/var/www/glpi/plugins` | Custom plugins |
| `glpi-db-data` | `/var/lib/mysql` | MariaDB data (tickets, users, tokens) |
| `app-db-data` | `/var/lib/postgresql/data` | PostgreSQL data (app_settings, preferences, audit, tokens) |

`docker compose down` **keeps** these volumes, so the GLPI install, the database and the
API tokens survive a stop/start cycle. `docker compose down -v` removes them (destructive).

## Ports

All ports are bound to `127.0.0.1` only — nothing is exposed to the LAN.

- **5173**: frontend (Vite dev server).
- **8080**: API (`/health`, `/openapi/v1.json`, `/scalar`).
- **8081**: GLPI web UI.
- **3306**: MariaDB (GLPI).
- **5432**: PostgreSQL (datos propios).

## Commands

```powershell
# Build + start everything
docker compose up -d --build

# Start with the already-built images (no recompilation)
docker compose up -d

# Status
docker compose ps

# Logs (follow / last N lines, per service)
docker compose logs -f api
docker compose logs -f frontend
docker compose logs --tail 50 glpi
docker compose logs --tail 50 glpi-db
docker compose logs --tail 50 app-db

# Stop (keeps named volumes, so data survives)
docker compose down

# Stop AND wipe all data (GLPI install + database) — destructive
docker compose down -v
```

After changing C# code the API image must be rebuilt:
`docker compose up -d --build api`. Frontend changes are hot-reloaded by the containerised
Vite server (the sources are bind-mounted) — no restart needed.

## Environment

The compose file interpolates `${...}` from the root `.env` (git-ignored, template in
`.env.example`). The full variable table — consumer, location and purpose — is in
[`environment-variables.md`](environment-variables.md).
