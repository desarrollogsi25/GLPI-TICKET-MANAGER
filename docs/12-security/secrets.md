# Secrets management

This project reads several secrets at runtime. **No real secret value belongs in the
repository.** This document lists the variables, where each one is read from, and how
to rotate it. Values are intentionally omitted.

## Where secrets live

| Environment | Storage |
|---|---|
| Local Docker stack (GLPI + MariaDB) | root `.env` (consumed by `docker-compose.yml`); `.env` is git-ignored |
| API on the host (development) | .NET **user-secrets** (`dotnet user-secrets`), in the `GlpiTicketManager.Api` project |
| API (anything non-dev) | environment variables or a real secret manager (e.g. Azure Key Vault, Vault) |

`src/GlpiTicketManager.Api/appsettings.Development.json` is committed with **empty
placeholders only** (`""`). It is safe to share; it must never hold a real value.
Environment variables still override user-secrets and appsettings at runtime.

## Fail-fast at startup

The API refuses to boot when the configuration is weak. On startup
(`StartupConfigurationValidator`, called from `Program.cs`) it checks:

| Check | Rule |
|---|---|
| `Database:ConnectionString` | non-empty and **not** containing `Password=glpi` / `Password=changeme` |
| `GlpiApi:AppToken` | length ≥ 32 |
| `GlpiApi:UserToken` | length ≥ 32 |
| `Jwt:Key` | length ≥ 32 |

If any check fails the process throws and does **not** start, with:

```
Configuración inválida: <variable>. Revisa docs/12-security/secrets.md para los pasos.
```

(several failing variables are listed separated by `;`). This is deliberate: no silent
fallback to placeholder credentials.

## Local development setup (user-secrets)

The project declares a `UserSecretsId` in
`src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj`, so secrets are only loaded
when `ASPNETCORE_ENVIRONMENT=Development`.

Set the required values (replace `<...>` with the real values, never commit them):

```powershell
dotnet user-secrets set "GlpiApi:AppToken"  "<GLPI_APP_TOKEN>"  --project src/GlpiTicketManager.Api
dotnet user-secrets set "GlpiApi:UserToken" "<GLPI_USER_TOKEN>" --project src/GlpiTicketManager.Api
dotnet user-secrets set "Database:ConnectionString" `
  "Server=127.0.0.1;Port=3306;Database=glpi;User ID=glpi;Password=<MARIADB_PASSWORD>;Allow User Variables=true;UseAffectedRows=false" `
  --project src/GlpiTicketManager.Api
```

Inspect what is stored (keys only are shown by the tool; still, treat the output as
sensitive):

```powershell
dotnet user-secrets list  --project src/GlpiTicketManager.Api
dotnet user-secrets clear --project src/GlpiTicketManager.Api   # remove all
```

## Variables

### Docker / MariaDB (`.env`)

| Variable | Used by | Notes |
|---|---|---|
| `MARIADB_ROOT_PASSWORD` | `glpi-db` container | MariaDB root account |
| `MARIADB_DATABASE` | `glpi-db` container | Database name (`glpi`) |
| `MARIADB_USER` | `glpi-db` container | Application DB user (`glpi`) |
| `MARIADB_PASSWORD` | `glpi-db` container | Password of `MARIADB_USER`; also feeds `Database:ConnectionString` |

### API JWT (config `Jwt:Key`)

| Variable | Config key | Notes |
|---|---|---|
| `JWT_SECRET` | `Jwt:Key` | HMAC-SHA256 signing key, **minimum 32 characters**. The API refuses to start with a shorter/empty value. |

### GLPI REST API (`GlpiApi` section)

The API talks to GLPI's legacy REST endpoint (`apirest.php`) using two tokens per call
(see `docs/02-modules/tickets/overview.md`). They are stored in user-secrets locally
and loaded into config as `GlpiApi:AppToken` / `GlpiApi:UserToken`.

| Variable | Config key | Source in GLPI | Notes |
|---|---|---|---|
| `GLPI_APP_TOKEN` | `GlpiApi:AppToken` | `glpi_apiclients.app_token` (an *API client*, Setup → General → API) | Identifies the calling application. Optional only if GLPI allows anonymous app tokens. |
| `GLPI_USER_TOKEN` | `GlpiApi:UserToken` | `glpi_users.api_token` of the write account (Preferences → *API token* → Generate) | Acts as the authenticated GLPI user for writes. |
| — | `GlpiApi:BaseUrl` | — | Not secret. Must include `apirest.php/`. |
| — | `GlpiApi:TimeoutSeconds` | — | Not secret. |
| `MARIADB_PASSWORD` (dev) | `Database:ConnectionString` | — | The read path (Dapper) reuses the MariaDB password; store the connection string in user-secrets. |

