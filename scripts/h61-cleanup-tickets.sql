-- H-61: Limpieza total de tickets e historiales sin tocar usuarios ni grupos
DELETE FROM glpi_itilsolutions;
DELETE FROM glpi_itilfollowups;
DELETE FROM glpi_tickets_users;
DELETE FROM glpi_groups_tickets;
DELETE FROM glpi_tickets;
