-- =============================================================================
-- H-39 · Provisión idempotente de los usuarios de prueba de GLPI
-- -----------------------------------------------------------------------------
-- Problema que corrige:
--   GLPI 11 resuelve el login en `Auth::connection_db()` filtrando por
--   `authtype = 1` (DB_GLPI) y `auths_id = 0`. Las filas insertadas sólo con
--   `name`/`password` quedan con `authtype = 0` (ninguno) y GLPI responde
--   HTTP 400 "Usuario o contraseña incorrecto" aunque la contraseña sea válida.
--
-- Este script es idempotente y mantiene los IDs 10–17 estables porque están
-- referenciados por `user_role_overrides` en PostgreSQL y por la documentación.
-- Contraseña para todos: Password123!
--
-- Uso:
--   docker exec -i glpi-db mariadb -uglpi -p"$MARIADB_PASSWORD" glpi \
--     < scripts/provision-glpi-test-users.sql
-- =============================================================================

-- 1. Cuentas con hash bcrypt ya generado por GLPI (PASSWORD_DEFAULT, coste 12).
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
  -- El nombre manda: si el ID ya existe con otro nombre, no lo pisamos.
  password = IF(name = VALUES(name), VALUES(password), password),
  password_last_update = IF(name = VALUES(name), VALUES(password_last_update), password_last_update),
  authtype = IF(name = VALUES(name), 1, authtype),
  auths_id = IF(name = VALUES(name), 0, auths_id),
  is_active = IF(name = VALUES(name), 1, is_active),
  is_deleted = IF(name = VALUES(name), 0, is_deleted),
  date_mod = IF(name = VALUES(name), NOW(), date_mod);

-- 2. Perfiles: 4 = Super-Admin, 6 = Technician, 1 = Self-Service.
DELETE FROM glpi_profiles_users WHERE users_id IN (10, 11, 12, 13, 14, 15, 16, 17);
INSERT INTO glpi_profiles_users (users_id, profiles_id, entities_id, is_recursive, is_dynamic, is_default_profile) VALUES
  (10, 4, 0, 1, 0, 1),
  (11, 6, 0, 0, 0, 1),
  (12, 6, 0, 0, 0, 1),
  (13, 6, 0, 0, 0, 1),
  (14, 6, 0, 0, 0, 1),
  (15, 6, 0, 0, 0, 1),
  (16, 6, 0, 0, 0, 1),
  (17, 1, 0, 0, 0, 1);

-- 3. Grupos operativos: 1 = Desarrollo, 2 = BI, 3 = Service Desk.
DELETE FROM glpi_groups_users WHERE users_id IN (10, 11, 12, 13, 14, 15, 16, 17);
INSERT INTO glpi_groups_users (users_id, groups_id, is_dynamic, is_manager, is_userdelegate) VALUES
  (11, 1, 0, 1, 0),
  (12, 2, 0, 1, 0),
  (13, 3, 0, 1, 0),
  (14, 1, 0, 0, 0),
  (15, 2, 0, 0, 0),
  (16, 3, 0, 0, 0);

-- 4. Email por defecto (obligatorio para que GLPI considere la cuenta completa).
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

-- 5. Verificación rápida: todo debe salir authtype=1, auths_id=0, is_active=1.
SELECT u.id, u.name, u.authtype, u.auths_id, u.is_active, u.is_deleted,
       p.profiles_id, GROUP_CONCAT(g.groups_id ORDER BY g.groups_id) AS groups,
       e.email
FROM glpi_users u
LEFT JOIN glpi_profiles_users p ON p.users_id = u.id AND p.is_default_profile = 1
LEFT JOIN glpi_groups_users g ON g.users_id = u.id
LEFT JOIN glpi_useremails e ON e.users_id = u.id AND e.is_default = 1
WHERE u.id BETWEEN 10 AND 17
GROUP BY u.id, u.name, u.authtype, u.auths_id, u.is_active, u.is_deleted, p.profiles_id, e.email
ORDER BY u.id;