Both GLPI tokens are **encrypted at rest** (`glpi_configs`: `are_apiclients_tokens_encrypted`
and `are_users_tokens_encrypted` are `1`). This means:

- Reading them straight out of the database yields ciphertext, not the usable token.
- To set them without the web UI, GLPI's own `GLPIKey::encrypt()` must be applied before
  writing to `glpi_apiclients.app_token` / `glpi_users.api_token`.

## Rotation

Rotate any secret by generating a new value in its source, storing it with
`dotnet user-secrets set` (or the env var / secret manager in use), and restarting the
API. Then **verify the old value no longer works**.

| Secret | How to rotate | How to confirm the old value is dead |
|---|---|---|
| `GlpiApi:AppToken` | GLPI → *Setup → General → API clients* → open the client → regenerate the token, or create a new client and disable the old one | `initSession` with the **old** token returns `401`/`ERROR_APP_TOKEN`; the new one returns `session_token` |
| `GlpiApi:UserToken` | GLPI → open the write account → *API token* → **Regenerate**, save, copy | `initSession` with the **old** user token returns `401`/`ERROR_USER_TOKEN` |
| `Jwt:Key` | generate a new random ≥32-char string and set `Jwt:Key` | previously issued API JWTs are rejected (`401`) because the signature no longer validates |
| `MARIADB_PASSWORD` | change it in MariaDB, then update `.env` **and** `Database:ConnectionString` in user-secrets | the API fails to start / Dapper queries fail with an authentication error |

Verification of a GLPI token pair (no state change, nothing created):

```bash
curl -s -H "App-Token: $GLPI_APP_TOKEN" \
        -H "Authorization: user_token $GLPI_USER_TOKEN" \
        http://localhost:8081/apirest.php/initSession
# → {"session_token":"..."}      (valid)
# → {"ERROR_...": ...}           (rotated / revoked)
```

After rotating, restart the API and check `GET /health` → `{"status":"ok"}`, then a
read (`GET /api/tickets/...`) and a write (`PATCH /api/tickets/{id}/status`) to
exercise both paths.

## Verifying secrets are NOT in files

`appsettings*.json` must contain only empty placeholders for the GLPI tokens. Run:

```powershell
# PowerShell: flag any non-empty AppToken/UserToken in tracked config
Get-ChildItem -Recurse -Filter 'appsettings*.json' |
  Select-String -Pattern '"(AppToken|UserToken)"\s*:\s*"\s*[^"]' |
  Select-Object Path, LineNumber, Line
```

```bash
# bash / Git Bash
grep -RInE '"(AppToken|UserToken)"[[:space:]]*:[[:space:]]*"[^"]+' --include='appsettings*.json' .
# no output = clean
```

> The development `Jwt:Key` is a **known, non-secret placeholder** that only exists so
> a fresh checkout can boot locally; it is ≥32 chars to pass the validator. It MUST be
> overridden by `JWT_SECRET` (env var)/(user-secrets) in any shared or deployed
> environment — never rely on the placeholder outside local dev.

The DB placeholder is different: `appsettings.Development.json` intentionally keeps
`Password=glpi` as a **tripwire** — the startup validator rejects it, forcing every dev
to supply the real string from user-secrets. Non-development config must never contain
it:

```bash
grep -RIn 'Password=glpi\|Password=changeme' --include='appsettings.json' --include='appsettings.Production.json' .
# no output = clean
```

`appsettings.Development.json` is intentionally **not** git-ignored because it contains
no secrets; keeping it tracked documents the expected keys. `.env` **is** git-ignored.

## Rules

- Never commit real values to `appsettings.json`, `appsettings.Development.json`,
  `docker-compose.yml`, or any doc.
- Prefer `dotnet user-secrets` for local work and environment variables / a secret
  manager in any deployed environment.
- Rotate a token immediately if it is ever pasted into a chat, ticket, or log.
- Do not weaken the startup validation to "make it boot"; provision the secret instead.
