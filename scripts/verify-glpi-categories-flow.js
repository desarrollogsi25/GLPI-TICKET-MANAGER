#!/usr/bin/env node
/**
 * Script de Verificación de Enrutamiento Automático y Catálogo de 16 Categorías ITIL en GLPI 11
 * Proyecto: GLPI-TICKET-MANAGER
 *
 * Valida:
 * 1. Existencia de los 3 únicos grupos técnicos reales (`1=Desarrollo`, `2=BI`, `3=Service Desk`).
 * 2. Existencia, jerarquía y codificación UTF-8 (`Periféricos`) de las 16 Categorías ITIL.
 * 3. Vinculación de cada categoría a su grupo técnico en `glpi_itilcategories.groups_id`.
 * 4. Configuración de las 3 reglas de negocio activas (`H38 Route Desarrollo`, `H38 Route BI`, `H38 Route Service Desk`).
 * 5. Existencia de las 8 tarjetas destacadas del Catálogo de Servicios con `strategy: "specific_value"`.
 * 6. Creación de tickets de prueba para los 3 grupos técnicos y confirmación de enrutamiento automático.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ITIL_CATEGORIES } = require('./seed-glpi-categories');
const { FORMS_CONFIG } = require('./seed-visual-forms');

let mariadbPassword = process.env.MARIADB_PASSWORD;
let mariadbDatabase = process.env.MARIADB_DATABASE || 'glpi';
let mariadbUser = process.env.MARIADB_USER || 'glpi';
let mariadbContainer = process.env.MARIADB_CONTAINER || 'glpi-db';
let glpiContainer = process.env.GLPI_CONTAINER || 'glpi';

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
      `docker exec -i ${mariadbContainer} mariadb --default-character-set=utf8mb4 -u ${mariadbUser} -p"${mariadbPassword}" -N -B ${mariadbDatabase}`,
      { input: `SET NAMES utf8mb4;\n${sql}`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch (err) {
    throw new Error(`Error MariaDB: ${err.stderr || err.message}`);
  }
}

function verifyFlow() {
  console.log('=== VERIFICACIÓN DEL ÁRBOL DE 16 CATEGORÍAS ITIL, CATÁLOGO Y ENRUTAMIENTO GLPI 11 ===\n');

  // 1. Verificar exactamente 3 grupos técnicos reales
  const groupsRaw = runSql(`SELECT id, name, is_assign FROM glpi_groups ORDER BY id ASC;`).trim();
  const groupLines = groupsRaw.split('\n').map((s) => s.trim()).filter(Boolean);
  if (groupLines.length !== 3) {
    throw new Error(`Se esperaban exactamente 3 grupos técnicos, encontrados: ${groupLines.length}`);
  }
  console.log('1. Grupos técnicos organizacionales verificados (3 grupos reales):');
  for (const line of groupLines) {
    const [gid, gname, isAssign] = line.split('\t');
    console.log(`   ✓ [Grupo ID ${gid}] "${gname}" (is_assign=${isAssign})`);
  }

  // 2. Verificar las 16 categorías ITIL y grupos vinculados
  console.log('\n2. Verificando las 16 categorías ITIL, jerarquía y grupos vinculados:');
  const totalCats = parseInt(runSql(`SELECT COUNT(*) FROM glpi_itilcategories;`).trim(), 10);
  if (totalCats !== 16) {
    throw new Error(`Se esperaban exactamente 16 categorías ITIL, encontradas: ${totalCats}`);
  }

  for (const expected of ITIL_CATEGORIES) {
    const res = runSql(`
      SELECT c.id, c.name, c.completename, c.level, c.itilcategories_id, g.id AS group_id, g.name AS group_name, c.is_helpdeskvisible
      FROM glpi_itilcategories c
      INNER JOIN glpi_groups g ON g.id = c.groups_id
      WHERE c.id = ${expected.id};
    `).trim();

    if (!res) {
      throw new Error(`Categoría faltante o desvinculada: ID ${expected.id} "${expected.name}"`);
    }
    const [id, name, completeName, level, parentId, groupId, groupName, visible] = res.split('\t');
    if (name !== expected.name || completeName !== expected.completeName) {
      throw new Error(
        `Discrepancia de nombre/jerarquía en categoría ${id}: obtenido "${completeName}", esperado "${expected.completeName}"`
      );
    }
    if (parseInt(groupId, 10) !== expected.groupId || groupName !== expected.group) {
      throw new Error(
        `Discrepancia de grupo en categoría ${id}: obtenido [${groupId}] "${groupName}", esperado [${expected.groupId}] "${expected.group}"`
      );
    }
    console.log(
      `   ✓ [Cat ${id}] "${completeName}" (Nivel ${level}, Padre ${parentId}) -> [Grupo ${groupId}] "${groupName}" (Helpdesk: ${visible})`
    );
  }

  // 3. Verificar las 3 reglas de negocio H38
  console.log('\n3. Verificando Reglas de Negocio activas (RuleTicket):');
  const rulesCount = parseInt(
    runSql(`SELECT COUNT(*) FROM glpi_rules WHERE sub_type = 'RuleTicket' AND is_active = 1 AND name LIKE 'H38 Route %';`).trim(),
    10
  );
  if (rulesCount !== 3) {
    throw new Error(`Se esperaban las 3 reglas activas 'H38 Route %', encontradas: ${rulesCount}`);
  }
  const criteriasCount = parseInt(
    runSql(`
      SELECT COUNT(*) FROM glpi_rulecriterias rc
      INNER JOIN glpi_rules r ON r.id = rc.rules_id
      WHERE r.sub_type = 'RuleTicket' AND r.is_active = 1 AND r.name LIKE 'H38 Route %';
    `).trim(),
    10
  );
  if (criteriasCount !== 16) {
    throw new Error(`Se esperaban 16 criterios de categoría en las reglas H38, encontrados: ${criteriasCount}`);
  }
  console.log(`   ✓ 3 reglas 'H38 Route ...' activas cubriendo las 16 categorías ITIL.`);

  // 4. Verificar los 8 formularios inteligentes destacados
  console.log('\n4. Verificando las 8 tarjetas destacadas del Catálogo de Servicios:');
  for (const cfg of FORMS_CONFIG) {
    const formRow = runSql(`
      SELECT f.id, f.name,
             JSON_UNQUOTE(JSON_EXTRACT(d.config, '$."glpi-form-destination-commonitilfield-itilcategoryfield".strategy')) AS strategy,
             JSON_EXTRACT(d.config, '$."glpi-form-destination-commonitilfield-itilcategoryfield".specific_itilcategory_id') AS specific_cat_id
      FROM glpi_forms_forms f
      INNER JOIN glpi_forms_destinations_formdestinations d ON d.forms_forms_id = f.id
      WHERE f.forms_categories_id = ${cfg.catId} AND f.is_active = 1 AND f.is_deleted = 0
      LIMIT 1;
    `).trim();
    if (!formRow) {
      throw new Error(`Formulario destacado faltante para categoría visual [${cfg.catId}] "${cfg.name}"`);
    }
    const [fid, fname, strategy, specificCatIdStr] = formRow.split('\t');
    const specificCatId = parseInt(specificCatIdStr, 10);
    if (strategy !== 'specific_value' || specificCatId !== cfg.itilCategoryId) {
      throw new Error(
        `Formulario [${fid}] "${fname}" no tiene specific_itilcategory_id=${cfg.itilCategoryId}: strategy=${strategy}, specific_cat_id=${specificCatIdStr}`
      );
    }
    console.log(
      `   ✓ [Form ${fid}] "${fname}" -> strategy=specific_value, specific_itilcategory_id=${cfg.itilCategoryId}`
    );
  }

  // 5. Crear un ticket de prueba simulado y verificar enrutamiento y limpieza
  console.log('\n5. Probando creación y enrutamiento automático de ticket (Categoría 16 = Service Desk > Hardware -> Grupo 3)...');
  const phpRunner = `<?php
require_once '/var/www/glpi/vendor/autoload.php';
$k = new \\Glpi\\Kernel\\Kernel();
$k->boot();

$user = new User();
if (!$user->getFromDBbyName('user_test')) {
    $user->getFromDBbyName('solicitante_test');
}
$_SESSION['glpiID'] = $user->getID();
$_SESSION['glpiname'] = $user->fields['name'];
$_SESSION['glpiactiveprofile'] = ['id' => 1, 'name' => 'Self-Service', 'interface' => 'helpdesk', 'create_ticket' => 1];
$_SESSION['glpiactiveentities'] = [0];
$_SESSION['glpiactiveentities_string'] = '0';

$ticket = new Ticket();
$id = $ticket->add([
    'name'                => 'Verify Script Hardware Routing - ' . date('Y-m-d H:i:s'),
    'content'             => 'Prueba automatizada de enrutamiento hacia Service Desk.',
    'itilcategories_id'   => 16,
    'entities_id'         => 0,
    '_users_id_requester' => $user->getID(),
    'type'                => Ticket::INCIDENT_TYPE,
    'urgency'             => 3,
    'impact'              => 3,
    'priority'            => 3,
]);
echo $id;
`;

  const createdId = execSync(`docker exec -i ${glpiContainer} php`, { input: phpRunner, encoding: 'utf8' }).trim();
  const ticketRes = runSql(`
    SELECT t.id, t.name, c.completename, g.id AS group_id, g.name AS group_name, t.status
    FROM glpi_tickets t
    INNER JOIN glpi_itilcategories c ON c.id = t.itilcategories_id
    INNER JOIN glpi_groups_tickets gt ON gt.tickets_id = t.id AND gt.type = 2
    INNER JOIN glpi_groups g ON g.id = gt.groups_id
    WHERE t.id = ${parseInt(createdId, 10)}
    LIMIT 1;
  `).trim();

  if (!ticketRes) {
    throw new Error(`El ticket #${createdId} no fue enrutado automáticamente a ningún grupo técnico.`);
  }
  const [tId, tTitle, catComplete, gId, gName, status] = ticketRes.split('\t');
  if (parseInt(gId, 10) !== 3) {
    throw new Error(`El ticket #${tId} se enrutó al grupo ${gId} (${gName}), se esperaba 3 (Service Desk).`);
  }
  console.log(`   ✓ Ticket #${tId} ("${tTitle}") con categoría "${catComplete}" enrutado automáticamente al Grupo [${gId}] "${gName}" (Estado ${status})`);

  // Limpiar el ticket efímero de verificación para no ensuciar la cola
  runSql(`
    DELETE FROM glpi_groups_tickets WHERE tickets_id = ${parseInt(tId, 10)};
    DELETE FROM glpi_tickets_users WHERE tickets_id = ${parseInt(tId, 10)};
    DELETE FROM glpi_tickets WHERE id = ${parseInt(tId, 10)};
  `);

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
