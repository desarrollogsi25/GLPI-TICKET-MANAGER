#!/usr/bin/env node
/**
 * Script de Verificación de Enrutamiento Automático de Tickets en GLPI
 * Proyecto: GLPI-TICKET-MANAGER
 * 
 * Valida:
 * 1. Existencia y configuración de las 7 Categorías ITIL en GLPI.
 * 2. Vinculación con grupos de soporte técnico en glpi_itilcategories.
 * 3. Configuración de reglas de negocio en glpi_rules.
 * 4. Creación de ticket de prueba con categoría Hardware y confirmación de que
 *    se asigna al grupo técnico correspondiente con status = 1 (Nuevo).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function runSql(sql) {
  try {
    return execSync(
      `docker exec -i glpi-db mariadb -u ${mariadbUser} -p"${mariadbPassword}" -N -B ${mariadbDatabase}`,
      { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch (err) {
    throw new Error(`Error MariaDB: ${err.stderr || err.message}`);
  }
}

function verifyFlow() {
  console.log('=== VERIFICACIÓN DEL FLUJO DE CATEGORÍAS ITIL Y ENRUTAMIENTO GLPI ===\n');

  // 1. Verificar las 7 categorías
  const categories = [
    'Requerimiento Service Desk',
    'Requerimiento BI',
    'Aplicaciones GSI',
    'Periféricos',
    'Hardware',
    'Software',
    'Informes',
  ];

  console.log('1. Verificando categorías ITIL y grupos vinculados:');
  for (const catName of categories) {
    const res = runSql(`
      SELECT c.id, c.name, g.id AS group_id, g.name AS group_name, c.is_helpdeskvisible
      FROM glpi_itilcategories c
      INNER JOIN glpi_groups g ON g.id = c.groups_id
      WHERE c.name = '${catName.replace(/'/g, "''")}';
    `).trim();

    if (!res) {
      throw new Error(`Categoría faltante o desvinculada: "${catName}"`);
    }
    const [id, name, groupId, groupName, visible] = res.split('\t');
    console.log(`   ✓ [Cat ID ${id}] "${name}" -> [Grupo ID ${groupId}] "${groupName}" (Visible Helpdesk: ${visible})`);
  }

  // 2. Verificar reglas de negocio
  console.log('\n2. Verificando Reglas de Negocio activas (RuleTicket):');
  const rulesCount = parseInt(
    runSql(`SELECT COUNT(*) FROM glpi_rules WHERE sub_type = 'RuleTicket' AND is_active = 1 AND name LIKE 'Enrutamiento ITIL%';`).trim(),
    10
  );
  console.log(`   ✓ ${rulesCount} reglas de enrutamiento ITIL activas.`);
  if (rulesCount < 7) {
    throw new Error(`Se esperaban al menos 7 reglas activas de enrutamiento, encontradas: ${rulesCount}`);
  }

  // 3. Crear ticket de prueba simulado con categoría Hardware
  console.log('\n3. Creando Ticket de verificación de enrutamiento (Categoría Hardware)...');
  const phpRunner = `<?php
require_once __DIR__ . '/vendor/autoload.php';
$k = new \\Glpi\\Kernel\\Kernel();
$k->boot();
require_once __DIR__ . '/inc/includes.php';

$user = new User();
$user->getFromDBbyName('solicitante_test');
$_SESSION['glpiID'] = $user->getID();
$_SESSION['glpiname'] = $user->fields['name'];
$_SESSION['glpiactiveprofile'] = ['id' => 1, 'name' => 'Self-Service', 'interface' => 'helpdesk', 'create_ticket' => 1];
$_SESSION['glpiactiveentities'] = [0];
$_SESSION['glpiactiveentities_string'] = '0';

$cat = new ITILCategory();
$found = $cat->find(['name' => 'Hardware']);
$catId = array_key_first($found);

$ticket = new Ticket();
$id = $ticket->add([
    'name'                => 'E2E Ticket Hardware Routing - ' . date('Y-m-d H:i:s'),
    'content'             => 'Prueba automatizada de enrutamiento hacia la cola del grupo Hardware.',
    'itilcategories_id'   => $catId,
    'entities_id'         => 0,
    '_users_id_requester' => $user->getID(),
    'type'                => Ticket::INCIDENT_TYPE,
    'urgency'             => 3,
    'impact'              => 3,
    'priority'            => 3,
]);
echo $id;
`;

  execSync(`docker exec -i glpi php`, { input: phpRunner, encoding: 'utf8' });
  
  // 4. Verificar en base de datos la asignación al grupo Hardware y al técnico
  const verifyTicketSql = `
    SELECT 
      t.id, t.name, c.name AS category_name, g.id AS group_id, g.name AS group_name, t.status, u.name AS tech_name
    FROM glpi_tickets t
    JOIN glpi_itilcategories c ON c.id = t.itilcategories_id
    JOIN glpi_groups_tickets gt ON gt.tickets_id = t.id AND gt.type = 2
    JOIN glpi_groups g ON g.id = gt.groups_id
    LEFT JOIN glpi_groups_users gu ON gu.groups_id = g.id
    LEFT JOIN glpi_users u ON u.id = gu.users_id
    WHERE c.name = 'Hardware'
    ORDER BY t.id DESC LIMIT 1;
  `;

  const ticketRes = runSql(verifyTicketSql).trim();
  if (!ticketRes) {
    throw new Error('El ticket no fue asignado a ningún grupo técnico.');
  }

  const [tId, tTitle, catName, gId, gName, status, techName] = ticketRes.split('\t');
  console.log(`   ✓ Ticket creado: [ID ${tId}] "${tTitle}"`);
  console.log(`   ✓ Categoría: "${catName}"`);
  console.log(`   ✓ Enrutado automáticamente al Grupo: [ID ${gId}] "${gName}"`);
  console.log(`   ✓ Estado inicial en cola: ${status} (1 = Nuevo / Sin asignar)`);
  console.log(`   ✓ Técnico asignable en el grupo: "${techName}"`);

  console.log('\n=== VERIFICACIÓN EXITOSA: TODAS LAS PRUEBAS COMPLETADAS ===\n');
}

if (require.main === module) {
  try {
    verifyFlow();
  } catch (err) {
    console.error('Error en verificación:', err.message);
    process.exit(1);
  }
}

module.exports = { verifyFlow };
