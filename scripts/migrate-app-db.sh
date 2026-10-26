#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="db/migrations"

if [ ! -d "${MIGRATIONS_DIR}" ]; then
    echo "ERROR: ${MIGRATIONS_DIR} not found"
    exit 1
fi

# Asegurar tabla de control
docker compose exec -T app-db psql -U app -d glpi_ticket_manager <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum TEXT,
    applied_by TEXT NOT NULL DEFAULT 'system'
);
SQL

for migration in $(ls "${MIGRATIONS_DIR}"/*.sql | sort); do
    version=$(basename "${migration}" .sql)

    # Excluir migraciones no pertenecientes a PostgreSQL (ej. scripts GLPI MariaDB)
    if [ "${version}" = "007_glpi_webhook_config" ] || [[ "${migration}" =~ glpi_webhook ]]; then
        echo "Skipping non-PostgreSQL migration: ${migration}"
        continue
    fi
    
    checksum=$(sha256sum "${migration}" | cut -d' ' -f1)
    
    # Verificar si ya está aplicada
    existing=$(docker compose exec -T app-db psql -U app -d glpi_ticket_manager -tAc \
        "SELECT checksum FROM schema_migrations WHERE version = '${version}'" 2>/dev/null || echo "")
    
    if [ -n "${existing}" ]; then
        if [ "${existing}" != "${checksum}" ]; then
            echo "ERROR: Migration ${version} was already applied but was modified!"
            echo "  Expected: ${existing}"
            echo "  Current:  ${checksum}"
            exit 1
        fi
        echo "Skipping ${version} (already applied)"
        continue
    fi
    
    echo "Applying ${version}..."
    docker compose exec -T app-db psql -U app -d glpi_ticket_manager < "${migration}"
    
    docker compose exec -T app-db psql -U app -d glpi_ticket_manager <<SQL
    INSERT INTO schema_migrations (version, checksum, applied_by)
    VALUES ('${version}', '${checksum}', 'migrate-app-db.sh');
SQL
done

echo "All migrations applied."
