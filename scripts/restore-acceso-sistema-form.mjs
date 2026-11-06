#!/usr/bin/env node
/**
 * Restaura de forma idempotente el formulario destacado «Acceso a sistema» del
 * catálogo de servicios de GLPI 11.
 *
 * Contexto: en la instancia persistente existían las 8 categorías visuales y 7 de
 * los 8 formularios destacados; la categoría 8 («Acceso a sistema») se había
 * quedado sin formulario ni tarjeta. Este script sólo toca esa categoría y su
 * formulario: no reejecuta el seed completo ni modifica los otros formularios.
 *
 * Uso (autorizado, una sola vez sobre la instancia local):
 *   node scripts/restore-acceso-sistema-form.mjs
 *
 * Requiere que el contenedor `glpi-db` esté en marcha y exponga MARIADB_USER /
 * MARIADB_PASSWORD en su entorno. Es idempotente: se puede ejecutar de nuevo para
 * reparar el formulario sin duplicarlo.
 */

import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'

const ANSWER_TAG_PROVIDER = 'Glpi\\Form\\Tag\\AnswerTagProvider'
const ITIL_CATEGORY_ID = 3 // Requerimiento > Acceso a sistema -> Grupo 3 (Service Desk)
const CATEGORY_ID = 8
const FORM_NAME = 'Acceso a sistema'
const FORM_DESCRIPTION =
  'Solicitud de altas de usuario, permisos, credenciales y accesos a sistemas corporativos.'

function runSql(sql) {
  execFileSync(
    'docker',
    ['exec', '-i', 'glpi-db', 'sh', '-lc', 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" glpi'],
    { input: `SET NAMES utf8mb4;\n${sql}`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] },
  )
}

