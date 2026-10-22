INSERT IGNORE INTO glpi_users (id, name, password, is_active, profiles_id, entities_id)
VALUES 
  (7, 'tech1', '$2y$12$P.ZiC0.ym8zmfw1WHIMf1OH6NenRUoODqaO.WviG65v.HhCW/pTmW', 1, 0, 0),
  (8, 'tech2', '$2y$12$3G7IE3WmAXFBOUJwnIC4aOfG.wq6kFscRmgcRrpXwHZpyql9ohU1u', 1, 0, 0),
  (9, 'user1', '$2y$12$IQ1owWOfVxbcjByiKsmGf.mJqEFeFVXRNdDtVmqA5kyoTEZUNFxAC', 1, 0, 0),
  (11, 'admin_test', '$2y$12$tlgSn9hSrb3WsXSDqBHYMekJ9IkpVKIY5E1fhr/4ovA2EIf99ELQS', 1, 0, 0),
  (15, 'solicitante_test', '$2y$12$7o6vKn3csvK.j0oLd8EJuexEbVYj1zXmPqaJuyNWmCF.sp/vwSZCW', 1, 0, 0);

INSERT IGNORE INTO glpi_profiles_users (id, users_id, profiles_id, entities_id, is_recursive, is_dynamic, is_default_profile)
VALUES
  (6, 7, 6, 0, 0, 0, 1),
  (7, 8, 6, 0, 0, 0, 1),
  (8, 9, 1, 0, 0, 0, 1),
  (9, 11, 1, 0, 0, 1, 1),
  (10, 11, 4, 0, 1, 0, 0),
  (18, 15, 1, 0, 0, 0, 1);

INSERT IGNORE INTO glpi_groups (id, name, entities_id, completename, is_assign)
VALUES
  (1, 'Call Center', 0, 'Call Center', 1),
  (2, 'Soporte Nivel 1', 0, 'Soporte Nivel 1', 1),
  (3, 'Requerimiento Service Desk', 0, 'Requerimiento Service Desk', 1),
  (4, 'Requerimiento BI', 0, 'Requerimiento BI', 1),
  (5, 'Aplicaciones GSI', 0, 'Aplicaciones GSI', 1),
  (6, 'Periféricos', 0, 'Periféricos', 1),
  (7, 'Hardware', 0, 'Hardware', 1),
  (8, 'Software', 0, 'Software', 1),
  (9, 'Informes', 0, 'Informes', 1);

INSERT IGNORE INTO glpi_itilcategories
  (id, entities_id, is_recursive, itilcategories_id, name, completename, level, is_helpdeskvisible, is_incident, is_request, is_problem, is_change)
VALUES (11, 0, 1, 0, 'Hardware', 'Hardware', 1, 1, 1, 1, 1, 1);

INSERT IGNORE INTO glpi_groups_users (id, users_id, groups_id, is_dynamic, is_manager, is_userdelegate)
VALUES
  (1, 7, 1, 0, 0, 0),
  (2, 8, 2, 0, 0, 0);

-- tech1 (id 7) must also be a member of the Hardware group (id 7) so the E2E
-- specs can select that group in the Kanban/queue. Idempotent: only inserts if
-- the (users_id, groups_id) pair is not already present.
INSERT INTO glpi_groups_users (users_id, groups_id, is_dynamic, is_manager, is_userdelegate)
SELECT 7, 7, 0, 0, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM glpi_groups_users WHERE users_id = 7 AND groups_id = 7);

-- Keep the Hardware category routed into a group visible to the E2E technician.
INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, `match`, is_active, is_recursive, `condition`)
SELECT 0, 'RuleTicket', 1, 'E2E Hardware ticket routing', 'AND', 1, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = 'E2E Hardware ticket routing');
SET @e2e_hardware_rule = (SELECT id FROM glpi_rules WHERE name = 'E2E Hardware ticket routing' LIMIT 1);
INSERT INTO glpi_rulecriterias (rules_id, criteria, `condition`, pattern)
SELECT @e2e_hardware_rule, 'itilcategories_id', 0, '11'
WHERE NOT EXISTS (SELECT 1 FROM glpi_rulecriterias WHERE rules_id = @e2e_hardware_rule AND criteria = 'itilcategories_id');
INSERT INTO glpi_ruleactions (rules_id, action_type, field, value)
SELECT @e2e_hardware_rule, 'assign', '_groups_id_assign', '7'
WHERE NOT EXISTS (SELECT 1 FROM glpi_ruleactions WHERE rules_id = @e2e_hardware_rule AND field = '_groups_id_assign');

