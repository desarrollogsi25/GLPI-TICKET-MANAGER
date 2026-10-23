-- Clean up GLPI test data (respecting FK order)
DELETE FROM glpi_itilfollowups WHERE itemtype = 'Ticket' AND items_id > 10;
DELETE FROM glpi_itilsolutions WHERE itemtype = 'Ticket' AND items_id > 10;
DELETE FROM glpi_tickets_users WHERE tickets_id > 10;
DELETE FROM glpi_groups_tickets WHERE tickets_id > 10;
DELETE FROM glpi_tickets WHERE id > 10;
DELETE FROM glpi_users WHERE id > 16 AND id != 4; -- Keep tech (id 4) and default users
DELETE FROM glpi_profiles_users WHERE users_id > 16 AND users_id != 4;
-- Reset auto-increment
ALTER TABLE glpi_tickets AUTO_INCREMENT = 11;
ALTER TABLE glpi_users AUTO_INCREMENT = 17;
ALTER TABLE glpi_itilfollowups AUTO_INCREMENT = 1;
ALTER TABLE glpi_itilsolutions AUTO_INCREMENT = 1;