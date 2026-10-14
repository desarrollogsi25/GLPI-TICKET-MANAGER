#!/usr/bin/env bash
# Applies all PostgreSQL migrations in db/migrations/ in lexicographic order.
# Idempotent: each migration uses IF NOT EXISTS.
# Can be re-run safely on existing volumes.

set -euo pipefail

MIGRATIONS_DIR="db/migrations"

if [ ! -d "${MIGRATIONS_DIR}" ]; then
  echo "ERROR: ${MIGRATIONS_DIR} not found"
  exit 1
fi

MIGRATIONS=$(ls "${MIGRATIONS_DIR}"/*.sql 2>/dev/null | sort)
if [ -z "${MIGRATIONS}" ]; then
  echo "No migrations found in ${MIGRATIONS_DIR}"
  exit 0
fi

for migration in ${MIGRATIONS}; do
  echo "Applying ${migration}..."
  docker compose exec -T app-db psql -U app -d glpi_ticket_manager < "${migration}"
done

echo "All migrations applied."
