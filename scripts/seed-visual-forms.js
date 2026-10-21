const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
if (!mariadbPassword) mariadbPassword = 'VW9Qr7m2XSkGd0tHegGGq3hhrHcD';

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

const FORMS_CONFIG = [
  {
    catId: 1,
    name: 'Requerimiento Service Desk',
    desc: 'Solicitud de requerimientos como fichas del CRM, Accesos de Capacitación, etc.',
    illustration: 'helpdesk',
    itilCatName: 'Requerimiento Service Desk',
  },
  {
    catId: 2,
    name: 'Requerimiento BI',
    desc: 'Solicitud de requerimientos dirigidos al área de BI, reportes y tableros analíticos.',
    illustration: 'bi-reporting-1',
    itilCatName: 'Requerimiento BI',
  },
  {
    catId: 3,
    name: 'Aplicaciones GSI',
    desc: 'Ticket relacionado con las incidencias presentadas por los aplicativos internos y corporativos.',
    illustration: 'application',
    itilCatName: 'Aplicaciones GSI',
  },
  {
    catId: 4,
    name: 'Periféricos',
    desc: 'Ticket relacionado a los problemas que se presentan con los periféricos (teclado, mouse, lector, etc.).',
    illustration: 'asset-peripheral',
    itilCatName: 'Periféricos',
  },
  {
    catId: 5,
    name: 'Hardware',
    desc: 'Ticket relacionado a los problemas que se presentan con el Monitor, PC, fuentes o componentes físicos.',
    illustration: 'asset-desktop-1',
    itilCatName: 'Hardware',
  },
  {
    catId: 6,
    name: 'Software',
    desc: 'Ticket relacionado con las incidencias que se presentan en software base, ofimática y sistemas operativos.',
    illustration: 'software-deployment',
    itilCatName: 'Software',
  },
  {
    catId: 7,
    name: 'Informes',
    desc: 'Ticket relacionado con las incidencias que se presentan en los informes, extracciones de datos o planillas.',
    illustration: 'file-sheet',
    itilCatName: 'Informes',
  },
];

