#!/usr/bin/env bash
set -euo pipefail

# Lee MARIADB_PASSWORD del .env si no está exportada.
if [ -z "${MARIADB_PASSWORD:-}" ] && [ -f .env ]; then
  MARIADB_PASSWORD=$(grep '^MARIADB_PASSWORD=' .env | cut -d '=' -f2-)
fi
MARIADB_USER="${MARIADB_USER:-glpi}"

mariadb_exec() {
  docker compose exec -T glpi-db mariadb -u"${MARIADB_USER}" -p"${MARIADB_PASSWORD}" glpi "$@"
}

# 1. Bootstrap mínimo si la BD está vacía.
if ! mariadb_exec -e "SELECT 1 FROM glpi_tickets LIMIT 1" >/dev/null 2>&1; then
  echo "BD vacía, aplicando bootstrap desde scripts/glpi-base.sql..."
  mariadb_exec < scripts/glpi-base.sql
  mariadb_exec < scripts/glpi-schema-events-logs.sql
fi

# 2. Estructura H-38 (Desarrollo / BI / Service Desk) + fixtures de Playwright.
#    Todo el estado vive en scripts/seed-e2e.sql para que local y CI coincidan.
echo "Aplicando estructura H-38 + fixtures E2E desde scripts/seed-e2e.sql..."
mariadb_exec < scripts/seed-e2e.sql

# 3. Preferencias y tokens de los usuarios de fixture, para empezar limpio.
docker compose exec -T app-db psql -U app -d glpi_ticket_manager -c \
  "DELETE FROM user_preferences WHERE user_id IN (7, 18);" >/dev/null 2>&1 || true
docker compose exec -T app-db psql -U app -d glpi_ticket_manager -c \
  "DELETE FROM revoked_tokens WHERE user_id IN (7, 18);" >/dev/null 2>&1 || true

echo "E2E state seeded (3 grupos, 8 usuarios de estructura y fixtures Playwright)."
