#!/usr/bin/env bash
set -euo pipefail

# Lee MARIADB_PASSWORD del .env si no está exportada.
if [ -z "${MARIADB_PASSWORD:-}" ] && [ -f .env ]; then
  MARIADB_PASSWORD=$(grep '^MARIADB_PASSWORD=' .env | cut -d '=' -f2-)
fi
MARIADB_USER="${MARIADB_USER:-glpi}"

# No E2E password or bcrypt hash may be committed to the repository.
for required in E2E_TECH_PASSWORD E2E_REQUESTER_PASSWORD E2E_ADMIN_PASSWORD; do
  if [ -z "${!required:-}" ]; then
    echo "ERROR: missing E2E secret: ${required}" >&2
    exit 1
  fi
done

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

# Generate GLPI-compatible hashes in the PHP container. The passwords are sent
# via stdin and never appear in MariaDB queries or workflow log messages.
hash_password() {
  printf '%s' "$1" | docker compose exec -T glpi php -r \
    'echo password_hash(stream_get_contents(STDIN), PASSWORD_BCRYPT);'
}

tech_hash=$(hash_password "$E2E_TECH_PASSWORD")
requester_hash=$(hash_password "$E2E_REQUESTER_PASSWORD")
admin_hash=$(hash_password "$E2E_ADMIN_PASSWORD")

for hash in "$tech_hash" "$requester_hash" "$admin_hash"; do
  if [ "${#hash}" -ne 60 ]; then
    echo "ERROR: GLPI PHP did not return a valid bcrypt hash" >&2
    exit 1
  fi
done

mariadb_exec -e "UPDATE glpi_users SET password='${tech_hash}', password_last_update=NOW() WHERE id IN (7,8,11,12,13,14,15,16);"
mariadb_exec -e "UPDATE glpi_users SET password='${requester_hash}', password_last_update=NOW() WHERE name IN ('user1','user_test','solicitante_test');"
mariadb_exec -e "UPDATE glpi_users SET password='${admin_hash}', password_last_update=NOW() WHERE name='admin_test';"
unset tech_hash requester_hash admin_hash

# 3. Preferencias y tokens de los usuarios de fixture, para empezar limpio.
docker compose exec -T app-db psql -U app -d glpi_ticket_manager -c \
  "DELETE FROM user_preferences WHERE user_id IN (7, 18);" >/dev/null 2>&1 || true
docker compose exec -T app-db psql -U app -d glpi_ticket_manager -c \
  "DELETE FROM revoked_tokens WHERE user_id IN (7, 18);" >/dev/null 2>&1 || true

echo "E2E state seeded (3 grupos, 8 usuarios de estructura y fixtures Playwright)."
