#!/usr/bin/env bash
# =============================================================================
# H-47 · Provisión de Webhook en GLPI (MariaDB)
# Uso: bash scripts/provision-glpi-webhooks.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/glpi-migrations/007_glpi_webhook_config.sql"

if [ ! -f "${SQL_FILE}" ]; then
  echo "ERROR: ${SQL_FILE} not found"
  exit 1
fi

if [ -z "${MARIADB_PASSWORD:-}" ] && [ -f .env ]; then
  MARIADB_PASSWORD=$(grep '^MARIADB_PASSWORD=' .env | cut -d '=' -f2-)
fi
MARIADB_USER="${MARIADB_USER:-glpi}"

mariadb_exec() {
  docker compose exec -T glpi-db mariadb -u"${MARIADB_USER}" -p"${MARIADB_PASSWORD}" glpi "$@"
}

echo "Aplicando ${SQL_FILE} contra glpi-db (MariaDB)..."
mariadb_exec < "${SQL_FILE}"
echo "Webhook provisionado exitosamente en glpi-db."
