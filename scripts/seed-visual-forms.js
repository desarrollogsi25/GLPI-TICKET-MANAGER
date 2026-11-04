#!/usr/bin/env node
/**
 * =============================================================================
 * Script de Configuración de Formularios Inteligentes y Catálogo de Servicios GLPI 11
 * Proyecto: GLPI-TICKET-MANAGER
 *
 * Configura:
 * 1. Idioma español por defecto en la entidad y configuración global (`es_ES`).
 * 2. Las 8 tarjetas destacadas del Catálogo de Servicios (`SERVICIOS DESTACADOS`)
 *    con formularios inteligentes adaptados a cada servicio:
 *      - Requerimiento Service Desk -> Cat 7 (Service Desk) -> Grupo 3 (Service Desk)
 *      - Requerimiento BI           -> Cat 14 (BI > Requerimiento BI) -> Grupo 2 (BI)
 *      - Aplicaciones GSI           -> Cat 9 (Desarrollo > Aplicaciones GSI) -> Grupo 1 (Desarrollo)
 *      - Periféricos                -> Cat 19 (Service Desk > Periféricos) -> Grupo 3 (Service Desk)
 *      - Hardware                   -> Cat 16 (Service Desk > Hardware) -> Grupo 3 (Service Desk)
 *      - Software                   -> Cat 4 (Desarrollo > Software) -> Grupo 1 (Desarrollo)
 *      - Informes                   -> Cat 18 (BI > Informes) -> Grupo 2 (BI)
 *      - Acceso a sistema           -> Cat 3 (Requerimiento > Acceso a sistema) -> Grupo 3 (Service Desk)
 *    Cada formulario usa `ITILCategoryFieldStrategy::SPECIFIC_VALUE` (`specific_value`)
 *    para que el usuario NO tenga que elegir grupo técnico ni categoría interna.
 * 3. Los 2 formularios generales en español (`Reportar una incidencia general` y
 *    `Solicitar un servicio general`) con selector jerárquico obligatorio de las 16 categorías ITIL.
 * =============================================================================
 */

const { execFileSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const ANSWER_TAG_PROVIDER = 'Glpi\\Form\\Tag\\AnswerTagProvider';

const GUARD = path.resolve(__dirname, 'e2e/guard.mjs');

function runSql(sql) {
  try {
    return execFileSync(process.execPath, [GUARD, 'sql', 'mariadb'], {
      input: `SET NAMES utf8mb4;\n${sql}`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error('Fixture blocked: a confirmed disposable E2E fixture is required.');
  }
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function answerTag(questionId, label) {
  return `<span data-form-tag="true" data-form-tag-value="${questionId}" data-form-tag-provider="${ANSWER_TAG_PROVIDER}" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: ${label}</span>`;
}

const FORMS_CONFIG = [
  {
    catId: 1,
    name: 'Requerimiento Service Desk',
    desc: 'Solicitud de requerimientos como fichas del CRM, Accesos de Capacitación, etc.',
    illustration: 'helpdesk',
    itilCategoryId: 7, // Service Desk -> Grupo 3 (Service Desk)
    requestType: 2, // Solicitud
    questions: [
      { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Sistema o plataforma relacionada', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Área o usuario beneficiario', type: 'QuestionTypeShortText', mandatory: 0 },
      { key: 'desc', name: 'Descripción detallada del requerimiento', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
      { key: 'file', name: 'Archivo adjunto (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
  {
    catId: 2,
    name: 'Requerimiento BI',
    desc: 'Solicitud de requerimientos dirigidos al área de BI, reportes y tableros analíticos.',
    illustration: 'bi-reporting-1',
    itilCategoryId: 14, // BI > Requerimiento BI -> Grupo 2 (BI)
    requestType: 2, // Solicitud
    questions: [
      { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Informe, tablero o indicador requerido', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Objetivo del requerimiento y periodicidad', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'desc', name: 'Descripción y criterios de negocio', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
      { key: 'file', name: 'Archivo o plantilla de referencia (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
  {
    catId: 3,
    name: 'Aplicaciones GSI',
    desc: 'Ticket relacionado con las incidencias presentadas por los aplicativos internos y corporativos.',
    illustration: 'application',
    itilCategoryId: 9, // Desarrollo > Aplicaciones GSI -> Grupo 1 (Desarrollo)
    requestType: 1, // Incidencia
    questions: [
      { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Aplicativo corporativo o módulo afectado', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Mensaje de error o comportamiento observado', type: 'QuestionTypeShortText', mandatory: 0 },
      { key: 'desc', name: 'Descripción y pasos para reproducir', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
      { key: 'file', name: 'Captura de pantalla o evidencia (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
  {
    catId: 4,
    name: 'Periféricos',
    desc: 'Ticket relacionado a los problemas que se presentan con los periféricos (teclado, mouse, lector, etc.).',
    illustration: 'asset-peripheral',
    itilCategoryId: 19, // Service Desk > Periféricos -> Grupo 3 (Service Desk)
    requestType: 1, // Incidencia
    questions: [
      { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Periférico afectado (teclado, mouse, auricular, lector, impresora)', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Ubicación o puesto de trabajo', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'desc', name: 'Descripción de la falla', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
      { key: 'file', name: 'Fotografía o adjunto (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
  {
    catId: 5,
    name: 'Hardware',
    desc: 'Ticket relacionado a los problemas que se presentan con el Monitor, PC, fuentes o componentes físicos.',
    illustration: 'asset-desktop-1',
    itilCategoryId: 16, // Service Desk > Hardware -> Grupo 3 (Service Desk)
    requestType: 1, // Incidencia
    questions: [
      { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Equipo afectado (PC, portátil, monitor, fuente)', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Ubicación o número de inventario', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'desc', name: 'Descripción del problema físico', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
      { key: 'file', name: 'Archivo o fotografía (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
  {
    catId: 6,
    name: 'Software',
    desc: 'Ticket relacionado con las incidencias que se presentan en software base, ofimática y sistemas operativos.',
    illustration: 'software-deployment',
    itilCategoryId: 4, // Desarrollo > Software -> Grupo 1 (Desarrollo)
    requestType: 1, // Incidencia
    questions: [
      { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Aplicación o programa afectado', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Mensaje o código de error', type: 'QuestionTypeShortText', mandatory: 0 },
      { key: 'desc', name: 'Descripción del incidente', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
      { key: 'file', name: 'Captura de pantalla (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
  {
    catId: 7,
    name: 'Informes',
    desc: 'Ticket relacionado con las incidencias que se presentan en los informes, extracciones de datos o planillas.',
    illustration: 'file-sheet',
    itilCategoryId: 18, // BI > Informes -> Grupo 2 (BI)
    requestType: 1, // Incidencia
    questions: [
      { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Nombre del informe, reporte o planilla afectada', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Periodo o filtro consultado', type: 'QuestionTypeShortText', mandatory: 0 },
      { key: 'desc', name: 'Descripción de la inconsistencia o error en los datos', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
      { key: 'file', name: 'Planilla o captura de evidencia (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
  {
    catId: 8,
    name: 'Acceso a sistema',
    desc: 'Solicitud de altas de usuario, permisos, credenciales y accesos a sistemas corporativos.',
    illustration: 'request-service',
    itilCategoryId: 3, // Requerimiento > Acceso a sistema -> Grupo 3 (Service Desk)
    requestType: 2, // Solicitud
    questions: [
      { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Sistema o recurso al que solicita acceso', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Perfil, rol o nivel de permisos requerido', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'desc', name: 'Motivo de la solicitud y usuario destinatario', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
      { key: 'file', name: 'Autorización o documento adjunto (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
];

function ensureQuestion(sectionId, sectionUuid, rank, qDef) {
  const escapedName = escapeSql(qDef.name);
  const fullType = `Glpi\\\\Form\\\\QuestionType\\\\${qDef.type}`;
  const extraDataSql = qDef.extraData ? `'${escapeSql(JSON.stringify(qDef.extraData))}'` : 'NULL';

  let qId = runSql(
    `SELECT id FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND vertical_rank = ${rank} LIMIT 1;`
  ).trim();

  if (qId) {
    runSql(`
      UPDATE glpi_forms_questions
      SET
        name = '${escapedName}',
        type = '${fullType}',
        is_mandatory = ${qDef.mandatory},
        vertical_rank = ${rank},
        extra_data = ${extraDataSql},
        conditions = '[]',
        validation_conditions = '[]'
      WHERE id = ${qId};
    `);
  } else {
    const qUuid = crypto.randomUUID();
    runSql(`
      INSERT INTO glpi_forms_questions (
        uuid, forms_sections_id, forms_sections_uuid, name, type,
        is_mandatory, vertical_rank, conditions, validation_conditions, extra_data
      ) VALUES (
        '${qUuid}', ${sectionId}, '${sectionUuid}', '${escapedName}',
        '${fullType}', ${qDef.mandatory}, ${rank}, '[]', '[]', ${extraDataSql}
      );
    `);
    qId = runSql(`SELECT id FROM glpi_forms_questions WHERE uuid = '${qUuid}' LIMIT 1;`).trim();
  }
  return parseInt(qId, 10);
}

function seedVisualForms() {
  console.log('--- Configurando Catálogo de Servicios y Formularios Inteligentes en GLPI 11 ---');

  // 1. Configurar idioma Español por defecto y catálogo expandido en Entidad Raíz
  runSql(`
    UPDATE glpi_configs SET value = 'es_ES' WHERE context = 'core' AND name = 'language';
    UPDATE glpi_users SET language = 'es_ES' WHERE language IS NULL OR language = '';
    UPDATE glpi_entities SET enable_helpdesk_service_catalog = 1, expand_service_catalog = 1 WHERE id = 0;
  `);
  console.log('✓ Idioma Español (es_ES) y Catálogo de Servicios expandido activados.');

  // 2. Asegurar las 8 categorías visuales en glpi_forms_categories
  for (const cfg of FORMS_CONFIG) {
    const escapedName = escapeSql(cfg.name);
    const escapedDesc = escapeSql(cfg.desc);
    const escapedIll = escapeSql(cfg.illustration);

    runSql(`
      INSERT INTO glpi_forms_categories (id, name, description, illustration, forms_categories_id, completename, level, comment)
      VALUES (${cfg.catId}, '${escapedName}', '${escapedDesc}', '${escapedIll}', 0, '${escapedName}', 1, '${escapedDesc}')
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

  // 3. Configurar o actualizar los 8 formularios inteligentes destacados
  const featuredTileIds = [];

  for (const cfg of FORMS_CONFIG) {
    const escapedName = escapeSql(cfg.name);
    const escapedDesc = escapeSql(cfg.desc);
    const escapedIll = escapeSql(cfg.illustration);

    const existingFormId = runSql(
      `SELECT id FROM glpi_forms_forms WHERE forms_categories_id = ${cfg.catId} OR name = '${escapedName}' ORDER BY id ASC LIMIT 1;`
    ).trim();

    let formId;
    if (existingFormId) {
      formId = parseInt(existingFormId, 10);
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
          is_recursive = 1,
          date_mod = NOW()
        WHERE id = ${formId};
      `);
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
      formId = parseInt(runSql(`SELECT id FROM glpi_forms_forms WHERE uuid = '${formUuid}' LIMIT 1;`).trim(), 10);
    }

    // Eliminar posibles formularios duplicados de la misma categoría visual
    runSql(`DELETE FROM glpi_forms_forms WHERE (forms_categories_id = ${cfg.catId} OR name = '${escapedName}') AND id <> ${formId};`);

    // 3.1 Permiso de acceso (AllowList para todos los usuarios)
    const existingAccessControl = runSql(
      `SELECT id FROM glpi_forms_accesscontrols_formaccesscontrols WHERE forms_forms_id = ${formId} LIMIT 1;`
    ).trim();
    if (!existingAccessControl) {
      runSql(`
        INSERT INTO glpi_forms_accesscontrols_formaccesscontrols (forms_forms_id, strategy, config, is_active)
        VALUES (${formId}, 'Glpi\\\\Form\\\\AccessControl\\\\ControlType\\\\AllowList', '{"user_ids":["all"],"group_ids":[],"profile_ids":[]}', 1);
      `);
    } else {
      runSql(`
        UPDATE glpi_forms_accesscontrols_formaccesscontrols
        SET strategy = 'Glpi\\\\Form\\\\AccessControl\\\\ControlType\\\\AllowList',
            config = '{"user_ids":["all"],"group_ids":[],"profile_ids":[]}',
            is_active = 1
        WHERE id = ${existingAccessControl};
      `);
    }

    // 3.2 Asegurar sección única
    let sectionId = runSql(`SELECT id FROM glpi_forms_sections WHERE forms_forms_id = ${formId} ORDER BY id ASC LIMIT 1;`).trim();
    let sectionUuid;
    if (!sectionId) {
      sectionUuid = crypto.randomUUID();
      runSql(`
        INSERT INTO glpi_forms_sections (uuid, forms_forms_id, name, rank, conditions)
        VALUES ('${sectionUuid}', ${formId}, 'Detalles de la solicitud', 0, '[]');
      `);
      sectionId = runSql(`SELECT id FROM glpi_forms_sections WHERE uuid = '${sectionUuid}' LIMIT 1;`).trim();
    } else {
      sectionUuid = runSql(`SELECT uuid FROM glpi_forms_sections WHERE id = ${sectionId} LIMIT 1;`).trim();
      runSql(`UPDATE glpi_forms_sections SET name = 'Detalles de la solicitud', rank = 0 WHERE id = ${sectionId};`);
    }

    // 3.3 Sincronizar preguntas inteligentes del formulario (sin pedir categoría interna ni grupo técnico)
    const qIdsByKey = {};
    for (let i = 0; i < cfg.questions.length; i++) {
      const qDef = cfg.questions[i];
      const qId = ensureQuestion(sectionId, sectionUuid, i, qDef);
      qIdsByKey[qDef.key] = { id: qId, name: qDef.name };
    }
    // Limpiar preguntas sobrantes (por ejemplo, el antiguo selector redundante de Categoría en vertical_rank >= cfg.questions.length)
    runSql(`DELETE FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND vertical_rank >= ${cfg.questions.length};`);

    // 3.4 Construir plantilla enriquecida de contenido que consolida las respuestas específicas + descripción
    const contentHtml = [
      `<p><strong>Servicio solicitado:</strong> ${cfg.name}</p>`,
      `<p><strong>${qIdsByKey.context1.name}:</strong> ${answerTag(qIdsByKey.context1.id, qIdsByKey.context1.name)}</p>`,
      `<p><strong>${qIdsByKey.context2.name}:</strong> ${answerTag(qIdsByKey.context2.id, qIdsByKey.context2.name)}</p>`,
      `<hr><p><strong>${qIdsByKey.desc.name}:</strong></p>`,
      `<p>${answerTag(qIdsByKey.desc.id, qIdsByKey.desc.name)}</p>`,
    ].join('');

    // 3.5 Configurar destino automático con `specific_value` hacia la Categoría ITIL exacta
    const destConfig = JSON.stringify({
      'glpi-form-destination-commonitilfield-titlefield': {
        value: answerTag(qIdsByKey.title.id, qIdsByKey.title.name),
      },
      'glpi-form-destination-commonitilfield-contentfield_auto': false,
      'glpi-form-destination-commonitilfield-contentfield': {
        value: contentHtml,
      },
      'glpi-form-destination-commonitilfield-itilcategoryfield': {
        strategy: 'specific_value',
        specific_question_id: null,
        specific_itilcategory_id: cfg.itilCategoryId,
      },
      'glpi-form-destination-commonitilfield-requesttypefield': {
        strategy: 'specific_value',
        specific_question_id: null,
        specific_request_type: cfg.requestType,
      },
      'glpi-form-destination-commonitilfield-urgencyfield': {
        strategy: 'last_valid_answer',
        specific_question_id: null,
        specific_urgency: null,
      },
      'glpi-form-destination-commonitilfield-observerfield': {
        strategies: ['last_valid_answer'],
        specific_itilactors_ids: [],
        specific_question_ids: [],
      },
      'glpi-form-destination-commonitilfield-linkeditilobjectsfield': {
        strategy_configs: [
          {
            strategy: null,
            linktype: '',
            specific_destination_ids: [],
            specific_question_ids: [],
            specific_itilobject: [],
          },
        ],
      },
    });

    const escapedJsonForSql = destConfig.replace(/\\/g, '\\\\').replace(/'/g, "''");
    const existingDestId = runSql(
      `SELECT id FROM glpi_forms_destinations_formdestinations WHERE forms_forms_id = ${formId} ORDER BY id ASC LIMIT 1;`
    ).trim();

    if (existingDestId) {
      runSql(`
        UPDATE glpi_forms_destinations_formdestinations
        SET config = '${escapedJsonForSql}', name = 'Ticket'
        WHERE id = ${existingDestId};
      `);
      runSql(`DELETE FROM glpi_forms_destinations_formdestinations WHERE forms_forms_id = ${formId} AND id <> ${existingDestId};`);
    } else {
      runSql(`
        INSERT INTO glpi_forms_destinations_formdestinations (
          forms_forms_id, itemtype, name, config, creation_strategy, conditions
        ) VALUES (
          ${formId}, 'Glpi\\\\Form\\\\Destination\\\\FormDestinationTicket',
          'Ticket', '${escapedJsonForSql}', '', '[]'
        );
      `);
    }

    // 3.6 Asegurar FormTile
    let tileId = runSql(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = ${formId} ORDER BY id ASC LIMIT 1;`).trim();
    if (!tileId) {
      runSql(`INSERT INTO glpi_helpdesks_tiles_formtiles (forms_forms_id) VALUES (${formId});`);
      tileId = runSql(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = ${formId} ORDER BY id ASC LIMIT 1;`).trim();
    }
    featuredTileIds.push({ formId, tileId: parseInt(tileId, 10), name: cfg.name, itilCategoryId: cfg.itilCategoryId });
    console.log(
      `✓ Formulario inteligente [${formId}] "${cfg.name}" -> Categoría ITIL fija [${cfg.itilCategoryId}] (Tile ${tileId})`
    );
  }

  // 4. Traducir y configurar los 2 formularios generales (IDs 1 y 2) para acceso completo al árbol de 16 categorías
  console.log('\n--- Configurando Formularios Generales en Español (IDs 1 y 2) ---');
  runSql(`
    UPDATE glpi_forms_forms
    SET name = 'Reportar una incidencia general',
        description = 'Reporte cualquier incidente técnico seleccionando la categoría correspondiente del catálogo completo.',
        is_active = 1, is_deleted = 0
    WHERE id = 1;

    UPDATE glpi_forms_forms
    SET name = 'Solicitar un servicio general',
        description = 'Realice una solicitud general seleccionando el servicio requerido dentro de la jerarquía de categorías.',
        is_active = 1, is_deleted = 0
    WHERE id = 2;

    UPDATE glpi_forms_questions SET name = 'Urgencia' WHERE id IN (1, 9);
    UPDATE glpi_forms_questions SET name = 'Categoría del servicio', is_mandatory = 1,
      extra_data = '{"itemtype":"ITILCategory","categories_filter":["request","incident","change","problem"],"root_items_id":0,"subtree_depth":0,"selectable_tree_root":true}'
      WHERE id IN (2, 10);
    UPDATE glpi_forms_questions SET name = 'Dispositivos afectados' WHERE id IN (3, 11);
    UPDATE glpi_forms_questions SET name = 'Observadores' WHERE id IN (4, 12);
    UPDATE glpi_forms_questions SET name = 'Ubicación' WHERE id IN (5, 13);
    UPDATE glpi_forms_questions SET name = 'Asunto', is_mandatory = 1 WHERE id IN (6, 14);
    UPDATE glpi_forms_questions SET name = 'Descripción detallada', is_mandatory = 1 WHERE id IN (7, 15);
    UPDATE glpi_forms_questions SET name = 'Archivos adjuntos' WHERE id IN (8, 16);
  `);

  const dest1 = JSON.stringify({
    'glpi-form-destination-commonitilfield-titlefield': {
      value: answerTag(6, 'Asunto'),
    },
    'glpi-form-destination-commonitilfield-contentfield_auto': false,
    'glpi-form-destination-commonitilfield-contentfield': {
      value: answerTag(7, 'Descripción detallada'),
    },
    'glpi-form-destination-commonitilfield-itilcategoryfield': {
      strategy: 'specific_answer',
      specific_question_id: 2,
      specific_itilcategory_id: null,
    },
    'glpi-form-destination-commonitilfield-requesttypefield': {
      strategy: 'specific_value',
      specific_question_id: null,
      specific_request_type: 1,
    },
    'glpi-form-destination-commonitilfield-urgencyfield': {
      strategy: 'last_valid_answer',
      specific_question_id: null,
      specific_urgency: null,
    },
    'glpi-form-destination-commonitilfield-observerfield': {
      strategies: ['last_valid_answer'],
      specific_itilactors_ids: [],
      specific_question_ids: [],
    },
    'glpi-form-destination-commonitilfield-linkeditilobjectsfield': {
      strategy_configs: [
        {
          strategy: null,
          linktype: '',
          specific_destination_ids: [],
          specific_question_ids: [],
          specific_itilobject: [],
        },
      ],
    },
  })
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");

  const dest2 = JSON.stringify({
    'glpi-form-destination-commonitilfield-titlefield': {
      value: answerTag(14, 'Asunto'),
    },
    'glpi-form-destination-commonitilfield-contentfield_auto': false,
    'glpi-form-destination-commonitilfield-contentfield': {
      value: answerTag(15, 'Descripción detallada'),
    },
    'glpi-form-destination-commonitilfield-itilcategoryfield': {
      strategy: 'specific_answer',
      specific_question_id: 10,
      specific_itilcategory_id: null,
    },
    'glpi-form-destination-commonitilfield-requesttypefield': {
      strategy: 'specific_value',
      specific_question_id: null,
      specific_request_type: 2,
    },
    'glpi-form-destination-commonitilfield-urgencyfield': {
      strategy: 'last_valid_answer',
      specific_question_id: null,
      specific_urgency: null,
    },
    'glpi-form-destination-commonitilfield-observerfield': {
      strategies: ['last_valid_answer'],
      specific_itilactors_ids: [],
      specific_question_ids: [],
    },
    'glpi-form-destination-commonitilfield-linkeditilobjectsfield': {
      strategy_configs: [
        {
          strategy: null,
          linktype: '',
          specific_destination_ids: [],
          specific_question_ids: [],
          specific_itilobject: [],
        },
      ],
    },
  })
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");

  runSql(`
    UPDATE glpi_forms_destinations_formdestinations SET config = '${dest1}' WHERE forms_forms_id = 1;
    UPDATE glpi_forms_destinations_formdestinations SET config = '${dest2}' WHERE forms_forms_id = 2;
  `);

  // 5. Ordenar los mosaicos del Helpdesk (primero las 8 tarjetas destacadas, luego los 2 formularios generales y el catálogo)
  let tile1Id = runSql(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = 1 LIMIT 1;`).trim();
  if (!tile1Id) {
    runSql(`INSERT INTO glpi_helpdesks_tiles_formtiles (forms_forms_id) VALUES (1);`);
    tile1Id = runSql(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = 1 LIMIT 1;`).trim();
  }
  let tile2Id = runSql(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = 2 LIMIT 1;`).trim();
  if (!tile2Id) {
    runSql(`INSERT INTO glpi_helpdesks_tiles_formtiles (forms_forms_id) VALUES (2);`);
    tile2Id = runSql(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = 2 LIMIT 1;`).trim();
  }

  // Desplazar temporalmente el rank de las tarjetas no-FormTile (GlpiPageTile) para evitar colisión en la clave única (itemtype_item, items_id_item, rank)
  runSql(`
    DELETE FROM glpi_helpdesks_tiles_items_tiles
    WHERE itemtype_item = 'Entity' AND items_id_item = 0
      AND itemtype_tile = 'Glpi\\\\Helpdesk\\\\Tile\\\\FormTile';

    UPDATE glpi_helpdesks_tiles_items_tiles
    SET rank = rank + 100
    WHERE itemtype_item = 'Entity' AND items_id_item = 0;
  `);

  let rankCounter = 1;
  for (const ft of featuredTileIds) {
    runSql(`
      INSERT INTO glpi_helpdesks_tiles_items_tiles (itemtype_item, items_id_item, itemtype_tile, items_id_tile, rank)
      VALUES ('Entity', 0, 'Glpi\\\\Helpdesk\\\\Tile\\\\FormTile', ${ft.tileId}, ${rankCounter});
    `);
    rankCounter++;
  }
  for (const genTileId of [tile1Id, tile2Id]) {
    runSql(`
      INSERT INTO glpi_helpdesks_tiles_items_tiles (itemtype_item, items_id_item, itemtype_tile, items_id_tile, rank)
      VALUES ('Entity', 0, 'Glpi\\\\Helpdesk\\\\Tile\\\\FormTile', ${genTileId}, ${rankCounter});
    `);
    rankCounter++;
  }
  // Reordenar consecutivamente las demás tarjetas nativas (GlpiPageTile) después de los formularios
  const pageTilesRaw = runSql(`
    SELECT id FROM glpi_helpdesks_tiles_items_tiles
    WHERE itemtype_item = 'Entity' AND items_id_item = 0
      AND itemtype_tile <> 'Glpi\\\\Helpdesk\\\\Tile\\\\FormTile'
    ORDER BY rank ASC, id ASC;
  `).trim();
  if (pageTilesRaw) {
    for (const ptId of pageTilesRaw.split('\n').map((s) => s.trim()).filter(Boolean)) {
      runSql(`UPDATE glpi_helpdesks_tiles_items_tiles SET rank = ${rankCounter} WHERE id = ${ptId};`);
      rankCounter++;
    }
  }

  console.log('✓ 8 Tarjetas destacadas + 2 Formularios generales ordenados en el portal Helpdesk.');
  console.log('--- Catálogo Visual e Inteligente de GLPI 11 configurado con éxito ---\n');
}

if (require.main === module) {
  try {
    seedVisualForms();
  } catch (err) {
    console.error('Error al configurar formularios visuales:', err.message);
    process.exit(1);
  }
}

module.exports = { seedVisualForms, FORMS_CONFIG };
