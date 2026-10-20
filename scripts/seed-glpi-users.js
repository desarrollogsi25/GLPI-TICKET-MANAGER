#!/usr/bin/env node
/**
 * =============================================================================
 * Script de Creación de Usuarios de Prueba en GLPI - GLPI Ticket Manager
 * Crea usuarios y asigna perfiles y grupos de forma idempotente.
 * =============================================================================
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Obtener credenciales de MariaDB
let mariadbPassword = process.env.MARIADB_PASSWORD;
let mariadbDatabase = process.env.MARIADB_DATABASE || 'glpi';
let mariadbUser = process.env.MARIADB_USER || 'glpi';

if (!mariadbPassword) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^MARIADB_PASSWORD=(.*)$/m);
    if (match) mariadbPassword = match[1].trim();
  }
}
if (!mariadbPassword) mariadbPassword = 'secret';

// Definición de usuarios requeridos:
// - admin_test / Admin123! -> Super-Admin (4)
// - supervisor_test / Super123! -> Supervisor (7)
// - tecnico_test1 / Tec123! -> Technician (6) / Grupo: Requerimiento Service Desk
// - tecnico_test2 / Tec123! -> Technician (6) / Grupo: Hardware
const TEST_USERS = [
  { username: 'admin_test', password: 'Admin123!', profileId: 4, role: 'Super-Admin' },
  { username: 'supervisor_test', password: 'Super123!', profileId: 7, role: 'Supervisor' },
  { username: 'tecnico_test1', password: 'Tec123!', profileId: 6, role: 'Technician', group: 'Requerimiento Service Desk' },
  { username: 'tecnico_test2', password: 'Tec123!', profileId: 6, role: 'Technician', group: 'Hardware' },
];

function runInGlpi(command) {
  try {
    return execSync(`docker exec glpi ${command}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    return err.stdout || err.stderr || err.message;
  }
}

function runSql(sql) {
  try {
    // -N -B: sin cabeceras y en modo batch, para que la salida sea solo datos y se pueda
    // parsear de forma fiable en la verificación final (mismos datos, sin formato).
    return execSync(
      `docker exec -i glpi-db mariadb -u ${mariadbUser} -p"${mariadbPassword}" -N -B ${mariadbDatabase}`,
      { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch (err) {
    const msg = err.stderr || err.message;
    throw new Error(`Error MariaDB: ${msg}`);
  }
}

function seedGlpiUsers() {
  console.log('--- Iniciando creación idempotente de usuarios GLPI ---');

  // Asegurar que los grupos requeridos existan
  const groupsToEnsure = [
    'Soporte N1',
    'Soporte N2',
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
    // 1. Intentar crear usuario
    const createRes = runInGlpi(`php bin/console user:create ${user.username} -p "${user.password}" --no-interaction`);
    if (createRes.includes('Usuario creado')) {
      console.log(`✓ Creado usuario: ${user.username}`);
    } else {
      // Si ya existe, asegurar contraseña actualizada
      runInGlpi(`php bin/console user:reset_password ${user.username} -p "${user.password}" --no-interaction`);
      console.log(`ℹ Usuario ${user.username} ya existía (contraseña sincronizada).`);
    }

    // 2. Asignar perfil correspondiente
    runInGlpi(`php bin/console user:grant ${user.username} -p ${user.profileId} -r --no-interaction`);
    console.log(`✓ Perfil asignado a ${user.username}: ${user.role} (ID ${user.profileId})`);

    // 3. Si tiene grupo asignado, vincular en glpi_groups_users
    if (user.group) {
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
  //    Si una inserción fallara en silencio, el Kanban entraria en el estado
  //    "Sin grupo de soporte asignado"; aqui se detiene el script en lugar de eso.
  for (const user of TEST_USERS) {
    if (!user.group) continue;

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

  console.log('--- Configuración de usuarios GLPI completada con éxito ---\n');
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
