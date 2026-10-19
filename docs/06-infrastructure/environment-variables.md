# Environment Variables

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-06-ENVIRONMENT_VARIABLES | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

Two places hold configuration, and never the same secret twice in the repository:

- **Root `.env`** — read by `docker compose` for `${...}` interpolation. Git-ignored;
  template in `.env.example`. Used by the containerised stack.
- **.NET user-secrets** — read by the API only when `ASPNETCORE_ENVIRONMENT=Development`
  and only for a host-side run. Used for local development without Docker for the API.

See [`../12-security/secrets.md`](../12-security/secrets.md) for storage, rotation and
verification.

## Compose interpolation (root `.env`)

| Variable | Consumed by | Purpose |
|---|---|---|
| `MARIADB_ROOT_PASSWORD` | `glpi-db` (container init) | MariaDB `root` password |
| `MARIADB_DATABASE` | `glpi-db`; API connection string | Database name (default `glpi`) |
| `MARIADB_USER` | `glpi-db`; API connection string | Application DB user (default `glpi`) |
| `MARIADB_PASSWORD` | `glpi-db`; API connection string | Application DB password |
| `GLPI_APP_TOKEN` | `api` → `GlpiApi__AppToken` | GLPI application token (Setup → General → API) |
| `GLPI_USER_TOKEN` | `api` → `GlpiApi__UserToken` | User token of the dedicated write account |
| `JWT_SECRET` | `api` → `Jwt__Key` | HMAC-SHA256 signing key for the API's own JWT (≥ 32 chars) |

`.env.example` ships every key with a `<change-me>` placeholder and an explanatory comment.

## API configuration keys

Read from `appsettings.json` (and `appsettings.Development.json`), bound to strongly-typed
options. Any key can be overridden by an environment variable where `:` becomes `__`
(double underscore) — that is how `docker-compose.yml` injects the secrets.

| Configuration key | Bound option | Env var (compose) | Required | Notes |
|---|---|---|---|---|
| `Database:ConnectionString` | `DatabaseOptions.ConnectionString` | `Database__ConnectionString` | yes | MariaDB connection string; must not contain `Password=glpi`/`changeme` |
| `Database:CommandTimeoutSeconds` | `DatabaseOptions.CommandTimeoutSeconds` | `Database__CommandTimeoutSeconds` | no | default `30` |
| `GlpiApi:BaseUrl` | `GlpiOptions.BaseUrl` | `GlpiApi__BaseUrl` | no | default `http://localhost:8081/apirest.php/`; in Docker `http://glpi/apirest.php/` |
| `GlpiApi:AppToken` | `GlpiOptions.AppToken` | `GlpiApi__AppToken` | yes | ≥ 32 chars, else the API refuses to boot |
| `GlpiApi:UserToken` | `GlpiOptions.UserToken` | `GlpiApi__UserToken` | yes | ≥ 32 chars |
| `GlpiApi:TimeoutSeconds` | `GlpiOptions.TimeoutSeconds` | `GlpiApi__TimeoutSeconds` | no | default `30` |
| `Jwt:Issuer` | `JwtOptions.Issuer` | `Jwt__Issuer` | no | default `GlpiTicketManager.Api` |
| `Jwt:Audience` | `JwtOptions.Audience` | `Jwt__Audience` | no | default `GlpiTicketManager.Frontend` |
| `Jwt:Key` | `JwtOptions.Key` | `Jwt__Key` | yes | ≥ 32 chars |
| `Jwt:ExpiryMinutes` | `JwtOptions.ExpiryMinutes` | `Jwt__ExpiryMinutes` | no | default `60` |
| `ASPNETCORE_ENVIRONMENT` | — | `ASPNETCORE_ENVIRONMENT` | no | `Development` in compose (also enables user-secrets loading) |
| `ASPNETCORE_URLS` | — | `ASPNETCORE_URLS` | no | `http://+:8080`, set in the API Dockerfile |

## Frontend (Vite)

| Variable | Consumed by | Location | Purpose |
|---|---|---|---|
| `VITE_API_URL` | the React app (`import.meta.env.VITE_API_URL`) | `frontend/.env.local` (host) / compose `environment` | Base path axios prepends to every call (default `/api`) |
| `VITE_PROXY_TARGET` | `frontend/vite.config.ts` | `frontend/.env.local` (host) / compose `environment` | Where Vite proxies `/api`: `http://api:8080` in Docker, `http://localhost:5280` by default on the host |

Vite gives real environment variables precedence over `.env` files, so the compose values
(`VITE_PROXY_TARGET=http://api:8080`) win over the bind-mounted `frontend/.env.local`.

## Where each secret lives

| Context | DB credentials | GLPI tokens, JWT key |
|---|---|---|
| Containerised stack | root `.env` | root `.env` |
| Host-side API dev | user-secrets (`Database:ConnectionString`) | user-secrets (`GlpiApi:AppToken`, `GlpiApi:UserToken`, `Jwt:Key`) |

No real value is ever committed; `.env`, `frontend/.env.local` and
`appsettings.*.Local.json` are git-ignored (see `.gitignore` and `.dockerignore`).
