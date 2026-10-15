#!/usr/bin/env bash
set -euo pipefail

# Leer MARIADB_PASSWORD del .env si no está exportada
if [ -z "${MARIADB_PASSWORD:-}" ] && [ -f .env ]; then
  MARIADB_PASSWORD=$(grep '^MARIADB_PASSWORD=' .env | cut -d '=' -f2-)
fi

# 1. Aplicar dump base si la BD está vacía (fallback de bootstrap)
if ! docker compose exec -T glpi-db mariadb -u glpi -p"${MARIADB_PASSWORD}" glpi -e "SELECT 1 FROM glpi_tickets LIMIT 1" >/dev/null 2>&1; then
  echo "BD vacía, aplicando bootstrap desde scripts/glpi-base.sql..."
  docker compose exec -T glpi-db mariadb -u glpi -p"${MARIADB_PASSWORD}" glpi < scripts/glpi-base.sql
  docker compose exec -T glpi-db mariadb -u glpi -p"${MARIADB_PASSWORD}" glpi < scripts/glpi-schema-events-logs.sql
fi

# 2. Crear/actualizar fixtures (idempotente)
docker compose exec -T glpi-db mariadb -u glpi -p"${MARIADB_PASSWORD}" glpi <<'SQL'
INSERT IGNORE INTO glpi_users (id, name, password, is_active, profiles_id, entities_id)
VALUES 
  (7, 'tech1', '$2y$12$P.ZiC0.ym8zmfw1WHIMf1OH6NenRUoODqaO.WviG65v.HhCW/pTmW', 1, 0, 0),
  (8, 'tech2', '$2y$12$3G7IE3WmAXFBOUJwnIC4aOfG.wq6kFscRmgcRrpXwHZpyql9ohU1u', 1, 0, 0),
  (9, 'user1', '$2y$12$IQ1owWOfVxbcjByiKsmGf.mJqEFeFVXRNdDtVmqA5kyoTEZUNFxAC', 1, 0, 0);

INSERT IGNORE INTO glpi_profiles_users (id, users_id, profiles_id, entities_id, is_recursive, is_dynamic, is_default_profile)
VALUES
  (6, 7, 6, 0, 0, 0, 1),
  (7, 8, 6, 0, 0, 0, 1),
  (8, 9, 1, 0, 0, 0, 1);

INSERT IGNORE INTO glpi_groups (id, name, entities_id, completename)
VALUES
  (1, 'Call Center', 0, 'Call Center'),
  (2, 'Soporte Nivel 1', 0, 'Soporte Nivel 1');

INSERT IGNORE INTO glpi_groups_users (id, users_id, groups_id, is_dynamic, is_manager, is_userdelegate)
VALUES
  (1, 7, 1, 0, 0, 0),
  (2, 8, 2, 0, 0, 0);

INSERT IGNORE INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (11, 0, 'PASO3-C llamante externo (usuario generico)', NOW(), NOW(), 1, 3, 'Llamante: Juan Perez | Telefono: +34 600 111 222 | Empresa: ACME. Consulta de facturacion.', 3, 3, 3, 1, 1, 2);

INSERT IGNORE INTO glpi_groups_tickets (tickets_id, groups_id, type)
VALUES
  (11, 1, 2);

INSERT IGNORE INTO glpi_itilcategories 
  (id, entities_id, name, itilcategories_id, completename, level) VALUES
  (2, 0, 'Requerimiento', 0, 'Requerimiento', 1),
  (3, 0, 'Acceso a sistema', 2, 'Requerimiento > Acceso a sistema', 2),
  (4, 0, 'Software', 2, 'Requerimiento > Software', 2),
  (5, 0, 'Aplicaciones', 0, 'Aplicaciones', 1),
  (6, 0, 'Sistema', 0, 'Sistema', 1);

-- 3. Resetear tickets #11 y #57 al estado "listo para claim"
UPDATE glpi_tickets SET status=1, solvedate=NULL, closedate=NULL, itilcategories_id=2 WHERE id=11;
DELETE FROM glpi_tickets_users WHERE tickets_id=11 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=11;

UPDATE glpi_tickets SET status=1, solvedate=NULL, closedate=NULL WHERE id=57;
DELETE FROM glpi_tickets_users WHERE tickets_id=57 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=57;
SQL

# 4. Limpiar preferencias de usuario tech1 (id=7) en app-db para inicio limpio
docker compose exec -T app-db psql -U app -d glpi_ticket_manager -c \
  "DELETE FROM user_preferences WHERE user_id = 7;" >/dev/null 2>&1 || true

# 5. Limpiar tokens revocados para que cada run empiece limpio
echo "Cleaning revoked_tokens..."
docker compose exec -T app-db psql -U app -d glpi_ticket_manager -c \
  "DELETE FROM revoked_tokens WHERE user_id = 7;" > /dev/null 2>&1 || true

echo "E2E state seeded (fixtures created, ticket #11 reset, preferences cleaned, revoked tokens cleaned)."