INSERT IGNORE INTO glpi_solutiontypes (id, name, comment, entities_id, is_recursive, is_incident, is_request, is_problem, is_change)
VALUES
  (1, 'Descripcion', 'Solucion aplicada al incidente', 0, 1, 1, 1, 1, 1),
  (2, 'Solucion alternativa', 'Workaround temporal', 0, 1, 1, 1, 1, 1);

INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (11, 0, 'PASO3-C llamante externo (usuario generico)', NOW(), NOW(), 1, 3, 'Llamante: Juan Perez | Telefono: +34 600 111 222 | Empresa: ACME. Consulta de facturacion.', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE 
  status = 1, solvedate = NULL, closedate = NULL, priority = 3, date_mod = NOW();

INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (61, 0, 'TEST sin asignar kanban-mobile', '2026-10-10 10:00:00', '2026-10-10 10:00:00', 1, 3, 'Ticket para test E2E kanban-mobile', 3, 3, 5, 1, 1, 2)
ON DUPLICATE KEY UPDATE 
  status = 1, solvedate = NULL, closedate = NULL, priority = 5, date = '2026-10-10 10:00:00', date_mod = '2026-10-10 10:00:00';

INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type)
VALUES
  (11, 1, 2),
  (57, 1, 2),
  (61, 1, 2),
  (70, 1, 2),
  (901, 1, 2),
  (902, 1, 2),
  (903, 1, 2)
ON DUPLICATE KEY UPDATE groups_id = 1, type = 2;

INSERT IGNORE INTO glpi_itilcategories 
  (id, entities_id, name, itilcategories_id, completename, level) VALUES
  (2, 0, 'Requerimiento', 0, 'Requerimiento', 1),
  (3, 0, 'Acceso a sistema', 2, 'Requerimiento > Acceso a sistema', 2),
  (4, 0, 'Software', 2, 'Requerimiento > Software', 2),
  (5, 0, 'Aplicaciones', 0, 'Aplicaciones', 1),
  (6, 0, 'Sistema', 0, 'Sistema', 1);

-- 3. Resetear tickets al estado "listo para claim"
UPDATE glpi_tickets SET status=1, solvedate=NULL, closedate=NULL, priority=3, itilcategories_id=2 WHERE id=11;
DELETE FROM glpi_tickets_users WHERE tickets_id=11 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=11;

UPDATE glpi_tickets SET status=1, solvedate=NULL, closedate=NULL, priority=3, itilcategories_id=2, content='Ticket #57 para prueba de claim y solucion' WHERE id=57;
DELETE FROM glpi_tickets_users WHERE tickets_id=57 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=57;

UPDATE glpi_tickets SET status=1, solvedate=NULL, closedate=NULL, priority=5, date='2026-10-10 10:00:00', date_mod='2026-10-10 10:00:00' WHERE id=61;
DELETE FROM glpi_tickets_users WHERE tickets_id=61 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=61;

INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (70, 0, 'TEST reapertura ticket tech1', NOW(), NOW(), 1, 3, 'Ticket para prueba E2E de reapertura', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE 
  status = 1, solvedate = NULL, closedate = NULL, priority = 3, itilcategories_id = 2, date_mod = NOW();
DELETE FROM glpi_tickets_users WHERE tickets_id=70 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=70;
DELETE FROM glpi_itilfollowups WHERE itemtype='Ticket' AND items_id=70;

INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (901, 0, 'QA resolve-ticket fixture', NOW(), NOW(), 1, 3, 'Fixture para resolve-ticket.spec.ts', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE 
  status = 1, solvedate = NULL, closedate = NULL, priority = 3, itilcategories_id = 2, date_mod = NOW();
DELETE FROM glpi_tickets_users WHERE tickets_id=901 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=901;
DELETE FROM glpi_itilfollowups WHERE itemtype='Ticket' AND items_id=901;

-- BUG-031 (H-31): fixtures for the short-solution resolve regression.
-- #902 drives the UI flow (claimed from the group queue by the spec).
-- #903 drives the API flow (claimed through POST /api/tickets/{id}/claim by the spec).
INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES (902, 0, 'QA short-solution UI fixture', NOW(), NOW(), 1, 3, 'Fixture UI para resolve-short-solution.spec.ts', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE
  status = 1, solvedate = NULL, closedate = NULL, priority = 3, itilcategories_id = 2, date_mod = NOW();
DELETE FROM glpi_tickets_users WHERE tickets_id=902 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=902;
DELETE FROM glpi_itilfollowups WHERE itemtype='Ticket' AND items_id=902;

INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES (903, 0, 'QA short-solution API fixture', NOW(), NOW(), 1, 3, 'Fixture API para resolve-short-solution.spec.ts', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE
  status = 1, solvedate = NULL, closedate = NULL, priority = 3, itilcategories_id = 2, date_mod = NOW();
DELETE FROM glpi_tickets_users WHERE tickets_id=903 AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=903;
DELETE FROM glpi_itilfollowups WHERE itemtype='Ticket' AND items_id=903;

UPDATE glpi_tickets SET status=2 WHERE status=3 AND id IN (SELECT tickets_id FROM glpi_tickets_users WHERE users_id=7 AND type=2);

-- 3b. Fixtures for Kanban ordering (reserved ids 81-86, assigned to tech1/user1)
INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (81, 0, 'ORDER FIFO A (older)',    '2026-02-01 08:00:00', '2026-02-01 08:00:00', 3, 3, 'Orden FIFO', 3, 3, 5, 1, 1, 2),
  (82, 0, 'ORDER FIFO B (newer)',    '2026-03-01 08:00:00', '2026-03-01 08:00:00', 3, 3, 'Orden FIFO', 3, 3, 1, 1, 1, 2),
  (83, 0, 'ORDER WAIT A (older)',    '2026-02-02 08:00:00', '2026-02-02 08:00:00', 4, 3, 'Orden FIFO', 3, 3, 4, 1, 1, 2),
  (84, 0, 'ORDER WAIT B (newer)',    '2026-03-02 08:00:00', '2026-03-02 08:00:00', 4, 3, 'Orden FIFO', 3, 3, 2, 1, 1, 2),
  (85, 0, 'ORDER DONE A (older)',    '2026-02-03 08:00:00', '2026-02-03 08:00:00', 6, 3, 'Orden LIFO', 3, 3, 3, 1, 1, 2),
  (86, 0, 'ORDER DONE B (newer)',    '2026-03-03 08:00:00', '2026-03-03 08:00:00', 6, 3, 'Orden LIFO', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), status = VALUES(status), date = VALUES(date), date_mod = VALUES(date_mod),
  priority = VALUES(priority), closedate = IF(VALUES(status) = 6, VALUES(date), NULL),
  solvedate = IF(VALUES(status) = 6, VALUES(date), NULL);

DELETE FROM glpi_tickets_users WHERE tickets_id IN (81, 82, 83, 84, 85, 86);
INSERT INTO glpi_tickets_users (tickets_id, users_id, type, use_notification, alternative_email)
VALUES
  (81, 7, 2, 1, NULL),
  (82, 7, 2, 1, NULL),
  (83, 7, 2, 1, NULL),
  (84, 7, 2, 1, NULL),
  (85, 7, 2, 1, NULL),
  (86, 7, 2, 1, NULL);

DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id IN (85, 86);
INSERT INTO glpi_itilsolutions (itemtype, items_id, date_creation, date_mod, content, status, users_id, users_id_editor)
VALUES
  ('Ticket', 85, '2026-02-03 08:05:00', '2026-02-03 08:05:00', 'Solucion resuelto antiguo', 2, 7, 7),
  ('Ticket', 86, '2026-03-03 08:05:00', '2026-03-03 08:05:00', 'Solucion resuelto reciente', 2, 7, 7);
