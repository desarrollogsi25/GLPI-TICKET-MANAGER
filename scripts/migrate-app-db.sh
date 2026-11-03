#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="db/migrations"

if [ ! -d "${MIGRATIONS_DIR}" ]; then
    echo "ERROR: ${MIGRATIONS_DIR} not found" >&2
    exit 1
fi

TARGET_DB="${1:-${APP_DB_DATABASE:-}}"
DB_USER="${2:-${APP_DB_USER:-app}}"
TARGET_CONTAINER="${3:-${APP_DB_CONTAINER:-}}"
TARGET_PROJECT="${COMPOSE_PROJECT_NAME:-${DOCKER_PROJECT:-}}"

# 1. Destino explícito obligatorio y validación de nombre
if [ -z "${TARGET_DB}" ]; then
    echo "ERROR: Target database must be explicitly specified." >&2
    echo "Usage: $0 <target_database> [db_user] [target_container]" >&2
    echo "Or set environment variables: APP_DB_DATABASE, APP_DB_USER, APP_DB_CONTAINER, COMPOSE_PROJECT_NAME" >&2
    exit 1
fi

if ! [[ "${TARGET_DB}" =~ ^[a-zA-Z0-9_]+$ ]]; then
    echo "ERROR: Invalid database name '${TARGET_DB}'. Only alphanumeric characters and underscores are allowed." >&2
    exit 1
fi

# 2. Rechazo de bases protegidas y protección de laboratorio de referencia
PROTECTED_DATABASES=("glpi_ticket_manager_reference" "glpi_ticket_manager_prod" "glpi_prod")
if [ "${PREVENT_PROTECTED:-1}" = "1" ]; then
    for protected in "${PROTECTED_DATABASES[@]}"; do
        if [ "${TARGET_DB}" = "${protected}" ]; then
            echo "ERROR: Refusing to run migrations on protected database '${TARGET_DB}'." >&2
            exit 1
        fi
    done
fi

if [ "${TARGET_DB}" = "glpi_ticket_manager" ]; then
    # Protección explícita para la base glpi_ticket_manager en entornos de laboratorio de referencia
    if [ "${ALLOW_REFERENCE_DB:-0}" != "1" ]; then
        echo "ERROR: Refusing to run migrations on reference lab database 'glpi_ticket_manager'." >&2
        echo "Set ALLOW_REFERENCE_DB=1 if explicitly intended for this environment." >&2
        exit 1
    fi
fi

# 3. Selección verificable del contenedor o proyecto Docker de destino (prohibido fallback implícito)
if [ -z "${TARGET_CONTAINER}" ] && [ -z "${TARGET_PROJECT}" ]; then
    if [ "${ALLOW_DIRECT_PSQL:-0}" != "1" ]; then
        echo "ERROR: Verifiable Docker container or Compose project must be explicitly specified." >&2
        echo "Pass container as 3rd parameter, or export APP_DB_CONTAINER or COMPOSE_PROJECT_NAME." >&2
        exit 1
    fi
fi

if [ -n "${TARGET_PROJECT}" ]; then
    RESOLVED_CONTAINER=$(docker compose -p "${TARGET_PROJECT}" ps -q app-db 2>/dev/null || echo "")
    if [ -z "${RESOLVED_CONTAINER}" ]; then
        echo "ERROR: No 'app-db' container found for Compose project '${TARGET_PROJECT}'." >&2
        exit 1
    fi
    if [ -n "${TARGET_CONTAINER}" ] && [ "${TARGET_CONTAINER}" != "${RESOLVED_CONTAINER}" ]; then
        echo "ERROR: Specified container '${TARGET_CONTAINER}' does not match project container '${RESOLVED_CONTAINER}'." >&2
        exit 1
    fi
    TARGET_CONTAINER="${RESOLVED_CONTAINER}"
fi

CONTAINER_PROJECT=""
CONTAINER_NAME=""
if [ -n "${TARGET_CONTAINER}" ]; then
    if ! docker inspect -f '{{.State.Running}}' "${TARGET_CONTAINER}" 2>/dev/null | grep -q "true"; then
        echo "ERROR: Target container '${TARGET_CONTAINER}' does not exist or is not running." >&2
        exit 1
    fi
    CONTAINER_PROJECT=$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' "${TARGET_CONTAINER}" 2>/dev/null || echo "")
    CONTAINER_NAME=$(docker inspect -f '{{.Name}}' "${TARGET_CONTAINER}" 2>/dev/null || echo "${TARGET_CONTAINER}")
    echo "Verified container identity: ${CONTAINER_NAME} (project: ${CONTAINER_PROJECT:-none})"
fi

# Helper para ejecutar SQL con detención ante errores (ON_ERROR_STOP=1)
run_psql() {
    if [ -n "${TARGET_CONTAINER}" ]; then
        docker exec -i "${TARGET_CONTAINER}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${TARGET_DB}" "$@"
    else
        psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${TARGET_DB}" "$@"
    fi
}

# 4. Verificación de current_database() antes de ejecutar cualquier SQL
CURRENT_DB=$(run_psql -tAc "SELECT current_database();" 2>/dev/null || echo "")
if [ "${CURRENT_DB}" != "${TARGET_DB}" ]; then
    echo "ERROR: Database identity mismatch! Expected '${TARGET_DB}', but connected to '${CURRENT_DB}'." >&2
    exit 1
fi
echo "Verified target database: current_database()='${CURRENT_DB}'"

echo "Ensuring schema_migrations table exists on '${TARGET_DB}'..."
run_psql <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum TEXT,
    applied_by TEXT NOT NULL DEFAULT 'system'
);
SQL

# 5. Iterar sobre las migraciones ordenadas con verificación de checksums y ejecución atómica
for migration in $(ls "${MIGRATIONS_DIR}"/*.sql | sort); do
    version=$(basename "${migration}" .sql)
    checksum=$(sha256sum "${migration}" | cut -d' ' -f1)

    existing=$(run_psql -tAc "SELECT checksum FROM schema_migrations WHERE version = '${version}'" 2>/dev/null || echo "")

    if [ -n "${existing}" ]; then
        if [ "${existing}" != "${checksum}" ]; then
            echo "ERROR: Migration ${version} was already applied but was modified!" >&2
            echo "  Expected: ${existing}" >&2
            echo "  Current:  ${checksum}" >&2
            exit 1
        fi
        echo "Skipping ${version} (already applied and checksum matches)"
        continue
    fi

    echo "Applying ${version} atomically..."
    {
        echo "BEGIN;"
        cat "${migration}"
        echo "INSERT INTO schema_migrations (version, checksum, applied_by) VALUES ('${version}', '${checksum}', 'migrate-app-db.sh');"
        echo "COMMIT;"
    } | run_psql

    echo "Successfully applied ${version}."
done

echo "All migrations applied successfully to '${TARGET_DB}'."
