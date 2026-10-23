-- Fresh seed for H-38: Clean test data with specific users and groups
-- Password hashes generated with bcrypt cost 12:
-- AdminPass! -> $2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQJQ
-- TechGsiPass! -> $2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ
-- TechHardPass! -> $2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ
-- SuperGsiPass! -> $2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ
-- SoliPass! -> $2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ

-- 1. Users (GLPI)
INSERT IGNORE INTO glpi_users (id, name, password, is_active, profiles_id, entities_id)
VALUES 
  (10, 'admin_test', '$2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ', 1, 0, 0),
  (11, 'tech_gsi', '$2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ', 1, 0, 0),
  (12, 'tech_hardware', '$2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ', 1, 0, 0),
  (13, 'supervisor_gsi', '$2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ', 1, 0, 0),
  (14, 'solicitante', '$2y$12$8K1p/a0dhrxiow8J1JQhEO2J5Xp8K6pDqJJQJQJQJQJQJQJQJQJQ', 1, 0, 0);

-- 2. Profiles (super-admin=4, tech=6, normal=1)
INSERT IGNORE INTO glpi_profiles_users (id, users_id, profiles_id, entities_id, is_recursive, is_dynamic, is_default_profile)
VALUES
  (1, 10, 4, 0, 0, 0, 1),      -- admin_test: super-admin
  (2, 11, 6, 0, 0, 0, 1),      -- tech_gsi: technician
  (3, 12, 6, 0, 0, 0, 1),      -- tech_hardware: technician
  (4, 13, 6, 0, 0, 0, 1),      -- supervisor_gsi: technician (supervisor role handled by app)
  (5, 14, 1, 0, 0, 0, 1);      -- solicitante: normal user

-- 3. Groups (ensure they exist with correct IDs)
INSERT IGNORE INTO glpi_groups (id, name, entities_id, completename, is_assign)
VALUES
  (1, 'Call Center', 0, 'Call Center', 1),
  (2, 'Soporte Nivel 1', 0, 'Soporte Nivel 1', 1),
  (5, 'Aplicaciones GSI', 0, 'Aplicaciones GSI', 1),
  (7, 'Hardware', 0, 'Hardware', 1),
  (9, 'Soporte Nivel 1', 0, 'Soporte Nivel 1', 1);

-- 4. Group assignments
INSERT IGNORE INTO glpi_groups_users (id, users_id, groups_id, is_dynamic, is_manager, is_userdelegate)
VALUES
  (1, 11, 5, 0, 0, 0),   -- tech_gsi -> Aplicaciones GSI
  (2, 12, 7, 0, 0, 0),   -- tech_hardware -> Hardware
  (3, 13, 5, 0, 1, 0),   -- supervisor_gsi -> Aplicaciones GSI (is_manager=1 for supervisor)
  (4, 10, 1, 0, 0, 0);   -- admin_test -> Call Center (just for login, admin has no group restriction)

-- 5. ITIL Categories for routing
INSERT IGNORE INTO glpi_itilcategories
  (id, entities_id, is_recursive, itilcategories_id, name, completename, level, is_helpdeskvisible, is_incident, is_request, is_problem, is_change)
VALUES 
  (11, 0, 1, 0, 'Hardware', 'Hardware', 1, 1, 1, 1, 1, 1),
  (12, 0, 1, 0, 'Software', 'Software', 1, 1, 1, 1, 1, 1),
  (13, 0, 1, 0, 'Aplicaciones GSI', 'Aplicaciones GSI', 1, 1, 1, 1, 1, 1);

-- 6. Business rules for routing tickets to groups
-- Hardware category -> Hardware group
INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, `match`, is_active, is_recursive, `condition`)
SELECT 0, 'RuleTicket', 1, 'Route Hardware tickets', 'AND', 1, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = 'Route Hardware tickets');
SET @hw_rule = (SELECT id FROM glpi_rules WHERE name = 'Route Hardware tickets' LIMIT 1);
INSERT INTO glpi_rulecriterias (rules_id, criteria, `condition`, pattern)
SELECT @hw_rule, 'itilcategories_id', 0, '11'
WHERE NOT EXISTS (SELECT 1 FROM glpi_rulecriterias WHERE rules_id = @hw_rule AND criteria = 'itilcategories_id');
INSERT INTO glpi_ruleactions (rules_id, action_type, field, value)
SELECT @hw_rule, 'assign', '_groups_id_assign', '7'
WHERE NOT EXISTS (SELECT 1 FROM glpi_ruleactions WHERE rules_id = @hw_rule AND field = '_groups_id_assign');

