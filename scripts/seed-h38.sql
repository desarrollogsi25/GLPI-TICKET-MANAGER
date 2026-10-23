-- ============================================================================
-- H-38 · Estructura organizacional REAL: 3 grupos (Desarrollo, BI, Service Desk)
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

-- 2. CATEGORÍAS ITIL --------------------------------------------------------
-- Categorías "de servicio" usadas por /services y por las pruebas E2E.
INSERT INTO glpi_itilcategories
  (id, entities_id, is_recursive, itilcategories_id, name, completename, level, is_helpdeskvisible, is_incident, is_request, is_problem, is_change)
VALUES
  (2, 0, 1, 0, 'Requerimiento', 'Requerimiento', 1, 1, 1, 1, 1, 1),
  (3, 0, 1, 2, 'Acceso a sistema', 'Requerimiento > Acceso a sistema', 2, 1, 1, 1, 1, 1),
  (4, 0, 1, 2, 'Software', 'Requerimiento > Software', 2, 1, 1, 1, 1, 1),
  (5, 0, 1, 0, 'Aplicaciones', 'Aplicaciones', 1, 1, 1, 1, 1, 1),
  (6, 0, 1, 0, 'Sistema', 'Sistema', 1, 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), completename = VALUES(completename);

-- Categorías funcionales de la nueva estructura.
INSERT INTO glpi_itilcategories
  (id, entities_id, is_recursive, itilcategories_id, name, completename, level, is_helpdeskvisible, is_incident, is_request, is_problem, is_change)
VALUES
  -- Desarrollo
  (11, 0, 1, 0, 'dev',              'dev',              1, 1, 1, 1, 1, 1),
  (12, 0, 1, 0, 'aplicaciones gsi', 'aplicaciones gsi', 1, 1, 1, 1, 1, 1),
  (13, 0, 1, 0, 'software',         'software',         1, 1, 1, 1, 1, 1),
  -- BI
  (14, 0, 1, 0, 'requerimiento BI', 'requerimiento BI', 1, 1, 1, 1, 1, 1),
  -- Service Desk
  (15, 0, 1, 0, 'Call Center',      'Call Center',      1, 1, 1, 1, 1, 1),
  (16, 0, 1, 0, 'Hardware',         'Hardware',         1, 1, 1, 1, 1, 1),
  (17, 0, 1, 0, 'Soporte Nivel 1',  'Soporte Nivel 1',  1, 1, 1, 1, 1, 1),
  (18, 0, 1, 0, 'Informes',         'Informes',         1, 1, 1, 1, 1, 1),
  (19, 0, 1, 0, 'Periféricos',      'Periféricos',      1, 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), completename = VALUES(completename), level = 1;

-- 3. ENRUTAMIENTO CATEGORÍA -> GRUPO (reglas de negocio de GLPI) -------------
-- La API resuelve el grupo destino leyendo estas reglas
-- (TicketRepository.GetAssignmentGroupForCategoryAsync), por lo que son la
-- fuente de verdad del enrutamiento.
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
  (@rule_dev, 'itilcategories_id', 0, '11'),  -- dev
  (@rule_dev, 'itilcategories_id', 0, '12'),  -- aplicaciones gsi
  (@rule_dev, 'itilcategories_id', 0, '13'),  -- software
  (@rule_bi,  'itilcategories_id', 0, '14'),  -- requerimiento BI
  (@rule_sd,  'itilcategories_id', 0, '15'),  -- Call Center
  (@rule_sd,  'itilcategories_id', 0, '16'),  -- Hardware
  (@rule_sd,  'itilcategories_id', 0, '17'),  -- Soporte Nivel 1
  (@rule_sd,  'itilcategories_id', 0, '18'),  -- Informes
  (@rule_sd,  'itilcategories_id', 0, '19'),  -- Periféricos
  (@rule_sd,  'itilcategories_id', 0, '2');   -- Requerimiento (genérica)

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

-- Correos por defecto (GLPI 11 muestra la cuenta sin email como incompleta y
-- algunos flujos de notificación fallan). H-39.
DELETE FROM glpi_useremails WHERE users_id IN (10, 11, 12, 13, 14, 15, 16, 17);
INSERT INTO glpi_useremails (users_id, is_default, is_dynamic, email) VALUES
  (10, 1, 0, 'admin_test@example.test'),
  (11, 1, 0, 'lider_dev@example.test'),
  (12, 1, 0, 'lider_bi@example.test'),
  (13, 1, 0, 'lider_sd@example.test'),
  (14, 1, 0, 'tech_dev@example.test'),
  (15, 1, 0, 'tech_bi@example.test'),
  (16, 1, 0, 'tech_sd@example.test'),
  (17, 1, 0, 'user_test@example.test');

-- 6. TICKETS DEMO (uno por grupo, sin asignar: aparecen en la cola) ----------
INSERT INTO glpi_tickets
  (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES
  (11, 0, '[Dev] Error en modulo de facturacion', NOW(), NOW(), 1, 3, 'Error 500 al procesar facturas.', 3, 3, 4, 1, 1, 13),
  (12, 0, '[BI] Dashboard no actualiza datos',    NOW(), NOW(), 1, 3, 'El dashboard de ventas no refresca desde ayer.', 3, 3, 3, 1, 1, 14),
  (13, 0, '[SD] Monitor no enciende',             NOW(), NOW(), 1, 3, 'Monitor Dell sin senal de video.', 3, 3, 3, 1, 1, 16),
  (14, 0, '[SD] Solicitud nuevo auricular',       NOW(), NOW(), 1, 3, 'Auricular Jabra roto.', 2, 2, 2, 1, 1, 15)
ON DUPLICATE KEY UPDATE
  status = 1, solvedate = NULL, closedate = NULL, date_mod = NOW(), is_deleted = 0;

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
