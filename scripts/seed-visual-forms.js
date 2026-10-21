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

  // 2. Configurar o actualizar los 7 formularios visuales
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
    }

    // 2.1 Asegurar permiso de acceso (AllowList para todos los usuarios)
    const existingAccessControl = runSql(`SELECT id FROM glpi_forms_accesscontrols_formaccesscontrols WHERE forms_forms_id = ${formId} LIMIT 1;`).trim();
    if (!existingAccessControl) {
      runSql(`
        INSERT INTO glpi_forms_accesscontrols_formaccesscontrols (forms_forms_id, strategy, config, is_active)
        VALUES (${formId}, 'Glpi\\\\Form\\\\AccessControl\\\\ControlType\\\\AllowList', '{"user_ids":["all"],"group_ids":[],"profile_ids":[]}', 1);
      `);
      console.log(`  ✓ Política de acceso asignada a formulario ${formId} (AllowList: all)`);
    }

    // 2.2 Asegurar sección
    let sectionId = runSql(`SELECT id FROM glpi_forms_sections WHERE forms_forms_id = ${formId} LIMIT 1;`).trim();
    let sectionUuid;
    if (!sectionId) {
      sectionUuid = crypto.randomUUID();
      runSql(`
        INSERT INTO glpi_forms_sections (uuid, forms_forms_id, name, rank, conditions)
        VALUES ('${sectionUuid}', ${formId}, 'Detalles del Requerimiento', 0, '[]');
      `);
      sectionId = runSql(`SELECT id FROM glpi_forms_sections WHERE uuid = '${sectionUuid}' LIMIT 1;`).trim();
    } else {
      sectionUuid = runSql(`SELECT uuid FROM glpi_forms_sections WHERE id = ${sectionId} LIMIT 1;`).trim();
    }

    // 2.3 Pregunta: Título
    let qTitleId = runSql(`SELECT id FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND name = 'Título' LIMIT 1;`).trim();
    if (!qTitleId) {
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
      qTitleId = runSql(`SELECT id FROM glpi_forms_questions WHERE uuid = '${qTitleUuid}' LIMIT 1;`).trim();
    }

    // 2.4 Pregunta: Descripción
    let qDescId = runSql(`SELECT id FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND name = 'Descripción' LIMIT 1;`).trim();
    if (!qDescId) {
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
      qDescId = runSql(`SELECT id FROM glpi_forms_questions WHERE uuid = '${qDescUuid}' LIMIT 1;`).trim();
    }

    // 2.5 Pregunta: Urgencia
    let qUrgId = runSql(`SELECT id FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND name = 'Urgencia' LIMIT 1;`).trim();
    if (!qUrgId) {
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
      qUrgId = runSql(`SELECT id FROM glpi_forms_questions WHERE uuid = '${qUrgUuid}' LIMIT 1;`).trim();
    }

    // 2.6 Pregunta: Categoría (Dropdown ITILCategory)
    let qCatId = runSql(`SELECT id FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND name = 'Categoría' LIMIT 1;`).trim();
    if (!qCatId) {
      const qCatUuid = crypto.randomUUID();
      const catExtraData = JSON.stringify({
        itemtype: "ITILCategory",
        categories_filter: ["request", "incident", "change", "problem"],
        root_items_id: 0,
        subtree_depth: 0,
        selectable_tree_root: false
      });
      runSql(`
        INSERT INTO glpi_forms_questions (
          uuid, forms_sections_id, forms_sections_uuid, name, type,
          is_mandatory, vertical_rank, conditions, validation_conditions, extra_data
        ) VALUES (
          '${qCatUuid}', ${sectionId}, '${sectionUuid}', 'Categoría',
          'Glpi\\\\Form\\\\QuestionType\\\\QuestionTypeItemDropdown', 1, 3, '[]', '[]',
          '${catExtraData}'
        );
      `);
      qCatId = runSql(`SELECT id FROM glpi_forms_questions WHERE uuid = '${qCatUuid}' LIMIT 1;`).trim();
      console.log(`  ✓ Pregunta "Categoría" añadida [${qCatId}] al formulario ${formId}`);
    }

    // 2.7 Configurar destino con mapeo de Categoría hacia itilcategories_id
    const destConfig = JSON.stringify({
      "glpi-form-destination-commonitilfield-titlefield": {
        "value": `<span data-form-tag="true" data-form-tag-value="${qTitleId}" data-form-tag-provider="Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: Título</span>`
      },
      "glpi-form-destination-commonitilfield-contentfield_auto": false,
      "glpi-form-destination-commonitilfield-contentfield": {
        "value": `<span data-form-tag="true" data-form-tag-value="${qDescId}" data-form-tag-provider="Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: Descripción</span>`
      },
      "glpi-form-destination-commonitilfield-itilcategoryfield": {
        "strategy": "specific_answer",
        "specific_question_id": parseInt(qCatId, 10),
        "specific_itilcategory_id": null
      },
      "glpi-form-destination-commonitilfield-requesttypefield": {
        "strategy": "specific_value",
        "specific_question_id": null,
        "specific_request_type": 2
      },
      "glpi-form-destination-commonitilfield-urgencyfield": {
        "strategy": "last_valid_answer",
        "specific_question_id": null,
        "specific_urgency": null
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

    const existingDestId = runSql(`SELECT id FROM glpi_forms_destinations_formdestinations WHERE forms_forms_id = ${formId} LIMIT 1;`).trim();
    if (existingDestId) {
      runSql(`
        UPDATE glpi_forms_destinations_formdestinations
        SET config = '${escapedJsonForSql}', name = 'Solicitud'
        WHERE id = ${existingDestId};
      `);
      console.log(`  ✓ Destino de ticket actualizado para formulario ${formId} con mapeo de Categoría`);
    } else {
      runSql(`
        INSERT INTO glpi_forms_destinations_formdestinations (
          forms_forms_id, itemtype, name, config, creation_strategy, conditions
        ) VALUES (
          ${formId}, 'Glpi\\\\Form\\\\Destination\\\\FormDestinationTicket',
          'Solicitud', '${escapedJsonForSql}', '', '[]'
        );
      `);
      console.log(`  ✓ Destino de ticket creado para formulario ${formId} con mapeo de Categoría`);
    }

    // 2.8 Ficha de mosaico (FormTile)
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
      console.log(`  ✓ Tarjeta Helpdesk registrada para: "${cfg.name}" (Tile ID ${tileId}, Rank ${maxRank})`);
    }
  }

  // 3. Mapear también los formularios estándar Form 1 ("Reportar un problema") y Form 2 ("Solicitar un servicio")
  console.log('\n--- Actualizando destinos de Formularios Estándar (1 y 2) ---');
  // Form 1: Categoría es question id 2
  const dest1 = JSON.stringify({
    "glpi-form-destination-commonitilfield-titlefield": {
      "value": `<span data-form-tag="true" data-form-tag-value="6" data-form-tag-provider="Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: Título</span>`
    },
    "glpi-form-destination-commonitilfield-contentfield_auto": false,
    "glpi-form-destination-commonitilfield-contentfield": {
      "value": `<span data-form-tag="true" data-form-tag-value="7" data-form-tag-provider="Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: Descripción</span>`
    },
    "glpi-form-destination-commonitilfield-itilcategoryfield": {
      "strategy": "specific_answer",
      "specific_question_id": 2,
      "specific_itilcategory_id": null
    },
    "glpi-form-destination-commonitilfield-requesttypefield": {
      "strategy": "specific_value",
      "specific_question_id": null,
      "specific_request_type": 1
    },
    "glpi-form-destination-commonitilfield-urgencyfield": {
      "strategy": "last_valid_answer",
      "specific_question_id": null,
      "specific_urgency": null
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
  }).replace(/\\/g, '\\\\').replace(/'/g, "''");

  runSql(`UPDATE glpi_forms_destinations_formdestinations SET config = '${dest1}' WHERE forms_forms_id = 1;`);
  console.log('✓ Formulario 1 ("Reportar un problema") vinculado a question 2 (Categoría)');

  // Form 2: Categoría es question id 10
  const dest2 = JSON.stringify({
    "glpi-form-destination-commonitilfield-titlefield": {
      "value": `<span data-form-tag="true" data-form-tag-value="14" data-form-tag-provider="Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: Título</span>`
    },
    "glpi-form-destination-commonitilfield-contentfield_auto": false,
    "glpi-form-destination-commonitilfield-contentfield": {
      "value": `<span data-form-tag="true" data-form-tag-value="15" data-form-tag-provider="Glpi\\\\Form\\\\Tag\\\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: Descripción</span>`
    },
    "glpi-form-destination-commonitilfield-itilcategoryfield": {
      "strategy": "specific_answer",
      "specific_question_id": 10,
      "specific_itilcategory_id": null
    },
    "glpi-form-destination-commonitilfield-requesttypefield": {
      "strategy": "specific_value",
      "specific_question_id": null,
      "specific_request_type": 2
    },
    "glpi-form-destination-commonitilfield-urgencyfield": {
      "strategy": "last_valid_answer",
      "specific_question_id": null,
      "specific_urgency": null
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
  }).replace(/\\/g, '\\\\').replace(/'/g, "''");

  runSql(`UPDATE glpi_forms_destinations_formdestinations SET config = '${dest2}' WHERE forms_forms_id = 2;`);
  console.log('✓ Formulario 2 ("Solicitar un servicio") vinculado a question 10 (Categoría)');

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
