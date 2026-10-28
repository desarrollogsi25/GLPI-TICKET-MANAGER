-- ============================================================================
-- H-38 / H-41 · Estructura organizacional REAL: 3 grupos (Desarrollo, BI, Service Desk)
-- ----------------------------------------------------------------------------
-- Seed idempotente. Se puede ejecutar N veces sin duplicar filas.
-- Todos los usuarios de la estructura tienen la contraseña: Password123!
-- (hash bcrypt $2y$12 generado con `php -r password_hash(...)` sobre el propio
--  contenedor GLPI, por lo que es verificable por BCrypt.Net).
--
-- NOTA: scripts/seed-e2e.sql contiene esta misma sección organizacional MAS los
-- fixtures que Playwright necesita. Si cambias grupos/usuarios/categorías aquí,
-- replica el cambio allí (el reset E2E lo ejecuta antes de cada suite).
-- ============================================================================

-- 1. GRUPOS -----------------------------------------------------------------
INSERT INTO glpi_groups (id, name, entities_id, completename, is_assign)
VALUES
  (1, 'Desarrollo',  0, 'Desarrollo',   1),
  (2, 'BI',          0, 'BI',           1),
  (3, 'Service Desk', 0, 'Service Desk', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), completename = VALUES(completename), is_assign = 1;

-- 2. UNICIDAD Y CATEGORÍAS ITIL JERÁRQUICAS (H-41) ---------------------------
-- Regla de unicidad en GLPI 11 (Configuración > Unicidad) para ITILCategory
-- basada en `name,itilcategories_id` con rechazo de duplicados (action_refuse = 1).
INSERT INTO glpi_fieldunicities
  (id, name, is_recursive, itemtype, entities_id, fields, is_active, action_refuse, action_notify, comment, date_mod, date_creation)
VALUES
  (1, 'Unicidad Categorías ITIL', 1, 'ITILCategory', 0, 'name,itilcategories_id', 1, 1, 0, 'H-41: Rechazar categorías ITIL duplicadas', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  is_recursive = 1,
  itemtype = 'ITILCategory',
  fields = 'name,itilcategories_id',
  is_active = 1,
  action_refuse = 1,
  date_mod = NOW();

-- Eliminar duplicados actuales (conservando el ID más bajo de cada par duplicado).
DELETE FROM glpi_itilcategories WHERE id IN (8, 9, 10, 12, 13, 14) OR id > 19;

-- Estructura jerárquica limpia sin nombres repetidos:
-- Raíces por grupo/servicio:
--   1 = Desarrollo (raíz grupo Desarrollo)
--   2 = Requerimiento (raíz histórica E2E)
--   5 = Aplicaciones (raíz de aplicaciones)
--   6 = Sistema (raíz de infraestructura/sistema)
--   7 = Service Desk (raíz grupo Service Desk)
--  10 = BI (raíz grupo BI)
INSERT INTO glpi_itilcategories
  (id, entities_id, is_recursive, itilcategories_id, name, completename, level, is_helpdeskvisible, is_incident, is_request, is_problem, is_change)
VALUES
  -- Raíces (Nivel 1)
  (1,  0, 1, 0,  'Desarrollo',       'Desarrollo',                         1, 1, 1, 1, 1, 1),
  (2,  0, 1, 0,  'Requerimiento',    'Requerimiento',                      1, 1, 1, 1, 1, 1),
  (5,  0, 1, 0,  'Aplicaciones',     'Aplicaciones',                       1, 1, 1, 1, 1, 1),
  (6,  0, 1, 0,  'Sistema',          'Sistema',                            1, 1, 1, 1, 1, 1),
  (7,  0, 1, 0,  'Service Desk',     'Service Desk',                       1, 1, 1, 1, 1, 1),
  (10, 0, 1, 0,  'BI',               'BI',                                 1, 1, 1, 1, 1, 1),
  -- Subcategorías de Requerimiento (2)
  (3,  0, 1, 2,  'Acceso a sistema', 'Requerimiento > Acceso a sistema',   2, 1, 1, 1, 1, 1),
  -- Subcategorías de Desarrollo (1)
  (4,  0, 1, 1,  'Software',         'Desarrollo > Software',              2, 1, 1, 1, 1, 1),
  (9,  0, 1, 1,  'Aplicaciones GSI', 'Desarrollo > Aplicaciones GSI',      2, 1, 1, 1, 1, 1),
  (11, 0, 1, 1,  'Dev',              'Desarrollo > Dev',                   2, 1, 1, 1, 1, 1),
  -- Subcategorías de BI (10)
  (14, 0, 1, 10, 'Requerimiento BI', 'BI > Requerimiento BI',              2, 1, 1, 1, 1, 1),
  (18, 0, 1, 10, 'Informes',         'BI > Informes',                      2, 1, 1, 1, 1, 1),
  -- Subcategorías de Service Desk (7)
  (15, 0, 1, 7,  'Call Center',      'Service Desk > Call Center',         2, 1, 1, 1, 1, 1),
  (16, 0, 1, 7,  'Hardware',         'Service Desk > Hardware',            2, 1, 1, 1, 1, 1),
  (17, 0, 1, 7,  'Soporte Nivel 1',  'Service Desk > Soporte Nivel 1',     2, 1, 1, 1, 1, 1),
  (19, 0, 1, 7,  'Periféricos',      'Service Desk > Periféricos',         2, 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE
  itilcategories_id = VALUES(itilcategories_id),
  name = VALUES(name),
  completename = VALUES(completename),
  level = VALUES(level),
  is_helpdeskvisible = 1;

-- 3. ENRUTAMIENTO CATEGORÍA -> GRUPO (reglas de negocio de GLPI) -------------
-- La API resuelve el grupo destino leyendo estas reglas
-- (TicketRepository.GetAssignmentGroupForCategoryAsync), por lo que son la
-- fuente de verdad del enrutamiento.
UPDATE glpi_rules SET is_active = 0 WHERE name LIKE 'Enrutamiento ITIL%';

INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, `match`, is_active, is_recursive, `condition`)
SELECT 0, 'RuleTicket', 1, 'H38 Route Desarrollo', 'OR', 1, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = 'H38 Route Desarrollo');
SET @rule_dev = (SELECT id FROM glpi_rules WHERE name = 'H38 Route Desarrollo' LIMIT 1);

INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, `match`, is_active, is_recursive, `condition`)
SELECT 0, 'RuleTicket', 2, 'H38 Route BI', 'OR', 1, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = 'H38 Route BI');
SET @rule_bi = (SELECT id FROM glpi_rules WHERE name = 'H38 Route BI' LIMIT 1);

INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, `match`, is_active, is_recursive, `condition`)
SELECT 0, 'RuleTicket', 3, 'H38 Route Service Desk', 'OR', 1, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = 'H38 Route Service Desk');
SET @rule_sd = (SELECT id FROM glpi_rules WHERE name = 'H38 Route Service Desk' LIMIT 1);

-- Criterios (condition = 0 -> "es")
DELETE FROM glpi_rulecriterias WHERE rules_id IN (@rule_dev, @rule_bi, @rule_sd);
INSERT INTO glpi_rulecriterias (rules_id, criteria, `condition`, pattern) VALUES
  (@rule_dev, 'itilcategories_id', 0, '1'),   -- Desarrollo (raíz)
  (@rule_dev, 'itilcategories_id', 0, '4'),   -- Desarrollo > Software
  (@rule_dev, 'itilcategories_id', 0, '5'),   -- Aplicaciones
  (@rule_dev, 'itilcategories_id', 0, '9'),   -- Desarrollo > Aplicaciones GSI
  (@rule_dev, 'itilcategories_id', 0, '11'),  -- Desarrollo > Dev
  (@rule_bi,  'itilcategories_id', 0, '10'),  -- BI (raíz)
  (@rule_bi,  'itilcategories_id', 0, '14'),  -- BI > Requerimiento BI
  (@rule_bi,  'itilcategories_id', 0, '18'),  -- BI > Informes
  (@rule_sd,  'itilcategories_id', 0, '2'),   -- Requerimiento
  (@rule_sd,  'itilcategories_id', 0, '3'),   -- Requerimiento > Acceso a sistema
  (@rule_sd,  'itilcategories_id', 0, '6'),   -- Sistema
  (@rule_sd,  'itilcategories_id', 0, '7'),   -- Service Desk (raíz)
  (@rule_sd,  'itilcategories_id', 0, '15'),  -- Service Desk > Call Center
  (@rule_sd,  'itilcategories_id', 0, '16'),  -- Service Desk > Hardware
  (@rule_sd,  'itilcategories_id', 0, '17'),  -- Service Desk > Soporte Nivel 1
  (@rule_sd,  'itilcategories_id', 0, '19');  -- Service Desk > Periféricos