function seedVisualForms() {
  console.log('--- Configurando Formularios Visuales para el Catálogo de Servicios ---');

  // 1. Asegurar catálogo expandido en Entidad Raíz
  runSql(`UPDATE glpi_entities SET enable_helpdesk_service_catalog = 1, expand_service_catalog = 1 WHERE id = 0;`);

  // 2. Vincular o crear los 7 formularios correspondientes a cada categoría
  for (const cfg of FORMS_CONFIG) {
    const escapedName = escapeSql(cfg.name);
    const escapedDesc = escapeSql(cfg.desc);
    const escapedIll = escapeSql(cfg.illustration);

    // Buscar si ya existe un formulario para esta categoría
    const existingFormId = runSql(`SELECT id FROM glpi_forms_forms WHERE forms_categories_id = ${cfg.catId} OR name = '${escapedName}' LIMIT 1;`).trim();

    let formId;
    if (existingFormId) {
      formId = existingFormId;
      runSql(`
        UPDATE glpi_forms_forms
        SET 
          name = '${escapedName}',
          description = '${escapedDesc}',
          illustration = '${escapedIll}',
          forms_categories_id = ${cfg.catId},
          is_active = 1,
          is_deleted = 0,
          is_draft = 0,
          entities_id = 0,
          is_recursive = 1
        WHERE id = ${formId};
      `);
      console.log(`✓ Formulario actualizado [${formId}]: "${cfg.name}" -> Categoría visual [${cfg.catId}]`);
    } else {
      const formUuid = crypto.randomUUID();
      runSql(`
        INSERT INTO glpi_forms_forms (
          uuid, entities_id, is_recursive, is_active, is_deleted, is_draft,
          render_layout, name, illustration, description, forms_categories_id,
          usage_count, submit_button_visibility_strategy, submit_button_conditions,
          date_creation, date_mod
        ) VALUES (
          '${formUuid}', 0, 1, 1, 0, 0,
          '', '${escapedName}', '${escapedIll}', '${escapedDesc}', ${cfg.catId},
          0, '', '[]',
          NOW(), NOW()
        );
      `);
      formId = runSql(`SELECT id FROM glpi_forms_forms WHERE uuid = '${formUuid}' LIMIT 1;`).trim();
      console.log(`✓ Formulario creado [${formId}]: "${cfg.name}" -> Categoría visual [${cfg.catId}]`);

      // Crear sección para el formulario
      const sectionUuid = crypto.randomUUID();
      runSql(`
        INSERT INTO glpi_forms_sections (uuid, forms_forms_id, name, rank, conditions)
        VALUES ('${sectionUuid}', ${formId}, 'Detalles del Requerimiento', 0, '[]');
      `);
      const sectionId = runSql(`SELECT id FROM glpi_forms_sections WHERE uuid = '${sectionUuid}' LIMIT 1;`).trim();

      // Crear preguntas estándar
      const qTitleUuid = crypto.randomUUID();
      runSql(`
        INSERT INTO glpi_forms_questions (
          uuid, forms_sections_id, forms_sections_uuid, name, type,
          is_mandatory, vertical_rank, conditions, validation_conditions
        ) VALUES (
          '${qTitleUuid}', ${sectionId}, '${sectionUuid}', 'Título',
          'Glpi\\\\Form\\\\QuestionType\\\\QuestionTypeShortText', 1, 0, '[]', '[]'
        );
      `);
      const qTitleId = runSql(`SELECT id FROM glpi_forms_questions WHERE uuid = '${qTitleUuid}' LIMIT 1;`).trim();

      const qDescUuid = crypto.randomUUID();
      runSql(`
        INSERT INTO glpi_forms_questions (
          uuid, forms_sections_id, forms_sections_uuid, name, type,
          is_mandatory, vertical_rank, conditions, validation_conditions
        ) VALUES (
          '${qDescUuid}', ${sectionId}, '${sectionUuid}', 'Descripción',
          'Glpi\\\\Form\\\\QuestionType\\\\QuestionTypeLongText', 1, 1, '[]', '[]'
        );
      `);
      const qDescId = runSql(`SELECT id FROM glpi_forms_questions WHERE uuid = '${qDescUuid}' LIMIT 1;`).trim();

      const qUrgUuid = crypto.randomUUID();
      runSql(`
        INSERT INTO glpi_forms_questions (
          uuid, forms_sections_id, forms_sections_uuid, name, type,
          is_mandatory, vertical_rank, conditions, validation_conditions
        ) VALUES (
          '${qUrgUuid}', ${sectionId}, '${sectionUuid}', 'Urgencia',
          'Glpi\\\\Form\\\\QuestionType\\\\QuestionTypeUrgency', 0, 2, '[]', '[]'
        );
      `);

      const destConfig = JSON.stringify({
        "glpi-form-destination-commonitilfield-titlefield": {
          "value": `<span data-form-tag="true" data-form-tag-value="${qTitleId}" data-form-tag-provider="Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: Título</span>`
        },
        "glpi-form-destination-commonitilfield-contentfield_auto": false,
        "glpi-form-destination-commonitilfield-contentfield": {
          "value": `<span data-form-tag="true" data-form-tag-value="${qDescId}" data-form-tag-provider="Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: Descripción</span>`
        },
        "glpi-form-destination-commonitilfield-requesttypefield": {
          "strategy": "specific_value",
          "specific_question_id": null,
          "specific_request_type": 2
        },
        "glpi-form-destination-commonitilfield-observerfield": {
          "strategies": ["last_valid_answer"],
          "specific_itilactors_ids": [],
          "specific_question_ids": []
        },
        "glpi-form-destination-commonitilfield-linkeditilobjectsfield": {
          "strategy_configs": [{
            "strategy": null,
            "linktype": "",
            "specific_destination_ids": [],
            "specific_question_ids": [],
            "specific_itilobject": []
          }]
        }
      });

      const escapedJsonForSql = destConfig.replace(/\\/g, '\\\\').replace(/'/g, "''");

      runSql(`
        INSERT INTO glpi_forms_destinations_formdestinations (
          forms_forms_id, itemtype, name, config, creation_strategy, conditions
        ) VALUES (
          ${formId}, 'Glpi\\\\Form\\\\Destination\\\\FormDestinationTicket',
          'Solicitud', '${escapedJsonForSql}', '', '[]'
        );
      `);
    }

    // 3. Crear ficha de mosaico (FormTile) en Helpdesk si no existe
    const existingTileId = runSql(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = ${formId} LIMIT 1;`).trim();
    let tileId;
    if (!existingTileId) {
      runSql(`INSERT INTO glpi_helpdesks_tiles_formtiles (forms_forms_id) VALUES (${formId});`);
      tileId = runSql(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = ${formId} LIMIT 1;`).trim();
    } else {
      tileId = existingTileId;
    }

    // Registrar en glpi_helpdesks_tiles_items_tiles para la Entidad 0
    const existingItemTile = runSql(`
      SELECT id FROM glpi_helpdesks_tiles_items_tiles 
      WHERE itemtype_item = 'Entity' AND items_id_item = 0 
        AND itemtype_tile = 'Glpi\\\\Helpdesk\\\\Tile\\\\FormTile' 
        AND items_id_tile = ${tileId} LIMIT 1;
    `).trim();

    if (!existingItemTile) {
      const maxRank = parseInt(runSql(`SELECT COALESCE(MAX(rank), 0) + 1 FROM glpi_helpdesks_tiles_items_tiles WHERE itemtype_item = 'Entity' AND items_id_item = 0;`).trim(), 10);
      runSql(`
        INSERT INTO glpi_helpdesks_tiles_items_tiles (itemtype_item, items_id_item, itemtype_tile, items_id_tile, rank)
        VALUES ('Entity', 0, 'Glpi\\\\Helpdesk\\\\Tile\\\\FormTile', ${tileId}, ${maxRank});
      `);
      console.log(`✓ Tarjeta Helpdesk registrada para: "${cfg.name}" (Tile ID ${tileId}, Rank ${maxRank})`);
    }
  }

  console.log('--- Catálogo Visual de GLPI configurado con éxito ---\n');
}

if (require.main === module) {
  try {
    seedVisualForms();
  } catch (err) {
    console.error('Error al configurar formularios visuales:', err.message);
    process.exit(1);
  }
}

module.exports = { seedVisualForms };