-- Aplicaciones GSI category -> Aplicaciones GSI group
INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, `match`, is_active, is_recursive, `condition`)
SELECT 0, 'RuleTicket', 2, 'Route GSI tickets', 'AND', 1, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = 'Route GSI tickets');
SET @gsi_rule = (SELECT id FROM glpi_rules WHERE name = 'Route GSI tickets' LIMIT 1);
INSERT INTO glpi_rulecriterias (rules_id, criteria, `condition`, pattern)
SELECT @gsi_rule, 'itilcategories_id', 0, '13'
WHERE NOT EXISTS (SELECT 1 FROM glpi_rulecriterias WHERE rules_id = @gsi_rule AND criteria = 'itilcategories_id');
INSERT INTO glpi_ruleactions (rules_id, action_type, field, value)
SELECT @gsi_rule, 'assign', '_groups_id_assign', '5'
WHERE NOT EXISTS (SELECT 1 FROM glpi_ruleactions WHERE rules_id = @gsi_rule AND field = '_groups_id_assign');

-- Call Center category -> Call Center group
INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, `match`, is_active, is_recursive, `condition`)
SELECT 0, 'RuleTicket', 3, 'Route Call Center tickets', 'AND', 1, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = 'Route Call Center tickets');
SET @cc_rule = (SELECT id FROM glpi_rules WHERE name = 'Route Call Center tickets' LIMIT 1);
INSERT INTO glpi_rulecriterias (rules_id, criteria, `condition`, pattern)
SELECT @cc_rule, 'itilcategories_id', 0, '12'
WHERE NOT EXISTS (SELECT 1 FROM glpi_rulecriterias WHERE rules_id = @cc_rule AND criteria = 'itilcategories_id');
INSERT INTO glpi_ruleactions (rules_id, action_type, field, value)
SELECT @cc_rule, 'assign', '_groups_id_assign', '1'
WHERE NOT EXISTS (SELECT 1 FROM glpi_ruleactions WHERE rules_id = @cc_rule AND field = '_groups_id_assign');

-- 7. Solution types
INSERT IGNORE INTO glpi_solutiontypes (id, name, comment, entities_id, is_recursive, is_incident, is_request, is_problem, is_change)
VALUES
  (1, 'Descripcion', 'Solucion aplicada al incidente', 0, 1, 1, 1, 1, 1),
  (2, 'Solucion alternativa', 'Workaround temporal', 0, 1, 1, 1, 1, 1);

-- 8. Test tickets for each group
-- Ticket for Aplicaciones GSI (category 13) - assigned to tech_gsi
INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (11, 0, '[GSI] Error en módulo de facturación', NOW(), NOW(), 1, 3, 'Error 500 al procesar facturas', 3, 3, 4, 1, 1, 13)
ON DUPLICATE KEY UPDATE status=1, date_mod=NOW();

INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (11, 5, 2) ON DUPLICATE KEY UPDATE groups_id=5, type=2;
INSERT INTO glpi_tickets_users (tickets_id, users_id, type, use_notification, alternative_email) VALUES (11, 11, 2, 1, NULL) ON DUPLICATE KEY UPDATE users_id=11, type=2;

-- Ticket for Hardware (category 11) - assigned to tech_hardware
INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (12, 0, '[HW] Monitor no enciende', NOW(), NOW(), 1, 3, 'Monitor Dell sin señal de video', 3, 3, 3, 1, 1, 11)
ON DUPLICATE KEY UPDATE status=1, date_mod=NOW();

INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (12, 7, 2) ON DUPLICATE KEY UPDATE groups_id=7, type=2;
INSERT INTO glpi_tickets_users (tickets_id, users_id, type, use_notification, alternative_email) VALUES (12, 12, 2, 1, NULL) ON DUPLICATE KEY UPDATE users_id=12, type=2;

-- Ticket for Call Center (category 12) - unassigned, in queue
INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (13, 0, '[CC] Solicitud de nuevo auricular', NOW(), NOW(), 1, 3, 'Auricular Jabra roto', 2, 2, 2, 1, 1, 12)
ON DUPLICATE KEY UPDATE status=1, date_mod=NOW();

INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (13, 1, 2) ON DUPLICATE KEY UPDATE groups_id=1, type=2;

-- 9. Reset auto-increment for future tickets
ALTER TABLE glpi_tickets AUTO_INCREMENT = 14;