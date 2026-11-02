#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="db/migrations"

if [ ! -d "${MIGRATIONS_DIR}" ]; then
    echo "ERROR: ${MIGRATIONS_DIR} not found" >&2
    exit 1
fi

TARGET_DB="${1:-${APP_DB_DATABASE:-}}"
DB_USER="${2:-${APP_DB_USER:-app}}"
DB_CONTAINER="${3:-${APP_DB_CONTAINER:-}}"

# 1. Destino explícito obligatorio
if [ -z "${TARGET_DB}" ]; then
    echo "ERROR: Target database must be explicitly specified." >&2
    echo "Usage: $0 <target_database> [db_user] [db_container]" >&2
    echo "Or set environment variables: APP_DB_DATABASE, APP_DB_USER, APP_DB_CONTAINER" >&2
    exit 1
fi

# 2. Comprobación del nombre de la base (alfanumérico y guiones bajos únicamente)
if ! [[ "${TARGET_DB}" =~ ^[a-zA-Z0-9_]+$ ]]; then
    echo "ERROR: Invalid database name '${TARGET_DB}'. Only alphanumeric characters and underscores are allowed." >&2
    exit 1
fi

# 3. Rechazo de destinos protegidos durante pruebas / desarrollo no productivo
PROTECTED_DATABASES=("glpi_ticket_manager_reference" "glpi_ticket_manager_prod" "glpi_prod")
if [ "${PREVENT_PROTECTED:-1}" = "1" ]; then
    for protected in "${PROTECTED_DATABASES[@]}"; do
        if [ "${TARGET_DB}" = "${protected}" ]; then
            echo "ERROR: Refusing to run migrations on protected database '${TARGET_DB}'." >&2
            exit 1
        fi
    done
fi

# Helper para ejecutar SQL con detención ante errores (ON_ERROR_STOP=1)
run_psql() {
    if [ -n "${DB_CONTAINER}" ]; then
        docker exec -i "${DB_CONTAINER}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${TARGET_DB}" "$@"
    elif command -v docker >/dev/null 2>&1 && docker compose ps app-db >/dev/null 2>&1; then
        docker compose exec -T app-db psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${TARGET_DB}" "$@"
    else
        psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${TARGET_DB}" "$@"
    fi
}

echo "Ensuring schema_migrations table exists on '${TARGET_DB}'..."
run_psql <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum TEXT,
    applied_by TEXT NOT NULL DEFAULT 'system'
);
SQL

# Iterar sobre las migraciones ordenadas
for migration in $(ls "${MIGRATIONS_DIR}"/*.sql | sort); do
    version=$(basename "${migration}" .sql)
    checksum=$(sha256sum "${migration}" | cut -d' ' -f1)

    # Verificar si ya está aplicada
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
    # Ejecución y registro transaccional: ambos se aplican en una única transacción atómica
    {
        echo "BEGIN;"
        cat "${migration}"
        echo "INSERT INTO schema_migrations (version, checksum, applied_by) VALUES ('${version}', '${checksum}', 'migrate-app-db.sh');"
        echo "COMMIT;"
    } | run_psql

    echo "Successfully applied ${version}."
done

echo "All migrations applied successfully to '${TARGET_DB}'."
