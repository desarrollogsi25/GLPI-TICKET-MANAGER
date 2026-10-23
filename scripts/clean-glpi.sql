-- ============================================================================
-- H-38 · Limpieza profunda de datos de prueba en GLPI (MariaDB)
-- ----------------------------------------------------------------------------
-- Este entorno NO es producción: todos los tickets, soluciones, seguimientos y
-- usuarios de prueba se eliminan. Se conservan los usuarios de sistema de GLPI
-- (glpi, post-only, tech, normal, glpi-system) y el super-admin `glpi`.
-- Tras ejecutar este script hay que aplicar scripts/seed-h38.sql
-- (o scripts/seed-e2e.sql para la suite Playwright).
-- ============================================================================

-- 1. Datos ligados a tickets (primero las tablas hijas).
DELETE FROM glpi_itilfollowups;
DELETE FROM glpi_itilsolutions;
DELETE FROM glpi_ticketvalidations;
DELETE FROM glpi_tickets_users;
DELETE FROM glpi_groups_tickets;
DELETE FROM glpi_suppliers_tickets;
DELETE FROM glpi_tickets_tickets;
DELETE FROM glpi_documents_items WHERE itemtype = 'Ticket';
DELETE FROM glpi_logs WHERE itemtype LIKE 'Ticket%';
DELETE FROM glpi_tickets;

-- 2. Usuarios de prueba (ids >= 7). Se conservan 1..6 (sistema + glpi).
DELETE FROM glpi_groups_users   WHERE users_id >= 7;
DELETE FROM glpi_profiles_users WHERE users_id >= 7;
DELETE FROM glpi_users          WHERE id >= 7;

-- 3. Grupos antiguos: la estructura válida es 1=Desarrollo, 2=BI, 3=Service Desk.
DELETE FROM glpi_groups_users   WHERE groups_id NOT IN (1, 2, 3);
DELETE FROM glpi_groups_tickets WHERE groups_id NOT IN (1, 2, 3);
DELETE FROM glpi_groups         WHERE id NOT IN (1, 2, 3);

-- 4. Reglas de enrutamiento antiguas (se recrean limpia y únicamente en el seed).
DELETE FROM glpi_ruleactions    WHERE rules_id IN (SELECT id FROM glpi_rules WHERE name IN
  ('Route Desarrollo', 'Route BI', 'Route Service Desk', 'E2E Hardware ticket routing', 'H38 Route Desarrollo', 'H38 Route BI', 'H38 Route Service Desk'));
DELETE FROM glpi_rulecriterias  WHERE rules_id IN (SELECT id FROM glpi_rules WHERE name IN
  ('Route Desarrollo', 'Route BI', 'Route Service Desk', 'E2E Hardware ticket routing', 'H38 Route Desarrollo', 'H38 Route BI', 'H38 Route Service Desk'));
DELETE FROM glpi_rules          WHERE name IN
  ('Route Desarrollo', 'Route BI', 'Route Service Desk', 'E2E Hardware ticket routing', 'H38 Route Desarrollo', 'H38 Route BI', 'H38 Route Service Desk');

-- 5. Contadores.
ALTER TABLE glpi_tickets         AUTO_INCREMENT = 11;
ALTER TABLE glpi_users           AUTO_INCREMENT = 10;
ALTER TABLE glpi_itilfollowups   AUTO_INCREMENT = 1;
ALTER TABLE glpi_itilsolutions   AUTO_INCREMENT = 1;
