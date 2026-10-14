#!/usr/bin/env bash
set -euo pipefail

# Leer MARIADB_PASSWORD del .env si no está exportada
if [ -z "${MARIADB_PASSWORD:-}" ] && [ -f .env ]; then
  MARIADB_PASSWORD=$(grep '^MARIADB_PASSWORD=' .env | cut -d '=' -f2-)
fi

# Resetea el ticket #11 al estado "listo para claim"
docker compose exec -T glpi-db mariadb -u glpi -p"${MARIADB_PASSWORD}" glpi <<SQL
UPDATE glpi_tickets SET status=1, solvedate=NULL, closedate=NULL WHERE id=11;
DELETE FROM glpi_tickets_users WHERE tickets_id=11 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=11;
SQL

echo "E2E state seeded (ticket #11 reset)."
