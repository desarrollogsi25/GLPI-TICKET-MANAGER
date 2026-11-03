#!/usr/bin/env node
/**
 * =============================================================================
 * Script de Configuración Jerárquica de Categorías ITIL y Enrutamiento GLPI 11
 * Proyecto: GLPI-TICKET-MANAGER
 *
 * - Asegura exclusivamente los 3 grupos técnicos reales:
 *     1 = Desarrollo
 *     2 = BI
 *     3 = Service Desk
 * - Configura el árbol jerárquico oficial de 16 categorías ITIL (6 raíces + 10 subcategorías)
 *   con codificación UTF-8 limpia (`utf8mb4`), descripciones y vinculación `groups_id`.
 * - Reconcilia las 3 reglas de negocio activas (`RuleTicket`) de enrutamiento automático:
 *     H38 Route Desarrollo -> Grupo 1 (Categorías 1, 4, 5, 9, 11)
 *     H38 Route BI         -> Grupo 2 (Categorías 10, 14, 18)
 *     H38 Route Service Desk -> Grupo 3 (Categorías 2, 3, 6, 7, 15, 16, 17, 19)
 * - Configura las categorías visuales del catálogo (`glpi_forms_categories`).
 * =============================================================================
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let mariadbPassword = process.env.MARIADB_PASSWORD;
let mariadbDatabase = process.env.MARIADB_DATABASE || 'glpi';
let mariadbUser = process.env.MARIADB_USER || 'glpi';
let mariadbContainer = process.env.MARIADB_CONTAINER || 'glpi-db';

if (!mariadbPassword) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^MARIADB_PASSWORD=(.*)$/m);
    if (match) mariadbPassword = match[1].trim();
  }
}
if (!mariadbPassword) mariadbPassword = 'secret';

const TECHNICAL_GROUPS = [
  { id: 1, name: 'Desarrollo' },
  { id: 2, name: 'BI' },
  { id: 3, name: 'Service Desk' },
];

// Árbol jerárquico oficial de 16 categorías ITIL (6 raíces + 10 subcategorías)
const ITIL_CATEGORIES = [
  // Nivel 1 (Raíces)
  {
    id: 1,
    parentId: 0,
    level: 1,
    name: 'Desarrollo',
    completeName: 'Desarrollo',
    groupId: 1,
    group: 'Desarrollo',
    comment: 'Área de ingeniería de software, desarrollo y mantenimiento de aplicaciones.',
    illustration: 'application',
  },
  {
    id: 2,
    parentId: 0,
    level: 1,
    name: 'Requerimiento',
    completeName: 'Requerimiento',
    groupId: 3,
    group: 'Service Desk',
    comment: 'Solicitudes generales de acceso, permisos y servicios corporativos.',
    illustration: 'request-service',
  },
  {
    id: 5,
    parentId: 0,
    level: 1,
    name: 'Aplicaciones',
    completeName: 'Aplicaciones',
    groupId: 1,
    group: 'Desarrollo',
    comment: 'Soporte e incidencias generales sobre el catálogo de aplicaciones.',
    illustration: 'application',
  },
  {
    id: 6,
    parentId: 0,
    level: 1,
    name: 'Sistema',
    completeName: 'Sistema',
    groupId: 3,
    group: 'Service Desk',
    comment: 'Infraestructura tecnológica, sistemas operativos, redes y conectividad.',
    illustration: 'asset-desktop-1',
  },
  {
    id: 7,
    parentId: 0,
    level: 1,
    name: 'Service Desk',
    completeName: 'Service Desk',
    groupId: 3,
    group: 'Service Desk',
    comment: 'Solicitud de requerimientos como fichas del CRM, Accesos de Capacitación, etc.',
    illustration: 'helpdesk',
  },
  {
    id: 10,
    parentId: 0,
    level: 1,
    name: 'BI',
    completeName: 'BI',
    groupId: 2,
    group: 'BI',
    comment: 'Inteligencia de negocios, analítica de datos, tableros y reportería.',
    illustration: 'bi-reporting-1',
  },
  // Nivel 2 (Subcategorías)
  {
    id: 3,
    parentId: 2,
    level: 2,
    name: 'Acceso a sistema',
    completeName: 'Requerimiento > Acceso a sistema',
    groupId: 3,
    group: 'Service Desk',
    comment: 'Solicitud de altas de usuario, permisos, credenciales y accesos a sistemas corporativos.',
    illustration: 'request-service',
  },
  {
    id: 4,
    parentId: 1,
    level: 2,
    name: 'Software',
    completeName: 'Desarrollo > Software',
    groupId: 1,
    group: 'Desarrollo',
    comment: 'Ticket relacionado con las incidencias que se presentan en software base, ofimática y sistemas operativos.',
    illustration: 'software-deployment',
  },
  {
    id: 9,
    parentId: 1,
    level: 2,
    name: 'Aplicaciones GSI',
    completeName: 'Desarrollo > Aplicaciones GSI',
    groupId: 1,
    group: 'Desarrollo',
    comment: 'Ticket relacionado con las incidencias presentadas por los aplicativos internos y corporativos.',
    illustration: 'application',
  },
  {
    id: 11,
    parentId: 1,
    level: 2,
    name: 'Dev',
    completeName: 'Desarrollo > Dev',
    groupId: 1,
    group: 'Desarrollo',
    comment: 'Solicitudes de desarrollo evolutivo, integraciones técnicas y ajustes de código.',
    illustration: 'application',
  },
  {
    id: 14,
    parentId: 10,
    level: 2,
    name: 'Requerimiento BI',
    completeName: 'BI > Requerimiento BI',
    groupId: 2,
    group: 'BI',
    comment: 'Solicitud de requerimientos dirigidos al área de BI, reportes y tableros analíticos.',
    illustration: 'bi-reporting-1',
  },
  {
    id: 18,
    parentId: 10,
    level: 2,
    name: 'Informes',
    completeName: 'BI > Informes',
    groupId: 2,
    group: 'BI',
    comment: 'Ticket relacionado con las incidencias que se presentan en los informes, extracciones de datos o planillas.',
    illustration: 'file-sheet',
  },
  {
    id: 15,
    parentId: 7,
    level: 2,
    name: 'Call Center',
    completeName: 'Service Desk > Call Center',
    groupId: 3,
    group: 'Service Desk',
    comment: 'Incidencias y requerimientos operativos de puestos y telefonía de Call Center.',
    illustration: 'helpdesk',
  },
  {
    id: 16,
    parentId: 7,
    level: 2,
    name: 'Hardware',
    completeName: 'Service Desk > Hardware',
    groupId: 3,
    group: 'Service Desk',
    comment: 'Ticket relacionado a los problemas que se presentan con el Monitor, PC, fuentes o componentes físicos.',
    illustration: 'asset-desktop-1',
  },
  {
    id: 17,
    parentId: 7,
    level: 2,
    name: 'Soporte Nivel 1',
    completeName: 'Service Desk > Soporte Nivel 1',
    groupId: 3,
    group: 'Service Desk',
    comment: 'Asistencia técnica de primer nivel y atención inicial al usuario.',
    illustration: 'helpdesk',
  },
  {
    id: 19,
    parentId: 7,
    level: 2,
    name: 'Periféricos',
    completeName: 'Service Desk > Periféricos',
    groupId: 3,
    group: 'Service Desk',
    comment: 'Ticket relacionado a los problemas que se presentan con los periféricos (teclado, mouse, lector, etc.).',
    illustration: 'asset-peripheral',
  },
];

// Las 8 categorías de formularios destacados del Catálogo de Servicios
const FEATURED_CATALOG_CATEGORIES = [
  {
    id: 1,
    name: 'Requerimiento Service Desk',
    comment: 'Solicitud de requerimientos como fichas del CRM, Accesos de Capacitación, etc.',
    illustration: 'helpdesk',
    itilCategoryId: 7,
  },
  {
    id: 2,
    name: 'Requerimiento BI',
    comment: 'Solicitud de requerimientos dirigidos al área de BI, reportes y tableros analíticos.',
    illustration: 'bi-reporting-1',
    itilCategoryId: 14,
  },
  {
    id: 3,
    name: 'Aplicaciones GSI',
    comment: 'Ticket relacionado con las incidencias presentadas por los aplicativos internos y corporativos.',
    illustration: 'application',
    itilCategoryId: 9,
  },
  {
    id: 4,
    name: 'Periféricos',
    comment: 'Ticket relacionado a los problemas que se presentan con los periféricos (teclado, mouse, lector, etc.).',
    illustration: 'asset-peripheral',
    itilCategoryId: 19,
  },
  {
    id: 5,
    name: 'Hardware',
    comment: 'Ticket relacionado a los problemas que se presentan con el Monitor, PC, fuentes o componentes físicos.',
    illustration: 'asset-desktop-1',
    itilCategoryId: 16,
  },
  {
    id: 6,
    name: 'Software',
    comment: 'Ticket relacionado con las incidencias que se presentan en software base, ofimática y sistemas operativos.',
    illustration: 'software-deployment',
    itilCategoryId: 4,
  },
  {
    id: 7,
    name: 'Informes',
    comment: 'Ticket relacionado con las incidencias que se presentan en los informes, extracciones de datos o planillas.',
    illustration: 'file-sheet',
    itilCategoryId: 18,
  },
  {
    id: 8,
    name: 'Acceso a sistema',
    comment: 'Solicitud de altas de usuario, permisos, credenciales y accesos a sistemas corporativos.',
    illustration: 'request-service',
    itilCategoryId: 3,
  },
];

function runSql(sql) {
  try {
    return execSync(
      `docker exec -i ${mariadbContainer} mariadb --default-character-set=utf8mb4 -u ${mariadbUser} -p"${mariadbPassword}" -N -B ${mariadbDatabase}`,
      { input: `SET NAMES utf8mb4;\n${sql}`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
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
  console.log('--- Iniciando configuración de 16 Categorías ITIL y 3 Grupos Técnicos en GLPI 11 ---');

  // Paso 1: Asegurar únicamente los 3 grupos técnicos organizacionales reales (1, 2, 3)
  for (const grp of TECHNICAL_GROUPS) {
    const escapedName = escapeSql(grp.name);
    runSql(`
      INSERT INTO glpi_groups (id, name, entities_id, is_recursive, completename, is_requester, is_watcher, is_assign, is_task, is_notify, is_itemgroup, is_usergroup, date_creation, date_mod)
      VALUES (${grp.id}, '${escapedName}', 0, 1, '${escapedName}', 1, 1, 1, 1, 1, 1, 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        completename = VALUES(completename),
        is_recursive = 1,
        is_assign = 1,
        date_mod = NOW();
    `);
  }
  // Eliminar grupos espurios si algún script antiguo creó grupos con nombres de categorías (id > 3)
  runSql(`DELETE FROM glpi_groups WHERE id > 3;`);
  console.log('✓ 3 Grupos técnicos reales verificados en glpi_groups (1=Desarrollo, 2=BI, 3=Service Desk).');

  // Paso 2: Eliminar categorías duplicadas fuera del conjunto canónico de 16 IDs
  const validCatIds = ITIL_CATEGORIES.map((c) => c.id).join(', ');
  runSql(`DELETE FROM glpi_itilcategories WHERE id NOT IN (${validCatIds});`);

  // Paso 3: Insertar / Actualizar las 16 Categorías ITIL con jerarquía, UTF-8 y groups_id
  for (const cat of ITIL_CATEGORIES) {
    const escapedName = escapeSql(cat.name);
    const escapedComplete = escapeSql(cat.completeName);
    const escapedComment = escapeSql(cat.comment);

    runSql(`
      INSERT INTO glpi_itilcategories (
        id, entities_id, is_recursive, itilcategories_id, name, completename,
        comment, level, groups_id, is_helpdeskvisible, is_incident, is_request,
        is_problem, is_change, date_creation, date_mod
      ) VALUES (
        ${cat.id}, 0, 1, ${cat.parentId}, '${escapedName}', '${escapedComplete}',
        '${escapedComment}', ${cat.level}, ${cat.groupId}, 1, 1, 1,
        1, 1, NOW(), NOW()
      )
      ON DUPLICATE KEY UPDATE
        entities_id = 0,
        is_recursive = 1,
        itilcategories_id = VALUES(itilcategories_id),
        name = VALUES(name),
        completename = VALUES(completename),
        comment = VALUES(comment),
        level = VALUES(level),
        groups_id = VALUES(groups_id),
        is_helpdeskvisible = 1,
        is_incident = 1,
        is_request = 1,
        is_problem = 1,
        is_change = 1,
        date_mod = NOW();
    `);
    console.log(`✓ Categoría ITIL [${cat.id}] "${cat.completeName}" (Nivel ${cat.level}) -> Grupo [${cat.groupId}] "${cat.group}"`);
  }

  // Paso 4: Configurar obligatoriedad y permisos de lectura sobre Categorías ITIL
  runSql(`
    UPDATE glpi_forms_questions
    SET is_mandatory = 1
    WHERE type = 'Glpi\\\\Form\\\\QuestionType\\\\QuestionTypeItemDropdown'
       OR id IN (2, 10);
  `);

  runSql(`
    INSERT INTO glpi_tickettemplatemandatoryfields (tickettemplates_id, num)
    SELECT 1, 7
    WHERE NOT EXISTS (
      SELECT 1 FROM glpi_tickettemplatemandatoryfields WHERE tickettemplates_id = 1 AND num = 7
    );
  `);

  runSql(`UPDATE glpi_profilerights SET rights = 1 WHERE name = 'itilcategory' AND profiles_id IN (1, 6) AND rights = 0;`);
  runSql(`UPDATE glpi_entities SET auto_assign_mode = 2 WHERE id = 0;`);
  console.log('✓ Permisos y auto-asignación por categoría (auto_assign_mode = 2) configurados.');

  // Paso 5: Poblar glpi_forms_categories para las 8 tarjetas destacadas del Catálogo de Servicios
  for (const fcat of FEATURED_CATALOG_CATEGORIES) {
    const escapedName = escapeSql(fcat.name);
    const escapedDesc = escapeSql(fcat.comment);
    const escapedIllustration = escapeSql(fcat.illustration);

    runSql(`
      INSERT INTO glpi_forms_categories (id, name, description, illustration, forms_categories_id, completename, level, comment)
      VALUES (${fcat.id}, '${escapedName}', '${escapedDesc}', '${escapedIllustration}', 0, '${escapedName}', 1, '${escapedDesc}')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        illustration = VALUES(illustration),
        forms_categories_id = 0,
        completename = VALUES(completename),
        level = 1,
        comment = VALUES(comment);
    `);
  }
  console.log('✓ 8 Categorías visuales del Catálogo de Servicios configuradas en glpi_forms_categories.');

  // Paso 6: Configurar las 3 Reglas de Negocio (RuleTicket) hacia los 3 grupos técnicos
  runSql(`UPDATE glpi_rules SET is_active = 0 WHERE name LIKE 'Enrutamiento ITIL%';`);

  const routingRules = [
    { name: 'H38 Route Desarrollo', ranking: 1, groupId: 1, catIds: [1, 4, 5, 9, 11] },
    { name: 'H38 Route BI', ranking: 2, groupId: 2, catIds: [10, 14, 18] },
    { name: 'H38 Route Service Desk', ranking: 3, groupId: 3, catIds: [2, 3, 6, 7, 15, 16, 17, 19] },
  ];

  for (const r of routingRules) {
    const escapedRuleName = escapeSql(r.name);
    runSql(`
      INSERT INTO glpi_rules (entities_id, sub_type, ranking, name, \`match\`, is_active, is_recursive, \`condition\`, date_creation, date_mod)
      SELECT 0, 'RuleTicket', ${r.ranking}, '${escapedRuleName}', 'OR', 1, 1, 0, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM glpi_rules WHERE name = '${escapedRuleName}' AND sub_type = 'RuleTicket');
    `);
    runSql(`
      UPDATE glpi_rules
      SET ranking = ${r.ranking}, \`match\` = 'OR', is_active = 1, is_recursive = 1, \`condition\` = 0, date_mod = NOW()
      WHERE name = '${escapedRuleName}' AND sub_type = 'RuleTicket';
    `);

    const ruleId = runSql(`SELECT id FROM glpi_rules WHERE name = '${escapedRuleName}' AND sub_type = 'RuleTicket' LIMIT 1;`).trim();
    if (!ruleId) {
      throw new Error(`No se pudo obtener el ID de la regla "${r.name}"`);
    }

    const criteriaValues = r.catIds.map((cid) => `(${ruleId}, 'itilcategories_id', 0, '${cid}')`).join(', ');
    runSql(`
      DELETE FROM glpi_rulecriterias WHERE rules_id = ${ruleId};
      INSERT INTO glpi_rulecriterias (rules_id, criteria, \`condition\`, pattern) VALUES ${criteriaValues};
      DELETE FROM glpi_ruleactions WHERE rules_id = ${ruleId};
      INSERT INTO glpi_ruleactions (rules_id, action_type, field, value) VALUES (${ruleId}, 'assign', '_groups_id_assign', '${r.groupId}');
    `);
    console.log(`✓ Regla de negocio activa [${ruleId}] "${r.name}" -> Grupo ${r.groupId} (Categorías: ${r.catIds.join(', ')})`);
  }

  // Paso 7: Verificación estricta en base de datos
  console.log('\n--- Verificando las 16 categorías ITIL y su vinculación en Base de Datos ---');
  for (const cat of ITIL_CATEGORIES) {
    const verifySql = `
      SELECT c.id, c.name, c.completename, c.level, c.groups_id, g.name AS group_name, c.is_helpdeskvisible
      FROM glpi_itilcategories c
      INNER JOIN glpi_groups g ON g.id = c.groups_id
      WHERE c.id = ${cat.id};
    `;
    const res = runSql(verifySql).trim();
    if (!res) {
      throw new Error(`Verificación fallida: Categoría ID ${cat.id} ("${cat.name}") no encontrada.`);
    }
    const [id, name, completeName, level, groupId, groupName, visible] = res.split('\t');
    if (parseInt(groupId, 10) !== cat.groupId || groupName !== cat.group) {
      throw new Error(
        `Verificación fallida: Categoría [${id}] "${name}" vinculada a grupo inesperado [${groupId}] "${groupName}" (esperado: [${cat.groupId}] "${cat.group}").`
      );
    }
    console.log(`✓ [${id}] "${completeName}" (Nivel ${level}) -> Grupo [${groupId}] "${groupName}" (Visible: ${visible})`);
  }

  console.log('\n--- Configuración de 16 Categorías ITIL y Enrutamiento completada exitosamente ---\n');
}

if (require.main === module) {
  try {
    seedGlpiCategories();
  } catch (err) {
    console.error('Error fatal al configurar categorías GLPI:', err.message);
    process.exit(1);
  }
}

module.exports = { seedGlpiCategories, ITIL_CATEGORIES, FEATURED_CATALOG_CATEGORIES, TECHNICAL_GROUPS };