DELETE FROM glpi_ruleactions WHERE rules_id IN (@rule_dev, @rule_bi, @rule_sd);
INSERT INTO glpi_ruleactions (rules_id, action_type, field, value) VALUES
  (@rule_dev, 'assign', '_groups_id_assign', '1'),
  (@rule_bi,  'assign', '_groups_id_assign', '2'),
  (@rule_sd,  'assign', '_groups_id_assign', '3');

-- 4. TIPOS DE SOLUCIÓN ------------------------------------------------------
INSERT INTO glpi_solutiontypes (id, name, comment, entities_id, is_recursive, is_incident, is_request, is_problem, is_change)
VALUES
  (1, 'Descripcion', 'Solucion aplicada al incidente', 0, 1, 1, 1, 1, 1),
  (2, 'Solucion alternativa', 'Workaround temporal', 0, 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 5. USUARIOS DE LA ESTRUCTURA (contraseña: Password123!) --------------------
-- H-39: GLPI 11 only authenticates users with authtype = 1 (DB_GLPI) AND
-- auths_id = 0. Rows inserted without these columns default to authtype = 0 and
-- are invisible to Auth::connection_db() (HTTP 400 "Usuario o contraseña
-- incorrecto"). Keep both columns explicit here so re-seeding never breaks login.
INSERT INTO glpi_users
  (id, name, password, password_last_update, authtype, auths_id, is_active, is_deleted, profiles_id, entities_id, date_creation, date_mod)
VALUES
  (10, 'admin_test', '$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (11, 'lider_dev',  '$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (12, 'lider_bi',   '$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (13, 'lider_sd',   '$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (14, 'tech_dev',   '$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (15, 'tech_bi',    '$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (16, 'tech_sd',    '$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (17, 'user_test',  '$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  password_last_update = VALUES(password_last_update),
  authtype = 1,
  auths_id = 0,
  is_active = 1,
  is_deleted = 0,
  date_mod = NOW();

-- Perfiles GLPI: 4 = Super-Admin, 6 = Technician, 1 = Self-Service
-- (los líderes obtienen el rol app "supervisor" mediante user_role_overrides
--  en PostgreSQL, ver docs/qa/credenciales-prueba.md).
DELETE FROM glpi_profiles_users WHERE users_id IN (10, 11, 12, 13, 14, 15, 16, 17);
INSERT INTO glpi_profiles_users (users_id, profiles_id, entities_id, is_recursive, is_dynamic, is_default_profile) VALUES
  (10, 4, 0, 1, 0, 1),  -- admin_test  -> admin
  (11, 6, 0, 0, 0, 1),  -- lider_dev   -> supervisor (override)
  (12, 6, 0, 0, 0, 1),  -- lider_bi    -> supervisor (override)
  (13, 6, 0, 0, 0, 1),  -- lider_sd    -> supervisor (override)
  (14, 6, 0, 0, 0, 1),  -- tech_dev
  (15, 6, 0, 0, 0, 1),  -- tech_bi
  (16, 6, 0, 0, 0, 1),  -- tech_sd
  (17, 1, 0, 0, 0, 1);  -- user_test   -> solicitante

-- Pertenencia a grupos (is_manager = 1 para líderes).
DELETE FROM glpi_groups_users WHERE users_id IN (10, 11, 12, 13, 14, 15, 16, 17);
INSERT INTO glpi_groups_users (users_id, groups_id, is_dynamic, is_manager, is_userdelegate) VALUES
  (11, 1, 0, 1, 0),   -- lider_dev -> Desarrollo
  (12, 2, 0, 1, 0),   -- lider_bi  -> BI
  (13, 3, 0, 1, 0),   -- lider_sd  -> Service Desk
  (14, 1, 0, 0, 0),   -- tech_dev  -> Desarrollo
  (15, 2, 0, 0, 0),   -- tech_bi   -> BI
  (16, 3, 0, 0, 0);   -- tech_sd   -> Service Desk
  -- admin_test y user_test no pertenecen a ningún grupo operativo.

-- 6. TICKETS DEMO (uno por grupo, sin asignar: aparecen en la cola) ----------
INSERT INTO glpi_tickets
  (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (11, 0, '[Dev] Error en modulo de facturacion', NOW(), NOW(), 1, 3, 'Error 500 al procesar facturas.', 3, 3, 4, 1, 1, 4),
  (12, 0, '[BI] Dashboard no actualiza datos',    NOW(), NOW(), 1, 3, 'El dashboard de ventas no refresca desde ayer.', 3, 3, 3, 1, 1, 14),
  (13, 0, '[SD] Monitor no enciende',             NOW(), NOW(), 1, 3, 'Monitor Dell sin senal de video.', 3, 3, 3, 1, 1, 16),
  (14, 0, '[SD] Solicitud nuevo auricular',       NOW(), NOW(), 1, 3, 'Auricular Jabra roto.', 2, 2, 2, 1, 1, 15)
ON DUPLICATE KEY UPDATE
  status = 1, solvedate = NULL, closedate = NULL, date_mod = NOW(), is_deleted = 0, itilcategories_id = VALUES(itilcategories_id);

DELETE FROM glpi_groups_tickets WHERE tickets_id IN (11, 12, 13, 14);
INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES
  (11, 1, 2),  -- Desarrollo
  (12, 2, 2),  -- BI
  (13, 3, 2),  -- Service Desk
  (14, 3, 2);  -- Service Desk

DELETE FROM glpi_tickets_users WHERE tickets_id IN (11, 12, 13, 14) AND type = 2;
DELETE FROM glpi_itilsolutions WHERE itemtype = 'Ticket' AND items_id IN (11, 12, 13, 14);
DELETE FROM glpi_itilfollowups WHERE itemtype = 'Ticket' AND items_id IN (11, 12, 13, 14);

ALTER TABLE glpi_tickets AUTO_INCREMENT = 15;
ALTER TABLE glpi_users AUTO_INCREMENT = 18;
-- ============================================================================
-- SECCIÓN 2 · FIXTURES E2E (Playwright)
-- ----------------------------------------------------------------------------
-- Usuarios y tickets reservados por los specs. tech1 conserva la contraseña
-- histórica Tech1Pass! porque playwright.config.ts y global-setup.ts la usan.
-- Todos los tickets de fixture viven en el grupo 1 (Desarrollo) y tech1 es
-- miembro de Desarrollo + Service Desk para probar el selector multi-grupo.
-- ============================================================================

-- Usuarios de fixture
INSERT INTO glpi_users
  (id, name, password, password_last_update, authtype, auths_id, is_active, is_deleted, profiles_id, entities_id, date_creation, date_mod)
VALUES
  (7,  'tech1',            '$2y$12$P.ZiC0.ym8zmfw1WHIMf1OH6NenRUoODqaO.WviG65v.HhCW/pTmW', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (8,  'tech2',            '$2y$12$P.ZiC0.ym8zmfw1WHIMf1OH6NenRUoODqaO.WviG65v.HhCW/pTmW', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW()),
  (18, 'solicitante_test', '$2y$12$P.ZiC0.ym8zmfw1WHIMf1OH6NenRUoODqaO.WviG65v.HhCW/pTmW', NOW(), 1, 0, 1, 0, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  password_last_update = VALUES(password_last_update),
  authtype = 1,
  auths_id = 0,
  is_active = 1,
  is_deleted = 0,
  date_mod = NOW();

DELETE FROM glpi_profiles_users WHERE users_id IN (7, 8, 18);
INSERT INTO glpi_profiles_users (users_id, profiles_id, entities_id, is_recursive, is_dynamic, is_default_profile) VALUES
  (7,  6, 0, 0, 0, 1),  -- tech1 -> technician
  (8,  6, 0, 0, 0, 1),  -- tech2 -> technician
  (18, 1, 0, 0, 0, 1);  -- solicitante_test -> self-service

DELETE FROM glpi_groups_users WHERE users_id IN (7, 8, 18);
INSERT INTO glpi_groups_users (users_id, groups_id, is_dynamic, is_manager, is_userdelegate) VALUES
  (7, 1, 0, 0, 0),  -- tech1 -> Desarrollo
  (7, 3, 0, 0, 0),  -- tech1 -> Service Desk (selector multi-grupo)
  (8, 1, 0, 0, 0);  -- tech2 -> Desarrollo

-- Correos por defecto de todos los usuarios de seed (H-39).
DELETE FROM glpi_useremails WHERE users_id IN (7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18);
INSERT INTO glpi_useremails (users_id, is_default, is_dynamic, email) VALUES
  (7,  1, 0, 'tech1@example.test'),
  (8,  1, 0, 'tech2@example.test'),
  (10, 1, 0, 'admin_test@example.test'),
  (11, 1, 0, 'lider_dev@example.test'),
  (12, 1, 0, 'lider_bi@example.test'),
  (13, 1, 0, 'lider_sd@example.test'),
  (14, 1, 0, 'tech_dev@example.test'),
  (15, 1, 0, 'tech_bi@example.test'),
  (16, 1, 0, 'tech_sd@example.test'),
  (17, 1, 0, 'user_test@example.test'),
  (18, 1, 0, 'solicitante_test@example.test');

-- Limpiar tickets dinámicos creados por tests E2E anteriores (id >= 1000)
DELETE FROM glpi_itilsolutions WHERE itemtype = 'Ticket' AND items_id >= 1000;
DELETE FROM glpi_itilfollowups WHERE itemtype = 'Ticket' AND items_id >= 1000;
DELETE FROM glpi_tickets_users WHERE tickets_id >= 1000;
DELETE FROM glpi_groups_tickets WHERE tickets_id >= 1000;
DELETE FROM glpi_tickets WHERE id >= 1000;

-- Tickets de cola: #11 (kanban-flow), #57 (self-assign), #61 (kanban-mobile),
-- #70 (realtime-reopen), #901/#902/#903 (resolve / short-solution).
INSERT INTO glpi_tickets
  (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (11,  0, 'PASO3-C llamante externo (usuario generico)', NOW(), NOW(), 1, 3, 'Llamante: Juan Perez | Telefono: +34 600 111 222 | Empresa: ACME. Consulta de facturacion.', 3, 3, 3, 1, 1, 2),
  (57,  0, 'TEST claim y resolucion',                     NOW(), NOW(), 1, 3, 'Ticket #57 para prueba de claim y solucion', 3, 3, 3, 1, 1, 2),
  (61,  0, 'TEST sin asignar kanban-mobile', '2026-10-10 10:00:00', '2026-10-10 10:00:00', 1, 3, 'Ticket para test E2E kanban-mobile', 3, 3, 5, 1, 1, 2),
  (70,  0, 'TEST reapertura ticket tech1',                 NOW(), NOW(), 1, 3, 'Ticket para prueba E2E de reapertura', 3, 3, 3, 1, 1, 2),
  (901, 0, 'QA resolve-ticket fixture',                    NOW(), NOW(), 1, 3, 'Fixture para resolve-ticket.spec.ts', 3, 3, 3, 1, 1, 2),
  (902, 0, 'QA short-solution UI fixture',                 NOW(), NOW(), 1, 3, 'Fixture UI para resolve-short-solution.spec.ts', 3, 3, 3, 1, 1, 2),
  (903, 0, 'QA short-solution API fixture',                NOW(), NOW(), 1, 3, 'Fixture API para resolve-short-solution.spec.ts', 3, 3, 3, 1, 1, 2),
  (904, 0, 'QA pending-ticket fixture',                   NOW(), NOW(), 1, 3, 'Fixture para pending-ticket.spec.ts', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), content = VALUES(content), date = VALUES(date),
  status = 1, solvedate = NULL, closedate = NULL, priority = 3,
  itilcategories_id = 2, is_deleted = 0, date_mod = NOW();

UPDATE glpi_tickets SET date = '2026-10-10 10:00:00', date_mod = '2026-10-10 10:00:00', priority = 5 WHERE id = 61;

DELETE FROM glpi_groups_tickets WHERE tickets_id IN (11, 57, 61, 70, 81, 82, 83, 84, 85, 86, 901, 902, 903, 904);
INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES
  (11, 1, 2), (57, 1, 2), (61, 1, 2), (70, 1, 2),
  (81, 1, 2), (82, 1, 2), (83, 1, 2), (84, 1, 2), (85, 1, 2), (86, 1, 2),
  (901, 1, 2), (902, 1, 2), (903, 1, 2), (904, 1, 2);

DELETE FROM glpi_tickets_users WHERE tickets_id IN (11, 57, 61, 70, 81, 82, 83, 84, 85, 86, 901, 902, 903, 904) AND type = 2;
DELETE FROM glpi_itilsolutions WHERE itemtype = 'Ticket' AND items_id IN (11, 57, 61, 70, 81, 82, 83, 84, 85, 86, 901, 902, 903, 904);
DELETE FROM glpi_itilfollowups WHERE itemtype = 'Ticket' AND items_id IN (11, 57, 61, 70, 81, 82, 83, 84, 85, 86, 901, 902, 903, 904);

-- Orden del Kanban (ids reservados 81-86, asignados a tech1).
INSERT INTO glpi_tickets
  (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (81, 0, 'ORDER FIFO A (older)', '2026-02-01 08:00:00', '2026-02-01 08:00:00', 3, 3, 'Orden FIFO', 3, 3, 5, 1, 1, 2),
  (82, 0, 'ORDER FIFO B (newer)', '2026-03-01 08:00:00', '2026-03-01 08:00:00', 3, 3, 'Orden FIFO', 3, 3, 1, 1, 1, 2),
  (83, 0, 'ORDER WAIT A (older)', '2026-02-02 08:00:00', '2026-02-02 08:00:00', 4, 3, 'Orden FIFO', 3, 3, 4, 1, 1, 2),
  (84, 0, 'ORDER WAIT B (newer)', '2026-03-02 08:00:00', '2026-03-02 08:00:00', 4, 3, 'Orden FIFO', 3, 3, 2, 1, 1, 2),
  (85, 0, 'ORDER DONE A (older)', '2026-02-03 08:00:00', '2026-02-03 08:00:00', 6, 3, 'Orden LIFO', 3, 3, 3, 1, 1, 2),
  (86, 0, 'ORDER DONE B (newer)', '2026-03-03 08:00:00', '2026-03-03 08:00:00', 6, 3, 'Orden LIFO', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), status = VALUES(status), date = VALUES(date), date_mod = VALUES(date_mod),
  priority = VALUES(priority), itilcategories_id = 2, is_deleted = 0,
  closedate = IF(VALUES(status) = 6, VALUES(date), NULL),
  solvedate = IF(VALUES(status) = 6, VALUES(date), NULL);

INSERT INTO glpi_tickets_users (tickets_id, users_id, type, use_notification, alternative_email) VALUES
  (81, 7, 2, 1, NULL), (82, 7, 2, 1, NULL), (83, 7, 2, 1, NULL),
  (84, 7, 2, 1, NULL), (85, 7, 2, 1, NULL), (86, 7, 2, 1, NULL);

INSERT INTO glpi_itilsolutions (itemtype, items_id, date_creation, date_mod, content, status, users_id, users_id_editor)
VALUES
  ('Ticket', 85, '2026-02-03 08:05:00', '2026-02-03 08:05:00', 'Solucion resuelto antiguo', 2, 7, 7),
  ('Ticket', 86, '2026-03-03 08:05:00', '2026-03-03 08:05:00', 'Solucion resuelto reciente', 2, 7, 7);

-- NOTA: no degradar los fixtures 81/82 (status 3) a status 2. kanban-sorting.spec.ts
-- espera verlos en la columna "En progreso", y el INSERT ... ON DUPLICATE KEY UPDATE
-- de arriba ya los deja en su estado canónico en cada reset.

ALTER TABLE glpi_tickets AUTO_INCREMENT = 1000;
