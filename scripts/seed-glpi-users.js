#!/usr/bin/env node
/**
 * =============================================================================
 * Script de Creación de Usuarios de Prueba en GLPI - GLPI Ticket Manager
 * Crea usuarios y asigna perfiles y grupos de forma idempotente.
 * =============================================================================
 */

const { execFileSync } = require('child_process');
const { randomBytes } = require('crypto');
const path = require('path');

const GUARD = path.resolve(__dirname, 'e2e/guard.mjs');

function guard(args, input) {
  try {
    return execFileSync(process.execPath, [GUARD, ...args], {
      input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    // Never echo child output: it could contain credentials or fixture data.
    throw new Error('Fixture blocked: a confirmed disposable E2E fixture is required.');
  }
}

// Synthetic fixture users. Passwords are generated per run and never logged;
// they exist only inside the disposable database.
const TEST_USERS = [
  { username: 'admin_test', profileId: 4, role: 'Super-Admin' },
  { username: 'supervisor_test', profileId: 7, role: 'Supervisor' },
  { username: 'tecnico_test1', profileId: 6, role: 'Technician', group: 'Requerimiento Service Desk' },
  { username: 'tecnico_test2', profileId: 6, role: 'Technician', group: 'Hardware' },
  { username: 'solicitante_test', profileId: 1, role: 'Self-Service' },
];

const fixturePassword = () => randomBytes(24).toString('base64url');

function runInGlpi(args, input) {
  try {
    return { ok: true, output: guard(['exec', 'glpi', '--', ...args], input) };
  } catch (err) {
    return { ok: false, output: err.message };
  }
}

function runSql(sql) {
  // -N -B keeps the output parseable; SQL travels on stdin, never on argv.
  return guard(['sql', 'mariadb'], sql);
}

function assertFixture() {
  guard(['verify', '--destructive']);
}

function seedGlpiUsers() {
  assertFixture();
  console.log('--- Iniciando creación idempotente de usuarios GLPI ---');

  // Asegurar que los grupos requeridos existan. Deben coincidir exactamente con la
  // estructura de Service Desk del usuario (7 grupos, sin grupos legacy).
  const groupsToEnsure = [
    'Requerimiento Service Desk',
    'Requerimiento BI',
    'Aplicaciones GSI',
    'Periféricos',
    'Hardware',
    'Software',
    'Informes',
  ];
  for (const groupName of groupsToEnsure) {
    const groupSql = `
      INSERT INTO glpi_groups (name, completename, is_requester, is_watcher, is_assign, is_task, is_notify, is_itemgroup, is_usergroup, date_creation, date_mod)
      SELECT '${groupName}', '${groupName}', 1, 1, 1, 1, 1, 1, 1, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM glpi_groups WHERE name = '${groupName}');
    `;
    runSql(groupSql);
  }
  console.log('✓ Grupos de soporte técnico verificados.');

  for (const user of TEST_USERS) {
    const userPassword = fixturePassword();
    // 1. Intentar crear usuario
    const createRes = runInGlpi(['php', 'bin/console', 'user:create', user.username, '-p', userPassword, '--no-interaction']);
    if (createRes.ok && createRes.output.includes('Usuario creado')) {
      console.log(`✓ Creado usuario: ${user.username}`);
    } else {
      // Si ya existe, asegurar contraseña actualizada
      runInGlpi(['php', 'bin/console', 'user:reset_password', user.username, '-p', userPassword, '--no-interaction']);
      console.log(`ℹ Usuario ${user.username} ya existía (contraseña sincronizada).`);
    }

    // 2. Asignar perfil correspondiente
    runInGlpi(['php', 'bin/console', 'user:grant', user.username, '-p', String(user.profileId), '-r', '--no-interaction']);
    console.log(`✓ Perfil asignado a ${user.username}: ${user.role} (ID ${user.profileId})`);

    // 3. Vincular técnicos a TODOS los grupos de soporte técnico
    if (user.role === 'Technician') {
      const linkAllSql = `
        INSERT IGNORE INTO glpi_groups_users (users_id, groups_id, is_dynamic, is_manager, is_userdelegate)
        SELECT u.id, g.id, 0, 0, 0
        FROM glpi_users u
        CROSS JOIN glpi_groups g
        WHERE u.name = '${user.username}'
          AND g.name IN (${groupsToEnsure.map(g => `'${g}'`).join(', ')});
      `;
      runSql(linkAllSql);
      console.log(`✓ Técnico ${user.username} vinculado a todos los grupos de soporte (${groupsToEnsure.length} grupos)`);
    } else if (user.group) {
      const linkSql = `
        INSERT INTO glpi_groups_users (users_id, groups_id)
        SELECT u.id, g.id
        FROM glpi_users u, glpi_groups g
        WHERE u.name = '${user.username}' AND g.name = '${user.group}'
        AND NOT EXISTS (
          SELECT 1 FROM glpi_groups_users gu WHERE gu.users_id = u.id AND gu.groups_id = g.id
        );
      `;
      runSql(linkSql);
      console.log(`✓ Usuario ${user.username} vinculado al grupo "${user.group}"`);
    }
  }

  // 4. Verificación final de la vinculación user <-> group en la BD.
  for (const user of TEST_USERS) {
    if (user.role === 'Technician') {
      const verifySql = `
        SELECT COUNT(*)
        FROM glpi_groups_users gu
        INNER JOIN glpi_users u ON u.id = gu.users_id
        INNER JOIN glpi_groups g ON g.id = gu.groups_id
        WHERE u.name = '${user.username}'
          AND g.name IN (${groupsToEnsure.map(g => `'${g}'`).join(', ')});
      `;
      const n = parseInt(String(runSql(verifySql)).trim(), 10);
      if (!Number.isFinite(n) || n < groupsToEnsure.length) {
        throw new Error(
          `Verificación fallida: ${user.username} no está vinculado a todos los grupos (${n}/${groupsToEnsure.length}).`
        );
      }
      console.log(`✓ Verificado en BD: ${user.username} -> ${n} grupos asignados.`);
    } else if (user.group) {
      const verifySql = `
        SELECT COUNT(*)
        FROM glpi_groups_users gu
        INNER JOIN glpi_users u ON u.id = gu.users_id
        INNER JOIN glpi_groups g ON g.id = gu.groups_id
        WHERE u.name = '${user.username}' AND g.name = '${user.group}';
      `;
      const n = parseInt(String(runSql(verifySql)).trim(), 10);
      if (!Number.isFinite(n) || n < 1) {
        throw new Error(
          `Verificación fallida: ${user.username} no está vinculado al grupo "${user.group}" en glpi_groups_users.`
        );
      }
      console.log(`✓ Verificado en BD: ${user.username} -> ${user.group} (${n} vínculo/s)`);
    }
  }

  console.log('--- Configuración de usuarios GLPI completada con éxito ---\n');

  // 5. Configurar Categorías ITIL y Catálogo de Servicios
  const { seedGlpiCategories } = require('./seed-glpi-categories');
  seedGlpiCategories();
}

if (require.main === module) {
  try {
    seedGlpiUsers();
  } catch (err) {
    console.error('Error fatal al crear usuarios GLPI:', err.message);
    process.exit(1);
  }
}

module.exports = { seedGlpiUsers, TEST_USERS };
