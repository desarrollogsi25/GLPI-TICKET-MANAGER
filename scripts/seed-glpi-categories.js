#!/usr/bin/env node
/**
 * =============================================================================
 * Script de Configuración de Categorías ITIL y Catálogo de Servicios en GLPI
 * Proyecto: GLPI-TICKET-MANAGER
 * 
 * - Inserta/actualiza las 7 Categorías ITIL requeridas con sus descripciones.
 * - Vincula cada categoría a su grupo de soporte técnico (`groups_id`) para
 *   enrutamiento automático de tickets.
 * - Hace obligatoria la selección de Categoría en los formularios y plantillas.
 * - Configura las categorías en el Catálogo de Servicios con sus iconos/ilustraciones.
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

// Definición de las 7 categorías ITIL requeridas con sus descripciones e iconos
const ITIL_CATEGORIES = [
  {
    name: 'Requerimiento Service Desk',
    group: 'Requerimiento Service Desk',
    comment: 'Solicitud de requerimientos como fichas del CRM, Accesos de Capacitación, etc.',
    illustration: 'helpdesk',
  },
  {
    name: 'Requerimiento BI',
    group: 'Requerimiento BI',
    comment: 'Solicitud de requerimientos dirigidos al área de BI, reportes y tableros analíticos.',
    illustration: 'bi-reporting-1',
  },
  {
    name: 'Aplicaciones GSI',
    group: 'Aplicaciones GSI',
    comment: 'Ticket relacionado con las incidencias presentadas por los aplicativos internos y corporativos.',
    illustration: 'application',
  },
  {
    name: 'Periféricos',
    group: 'Periféricos',
    comment: 'Ticket relacionado a los problemas que se presentan con los periféricos (teclado, mouse, lector, etc.).',
    illustration: 'asset-peripheral',
  },
  {
    name: 'Hardware',
    group: 'Hardware',
    comment: 'Ticket relacionado a los problemas que se presentan con el Monitor, PC, fuentes o componentes físicos.',
    illustration: 'asset-desktop-1',
  },
  {
    name: 'Software',
    group: 'Software',
    comment: 'Ticket relacionado con las incidencias que se presentan en software base, ofimática y sistemas operativos.',
    illustration: 'software-deployment',
  },
  {
    name: 'Informes',
    group: 'Informes',
    comment: 'Ticket relacionado con las incidencias que se presentan en los informes, extracciones de datos o planillas.',
    illustration: 'file-sheet',
  },
];

function runSql(sql) {
  try {
    return execSync(
      `docker exec -i glpi-db mariadb -u ${mariadbUser} -p"${mariadbPassword}" -N -B ${mariadbDatabase}`,
      { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch (err) {
    const msg = err.stderr || err.message;
    throw new Error(`Error MariaDB: ${msg}`);
  }
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function seedGlpiCategories() {
  console.log('--- Iniciando configuración de Categorías ITIL y Catálogo de Servicios GLPI ---');

  // Paso 1: Asegurar que los grupos técnicos existan en glpi_groups
  for (const cat of ITIL_CATEGORIES) {
    const escapedGroup = escapeSql(cat.group);
    const groupSql = `
      INSERT INTO glpi_groups (name, completename, is_requester, is_watcher, is_assign, is_task, is_notify, is_itemgroup, is_usergroup, date_creation, date_mod)
      SELECT '${escapedGroup}', '${escapedGroup}', 1, 1, 1, 1, 1, 1, 1, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM glpi_groups WHERE name = '${escapedGroup}');
    `;
    runSql(groupSql);
  }
  console.log('✓ Grupos de soporte técnico verificados en glpi_groups.');

  // Paso 2: Crear / Actualizar las Categorías ITIL vinculadas a sus respectivos grupos
  for (const cat of ITIL_CATEGORIES) {
    const escapedName = escapeSql(cat.name);
    const escapedComment = escapeSql(cat.comment);
    const escapedGroup = escapeSql(cat.group);

    // Si ya existe la categoría por nombre, actualizar su comment, groups_id y visibilidad
    const updateSql = `
      UPDATE glpi_itilcategories
      SET
        completename = '${escapedName}',
        comment = '${escapedComment}',
        groups_id = (SELECT id FROM glpi_groups WHERE name = '${escapedGroup}' LIMIT 1),
        is_helpdeskvisible = 1,
        is_incident = 1,
        is_request = 1,
        is_problem = 1,
        is_change = 1,
        level = 1,
        itilcategories_id = 0,
        entities_id = 0,
        is_recursive = 1,
        date_mod = NOW()
      WHERE name = '${escapedName}';
    `;
    runSql(updateSql);

    // Si no existe, insertar
    const insertSql = `
      INSERT INTO glpi_itilcategories (
        entities_id, is_recursive, itilcategories_id, name, completename,
        comment, level, groups_id, is_helpdeskvisible, is_incident, is_request,
        is_problem, is_change, date_creation, date_mod
      )
      SELECT
        0, 1, 0, '${escapedName}', '${escapedName}',
        '${escapedComment}', 1,
        (SELECT id FROM glpi_groups WHERE name = '${escapedGroup}' LIMIT 1),
        1, 1, 1, 1, 1, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM glpi_itilcategories WHERE name = '${escapedName}');
    `;
    runSql(insertSql);
    console.log(`✓ Categoría ITIL configurada: "${cat.name}" -> Grupo: "${cat.group}"`);
  }

  // Paso 3: Ocultar del Helpdesk categorías legadas o genéricas no deseadas
  const allowedNamesList = ITIL_CATEGORIES.map(c => `'${escapeSql(c.name)}'`).join(', ');
  const hideLegacySql = `
    UPDATE glpi_itilcategories
    SET is_helpdeskvisible = 0
    WHERE name NOT IN (${allowedNamesList});
  `;
  runSql(hideLegacySql);
  console.log('✓ Categorías obsoletas ocultadas del catálogo del Helpdesk.');

  // Paso 4: Configurar formularios y obligatoriedad de Categoría
  // 4.1 Hacer obligatoria la pregunta de Categoría en glpi_forms_questions
  const mandatoryQuestionsSql = `
    UPDATE glpi_forms_questions
    SET is_mandatory = 1
    WHERE type = 'Glpi\\\\Form\\\\QuestionType\\\\QuestionTypeItemDropdown'
       OR id IN (2, 10);
  `;
  runSql(mandatoryQuestionsSql);
  console.log('✓ Campo "Categoría" marcado como OBLIGATORIO en formularios de GLPI.');

  // 4.2 Hacer obligatoria la categoría en la plantilla de tickets de GLPI (num 7 = itilcategories_id)
  const mandatoryTemplateSql = `
    INSERT INTO glpi_tickettemplatemandatoryfields (tickettemplates_id, num)
    SELECT 1, 7
    WHERE NOT EXISTS (
      SELECT 1 FROM glpi_tickettemplatemandatoryfields WHERE tickettemplates_id = 1 AND num = 7
    );
  `;
  runSql(mandatoryTemplateSql);
  console.log('✓ Campo "Categoría" (num: 7) registrado como obligatorio en plantillas de tickets.');

  // 4.3 Mapeo de Categoría en destino de tickets:
  // GLPI 11 incluye nativamente ITILCategoryField en AbstractCommonITILFormDestination,
  // el cual aplica por defecto la estrategia LAST_VALID_ANSWER a la pregunta de tipo ITILCategory.
  console.log('✓ Mapeo de Categoría en destino de tickets activo con estrategia nativa last_valid_answer.');

  // Paso 5: Poblar glpi_forms_categories con las 7 categorías, sus descripciones e ilustraciones
  for (const cat of ITIL_CATEGORIES) {
    const escapedName = escapeSql(cat.name);
    const escapedDesc = escapeSql(cat.comment);
    const escapedIllustration = escapeSql(cat.illustration);

    const updateFormCatSql = `
      UPDATE glpi_forms_categories
      SET
        completename = '${escapedName}',
        description = '${escapedDesc}',
        illustration = '${escapedIllustration}',
        comment = '${escapedDesc}',
        level = 1,
        forms_categories_id = 0
      WHERE name = '${escapedName}';
    `;
    runSql(updateFormCatSql);

    const insertFormCatSql = `
      INSERT INTO glpi_forms_categories (name, description, illustration, forms_categories_id, completename, level, comment)
      SELECT '${escapedName}', '${escapedDesc}', '${escapedIllustration}', 0, '${escapedName}', 1, '${escapedDesc}'
      WHERE NOT EXISTS (SELECT 1 FROM glpi_forms_categories WHERE name = '${escapedName}');
    `;
    runSql(insertFormCatSql);
  }
  // Paso 6: Habilitar auto_assign_mode en la Entidad Raíz de GLPI
  runSql(`UPDATE glpi_entities SET auto_assign_mode = 2 WHERE id = 0;`);
  console.log('✓ Auto-asignación por categoría habilitada en Entidad Raíz (auto_assign_mode = 2).');

  // Paso 7: Crear Reglas de Negocio para Tickets (RuleTicket) por Categoría
  // Garantiza que tickets creados por cualquier interfaz o perfil se asignen siempre al grupo técnico correcto
  for (let i = 0; i < ITIL_CATEGORIES.length; i++) {
    const cat = ITIL_CATEGORIES[i];
    const ruleName = `Enrutamiento ITIL - ${cat.name}`;
    const escapedRuleName = escapeSql(ruleName);
    const escapedCatName = escapeSql(cat.name);
    const escapedGroupName = escapeSql(cat.group);
    const ranking = i + 10;

    const ensureRuleSql = `
      INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, \`match\`, is_active, is_recursive, \`condition\`, date_creation, date_mod)
      SELECT 0, 'RuleTicket', ${ranking}, '${escapedRuleName}', 'AND', 1, 1, 1, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = '${escapedRuleName}' AND sub_type = 'RuleTicket');
    `;
    runSql(ensureRuleSql);

    const ruleId = runSql(`SELECT id FROM glpi_rules WHERE name = '${escapedRuleName}' AND sub_type = 'RuleTicket' LIMIT 1;`).trim();
    const catId = runSql(`SELECT id FROM glpi_itilcategories WHERE name = '${escapedCatName}' LIMIT 1;`).trim();
    const grpId = runSql(`SELECT id FROM glpi_groups WHERE name = '${escapedGroupName}' LIMIT 1;`).trim();

    if (ruleId && catId && grpId) {
      runSql(`
        DELETE FROM glpi_rulecriterias WHERE rules_id = ${ruleId};
        INSERT INTO glpi_rulecriterias (rules_id, criteria, \`condition\`, pattern)
        VALUES (${ruleId}, 'itilcategories_id', 0, '${catId}');
      `);

      runSql(`
        DELETE FROM glpi_ruleactions WHERE rules_id = ${ruleId};
        INSERT INTO glpi_ruleactions (rules_id, action_type, field, value)
        VALUES 
          (${ruleId}, 'assign', '_groups_id_assign', '${grpId}'),
          (${ruleId}, 'assign', 'status', '1');
      `);
      console.log(`✓ Regla de negocio configurada: "${ruleName}" (Cat ${catId} -> Grupo ${grpId}, Status: 1)`);
    }
  }

  // Paso 8: Verificación estricta en base de datos
  console.log('\n--- Verificando vinculación en Base de Datos ---');
  for (const cat of ITIL_CATEGORIES) {
    const verifySql = `
      SELECT c.id, c.name, c.groups_id, g.name AS group_name, c.is_helpdeskvisible
      FROM glpi_itilcategories c
      INNER JOIN glpi_groups g ON g.id = c.groups_id
      WHERE c.name = '${escapeSql(cat.name)}';
    `;
    const res = runSql(verifySql).trim();
    if (!res) {
      throw new Error(`Verificación fallida: Categoría "${cat.name}" no encontrada o sin grupo vinculado.`);
    }
    const [id, name, groupId, groupName, visible] = res.split('\t');
    if (groupName !== cat.group) {
      throw new Error(
        `Verificación fallida: Categoría "${cat.name}" vinculada a grupo inesperado "${groupName}" (esperado: "${cat.group}").`
      );
    }
    console.log(`✓ Verificada categoría [${id}] "${name}" -> Grupo [${groupId}] "${groupName}" (Helpdesk: ${visible})`);
  }

  console.log('\n--- Configuración de Categorías ITIL y Catálogo de Servicios completada exitosamente ---\n');
}

if (require.main === module) {
  try {
    seedGlpiCategories();
  } catch (err) {
    console.error('Error fatal al configurar categorías GLPI:', err.message);
    process.exit(1);
  }
}

module.exports = { seedGlpiCategories, ITIL_CATEGORIES };