function query(sql) {
  return execFileSync(
    'docker',
    ['exec', '-i', 'glpi-db', 'sh', '-lc', 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" glpi -N -B'],
    { input: `SET NAMES utf8mb4;\n${sql}`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  ).trim()
}

const escapeSql = (value) => String(value ?? '').replace(/'/g, "''")
const escapeJson = (value) => JSON.stringify(value).replace(/\\/g, '\\\\').replace(/'/g, "''")
const answerTag = (questionId, label) =>
  `<span data-form-tag="true" data-form-tag-value="${questionId}" data-form-tag-provider="${ANSWER_TAG_PROVIDER}" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: ${label}</span>`

const QUESTIONS = [
  { key: 'title', name: 'Asunto', type: 'QuestionTypeShortText', mandatory: 1 },
  { key: 'context1', name: 'Sistema o recurso al que solicita acceso', type: 'QuestionTypeShortText', mandatory: 1 },
  { key: 'context2', name: 'Perfil, rol o nivel de permisos requerido', type: 'QuestionTypeShortText', mandatory: 1 },
  { key: 'desc', name: 'Motivo de la solicitud y usuario destinatario', type: 'QuestionTypeLongText', mandatory: 1 },
  { key: 'urgency', name: 'Urgencia', type: 'QuestionTypeUrgency', mandatory: 0 },
  { key: 'file', name: 'Autorización o documento adjunto (opcional)', type: 'QuestionTypeFile', mandatory: 0 },
]

function ensureQuestion(sectionId, sectionUuid, rank, question) {
  const fullType = `Glpi\\\\Form\\\\QuestionType\\\\${question.type}`
  const existing = query(
    `SELECT id FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND vertical_rank = ${rank} LIMIT 1;`,
  )
  if (existing) {
    runSql(`
      UPDATE glpi_forms_questions
      SET name = '${escapeSql(question.name)}', type = '${fullType}',
          is_mandatory = ${question.mandatory}, conditions = '[]', validation_conditions = '[]'
      WHERE id = ${existing};
    `)
    return Number(existing)
  }
  const uuid = crypto.randomUUID()
  runSql(`
    INSERT INTO glpi_forms_questions (
      uuid, forms_sections_id, forms_sections_uuid, name, type,
      is_mandatory, vertical_rank, conditions, validation_conditions
    ) VALUES (
      '${uuid}', ${sectionId}, '${sectionUuid}', '${escapeSql(question.name)}',
      '${fullType}', ${question.mandatory}, ${rank}, '[]', '[]'
    );
  `)
  return Number(query(`SELECT id FROM glpi_forms_questions WHERE uuid = '${uuid}' LIMIT 1;`))
}

function main() {
  console.log('--- Restaurando formulario «Acceso a sistema» ---')

  runSql(`
    INSERT INTO glpi_forms_categories (id, name, description, illustration, forms_categories_id, completename, level, comment)
    VALUES (${CATEGORY_ID}, '${FORM_NAME}', '${escapeSql(FORM_DESCRIPTION)}', 'request-service', 0, '${FORM_NAME}', 1, '${escapeSql(FORM_DESCRIPTION)}')
    ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
      illustration = VALUES(illustration), forms_categories_id = 0, completename = VALUES(completename),
      level = 1, comment = VALUES(comment);
  `)

  let formId = query(
    `SELECT id FROM glpi_forms_forms WHERE forms_categories_id = ${CATEGORY_ID} OR name = '${FORM_NAME}' ORDER BY id ASC LIMIT 1;`,
  )
  if (formId) {
    runSql(`
      UPDATE glpi_forms_forms SET
        name = '${FORM_NAME}', description = '${escapeSql(FORM_DESCRIPTION)}', illustration = 'request-service',
        forms_categories_id = ${CATEGORY_ID}, is_active = 1, is_deleted = 0, is_draft = 0,
        entities_id = 0, is_recursive = 1, date_mod = NOW()
      WHERE id = ${formId};
    `)
  } else {
    const uuid = crypto.randomUUID()
    runSql(`
      INSERT INTO glpi_forms_forms (
        uuid, entities_id, is_recursive, is_active, is_deleted, is_draft,
        render_layout, name, illustration, description, forms_categories_id,
        usage_count, submit_button_visibility_strategy, submit_button_conditions, date_creation, date_mod
      ) VALUES (
        '${uuid}', 0, 1, 1, 0, 0, '', '${FORM_NAME}', 'request-service', '${escapeSql(FORM_DESCRIPTION)}',
        ${CATEGORY_ID}, 0, '', '[]', NOW(), NOW()
      );
    `)
    formId = Number(query(`SELECT id FROM glpi_forms_forms WHERE uuid = '${uuid}' LIMIT 1;`))
  }
  formId = Number(formId)
  console.log(`Formulario id=${formId}`)

  // Acceso: todos los usuarios autenticados.
  const accessControl = query(
    `SELECT id FROM glpi_forms_accesscontrols_formaccesscontrols WHERE forms_forms_id = ${formId} LIMIT 1;`,
  )
  if (accessControl) {
    runSql(`
      UPDATE glpi_forms_accesscontrols_formaccesscontrols
      SET strategy = 'Glpi\\\\Form\\\\AccessControl\\\\ControlType\\\\AllowList',
          config = '{"user_ids":["all"],"group_ids":[],"profile_ids":[]}', is_active = 1
      WHERE id = ${accessControl};
    `)
  } else {
    runSql(`
      INSERT INTO glpi_forms_accesscontrols_formaccesscontrols (forms_forms_id, strategy, config, is_active)
      VALUES (${formId}, 'Glpi\\\\Form\\\\AccessControl\\\\ControlType\\\\AllowList',
        '{"user_ids":["all"],"group_ids":[],"profile_ids":[]}', 1);
    `)
  }

  // Sección única.
  let sectionId = query(
    `SELECT id FROM glpi_forms_sections WHERE forms_forms_id = ${formId} ORDER BY id ASC LIMIT 1;`,
  )
  let sectionUuid
  if (sectionId) {
    sectionUuid = query(`SELECT uuid FROM glpi_forms_sections WHERE id = ${sectionId} LIMIT 1;`)
    runSql(`UPDATE glpi_forms_sections SET name = 'Detalles de la solicitud', rank = 0 WHERE id = ${sectionId};`)
  } else {
    sectionUuid = crypto.randomUUID()
    runSql(`
      INSERT INTO glpi_forms_sections (uuid, forms_forms_id, name, rank, conditions)
      VALUES ('${sectionUuid}', ${formId}, 'Detalles de la solicitud', 0, '[]');
    `)
    sectionId = query(`SELECT id FROM glpi_forms_sections WHERE uuid = '${sectionUuid}' LIMIT 1;`)
  }

  // Preguntas.
  const ids = {}
  const names = {}
  QUESTIONS.forEach((question, rank) => {
    ids[question.key] = ensureQuestion(Number(sectionId), sectionUuid, rank, question)
    names[question.key] = question.name
  })
  runSql(
    `DELETE FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND vertical_rank >= ${QUESTIONS.length};`,
  )

  // Destino: ticket con categoría ITIL fija (3 = Acceso a sistema -> Service Desk).
  const contentHtml = [
    `<p><strong>Servicio solicitado:</strong> ${FORM_NAME}</p>`,
    `<p><strong>${names.context1}:</strong> ${answerTag(ids.context1, names.context1)}</p>`,
    `<p><strong>${names.context2}:</strong> ${answerTag(ids.context2, names.context2)}</p>`,
    `<hr><p><strong>${names.desc}:</strong></p>`,
    `<p>${answerTag(ids.desc, names.desc)}</p>`,
  ].join('')

  const destinationConfig = escapeJson({
    'glpi-form-destination-commonitilfield-titlefield': { value: answerTag(ids.title, names.title) },
    'glpi-form-destination-commonitilfield-contentfield_auto': false,
    'glpi-form-destination-commonitilfield-contentfield': { value: contentHtml },
    'glpi-form-destination-commonitilfield-itilcategoryfield': {
      strategy: 'specific_value',
      specific_question_id: null,
      specific_itilcategory_id: ITIL_CATEGORY_ID,
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

  const destinationId = query(
    `SELECT id FROM glpi_forms_destinations_formdestinations WHERE forms_forms_id = ${formId} ORDER BY id ASC LIMIT 1;`,
  )
  if (destinationId) {
    runSql(`
      UPDATE glpi_forms_destinations_formdestinations
      SET config = '${destinationConfig}', name = 'Solicitud'
      WHERE id = ${destinationId};
    `)
    runSql(
      `DELETE FROM glpi_forms_destinations_formdestinations WHERE forms_forms_id = ${formId} AND id <> ${destinationId};`,
    )
  } else {
    runSql(`
      INSERT INTO glpi_forms_destinations_formdestinations (
        forms_forms_id, itemtype, name, config, creation_strategy, conditions
      ) VALUES (
        ${formId}, 'Glpi\\\\Form\\\\Destination\\\\FormDestinationTicket',
        'Solicitud', '${destinationConfig}', '', '[]'
      );
    `)
  }

  // Tarjeta destacada en el catálogo.
  let tile = query(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = ${formId} LIMIT 1;`)
  if (!tile) {
    runSql(`INSERT INTO glpi_helpdesks_tiles_formtiles (forms_forms_id) VALUES (${formId});`)
    tile = query(`SELECT id FROM glpi_helpdesks_tiles_formtiles WHERE forms_forms_id = ${formId} LIMIT 1;`)
  }
  tile = Number(tile)

  // GLPI 11 no lee la tabla de tiles directamente: el catálogo se arma con la
  // tabla de unión `glpi_helpdesks_tiles_items_tiles` (itemtype_item = Entity,
  // items_id_item = 0). Sin esta fila el formulario existe pero no se muestra.
  const linked = query(
    `SELECT id FROM glpi_helpdesks_tiles_items_tiles
     WHERE itemtype_item = 'Entity' AND items_id_item = 0
       AND itemtype_tile = 'Glpi\\\\Helpdesk\\\\Tile\\\\FormTile'
       AND items_id_tile = ${tile} LIMIT 1;`,
  )
  if (!linked) {
    const nextRank = Number(
      query(
        `SELECT COALESCE(MAX(rank), 0) + 1 FROM glpi_helpdesks_tiles_items_tiles
         WHERE itemtype_item = 'Entity' AND items_id_item = 0;`,
      ) || 1,
    )
    runSql(`
      INSERT INTO glpi_helpdesks_tiles_items_tiles
        (itemtype_item, items_id_item, itemtype_tile, items_id_tile, rank)
      VALUES ('Entity', 0, 'Glpi\\\\Helpdesk\\\\Tile\\\\FormTile', ${tile}, ${nextRank});
    `)
  }

  runSql(`UPDATE glpi_entities SET enable_helpdesk_service_catalog = 1, expand_service_catalog = 1 WHERE id = 0;`)

  const questions = query(
    `SELECT vertical_rank, name, is_mandatory FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} ORDER BY vertical_rank;`,
  )
  console.log('Preguntas:')
  console.log(questions)
  console.log('OK: formulario «Acceso a sistema» listo (categoría ITIL 3, grupo Service Desk).')
}

main()
