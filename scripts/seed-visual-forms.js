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

/**
 * Fuente de verdad del enrutamiento: la CATEGORÍA ITIL (glpi_itilcategories.groups_id) determina el
 * grupo técnico. Esta tabla solo describe (informativamente) qué equipo recibirá cada servicio para
 * mostrarlo al solicitante y para que las pruebas verifiquen el resultado persistido. No se asigna
 * aquí ningún actor ni grupo: el formulario NUNCA pregunta por el equipo técnico.
 */
const CATEGORY_GROUP = {
  7: { id: 3, name: 'Service Desk' },
  14: { id: 2, name: 'BI' },
  9: { id: 1, name: 'Desarrollo' },
  19: { id: 3, name: 'Service Desk' },
  16: { id: 3, name: 'Service Desk' },
  4: { id: 1, name: 'Desarrollo' },
  18: { id: 2, name: 'BI' },
  3: { id: 3, name: 'Service Desk' },
};

const FORMS_CONFIG = [
  {
    catId: 1,
    name: 'Requerimiento Service Desk',
    desc: 'Solicitud de requerimientos como fichas del CRM, Accesos de Capacitación, etc.',
    illustration: 'helpdesk',
    itilCategoryId: 7, // Service Desk -> Grupo 3 (Service Desk)
    requestType: 2, // Solicitud
    areaLabel: 'Service Desk',
    questions: [
      { key: 'title', name: 'Asunto', description: 'Resumen claro de tu requerimiento (ej. Alta de ficha CRM para área comercial).', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Sistema o plataforma relacionada', description: 'Indica el nombre del sistema, módulo o plataforma (ej. CRM, Moodle, Correo).', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Usuario o área beneficiaria (opcional)', description: 'Solo si pides esto en nombre de otra persona o área. No elijas ningún equipo técnico: se asigna automáticamente.', type: 'QuestionTypeShortText', mandatory: 0 },
      { key: 'desc', name: 'Descripción detallada del requerimiento', description: 'Detalla qué necesitas, fecha esperada y cualquier dato necesario para atenderlo.', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', description: 'Selecciona la prioridad operativa real; por defecto se asigna Media.', type: 'QuestionTypeUrgency', mandatory: 0, defaultValue: '3' },
      { key: 'file', name: 'Archivo adjunto (opcional)', description: 'Adjunta capturas, documentos o aprobaciones (máx. 20 MB).', type: 'QuestionTypeFile', mandatory: 0 },
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
      { key: 'title', name: 'Asunto', description: 'Resumen claro del tablero, KPI o requerimiento analítico.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Informe, tablero o indicador requerido', description: 'Nombre del reporte existente o nuevo indicador solicitado.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Objetivo del requerimiento y periodicidad', description: 'Frecuencia esperada (diario, semanal, mensual) y decisión de negocio que respalda.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'desc', name: 'Descripción y criterios de negocio', description: 'Detalla filtros, fuentes de datos, periodos y columnas esperadas.', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', description: 'Selecciona la prioridad operativa; por defecto se asigna Media.', type: 'QuestionTypeUrgency', mandatory: 0, defaultValue: '3' },
      { key: 'file', name: 'Archivo o plantilla de referencia (opcional)', description: 'Adjunta ejemplos, planillas Excel o maquetas (máx. 20 MB).', type: 'QuestionTypeFile', mandatory: 0 },
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
      { key: 'title', name: 'Asunto', description: 'Describe brevemente el problema detectado en el aplicativo.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Aplicativo corporativo o módulo afectado', description: 'Ejemplo: Portal GSI, Facturación, Módulo de Clientes.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Mensaje de error o comportamiento observado', description: 'Copia el código o mensaje exacto mostrado en pantalla (si existe).', type: 'QuestionTypeShortText', mandatory: 0 },
      { key: 'desc', name: 'Descripción y pasos para reproducir', description: 'Indica qué acción realizaste, qué esperabas y qué ocurrió realmente.', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', description: 'Indica el impacto operativo real; por defecto se asigna Media.', type: 'QuestionTypeUrgency', mandatory: 0, defaultValue: '3' },
      { key: 'file', name: 'Captura de pantalla o evidencia (opcional)', description: 'Adjunta capturas del error o archivos de respaldo (máx. 20 MB).', type: 'QuestionTypeFile', mandatory: 0 },
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
      { key: 'title', name: 'Asunto', description: 'Resumen del problema (ej. Lector de código de barras sin respuesta).', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Periférico afectado (teclado, mouse, auricular, lector, impresora)', description: 'Indica tipo, marca o modelo si es visible.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Ubicación o puesto de trabajo', description: 'Sede, piso, área o número de estación.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'desc', name: 'Descripción de la falla', description: 'Detalla desde cuándo ocurre y si ya probaste reconectarlo.', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', description: 'Selecciona la prioridad operativa; por defecto se asigna Media.', type: 'QuestionTypeUrgency', mandatory: 0, defaultValue: '3' },
      { key: 'file', name: 'Fotografía o adjunto (opcional)', description: 'Adjunta foto del dispositivo o etiqueta si ayuda al diagnóstico.', type: 'QuestionTypeFile', mandatory: 0 },
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
      { key: 'title', name: 'Asunto', description: 'Resumen del fallo físico (ej. Monitor secundario sin señal de video).', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Equipo afectado (PC, portátil, monitor, fuente)', description: 'Especifica el tipo de equipo y marca si la conoces.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Ubicación o número de inventario', description: 'Etiqueta de activo fijo o ubicación exacta del equipo.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'desc', name: 'Descripción del problema físico', description: 'Indica síntomas (ruidos, reinicios, pantalla negra, daños visibles).', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', description: 'Selecciona la prioridad operativa; por defecto se asigna Media.', type: 'QuestionTypeUrgency', mandatory: 0, defaultValue: '3' },
      { key: 'file', name: 'Archivo o fotografía (opcional)', description: 'Adjunta foto del equipo o pantalla de error (máx. 20 MB).', type: 'QuestionTypeFile', mandatory: 0 },
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
      { key: 'title', name: 'Asunto', description: 'Resumen breve del incidente de software.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Aplicación o programa afectado', description: 'Ejemplo: Microsoft Excel, Outlook, VPN, navegador o Windows.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Mensaje o código de error', description: 'Texto o código exacto si el sistema mostró un aviso.', type: 'QuestionTypeShortText', mandatory: 0 },
      { key: 'desc', name: 'Descripción del incidente', description: 'Explica qué estabas haciendo cuando falló y si impide continuar trabajando.', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', description: 'Selecciona la prioridad operativa; por defecto se asigna Media.', type: 'QuestionTypeUrgency', mandatory: 0, defaultValue: '3' },
      { key: 'file', name: 'Captura de pantalla (opcional)', description: 'Adjunta captura del aviso o log (máx. 20 MB).', type: 'QuestionTypeFile', mandatory: 0 },
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
      { key: 'title', name: 'Asunto', description: 'Resumen de la inconsistencia detectada en el informe.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Nombre del informe, reporte o planilla afectada', description: 'Indica el nombre exacto o enlace del reporte.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Periodo o filtro consultado', description: 'Rango de fechas, sucursal o filtros aplicados al generar el dato.', type: 'QuestionTypeShortText', mandatory: 0 },
      { key: 'desc', name: 'Descripción de la inconsistencia o error en los datos', description: 'Indica el valor observado vs. el valor esperado para agilizar la revisión.', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', description: 'Selecciona la prioridad operativa; por defecto se asigna Media.', type: 'QuestionTypeUrgency', mandatory: 0, defaultValue: '3' },
      { key: 'file', name: 'Planilla o captura de evidencia (opcional)', description: 'Adjunta la planilla exportada o captura comparativa (máx. 20 MB).', type: 'QuestionTypeFile', mandatory: 0 },
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
      { key: 'title', name: 'Asunto', description: 'Resumen de la solicitud (ej. Alta de acceso a CRM para nuevo analista).', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context1', name: 'Sistema o recurso al que solicita acceso', description: 'Nombre del aplicativo, carpeta compartida o plataforma corporativa.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'context2', name: 'Perfil, rol o nivel de permisos requerido', description: 'Ejemplo: Solo lectura, Editor, Supervisor o usuario modelo de referencia.', type: 'QuestionTypeShortText', mandatory: 1 },
      { key: 'desc', name: 'Motivo y persona que recibirá el acceso', description: 'Indica nombre completo y correo corporativo de quien usará el acceso, y la justificación. El equipo técnico se asigna automáticamente.', type: 'QuestionTypeLongText', mandatory: 1 },
      { key: 'urgency', name: 'Urgencia', description: 'Selecciona la prioridad operativa; por defecto se asigna Media.', type: 'QuestionTypeUrgency', mandatory: 0, defaultValue: '3' },
      { key: 'file', name: 'Autorización o documento adjunto (opcional)', description: 'Adjunta aprobación del líder de área si aplica (máx. 20 MB).', type: 'QuestionTypeFile', mandatory: 0 },
    ],
  },
];

function ensureQuestion(sectionId, sectionUuid, rank, qDef) {
  const escapedName = escapeSql(qDef.name);
  const fullType = `Glpi\\\\Form\\\\QuestionType\\\\${qDef.type}`;
  const extraDataSql = qDef.extraData ? `'${escapeSql(JSON.stringify(qDef.extraData))}'` : 'NULL';
  const descSql = qDef.description ? `'${escapeSql(`<p>${qDef.description}</p>`)}'` : 'NULL';
  const defaultValSql =
    qDef.defaultValue != null
      ? `'${escapeSql(String(qDef.defaultValue))}'`
      : qDef.type === 'QuestionTypeUrgency'
        ? `'3'`
        : 'NULL';

  let qId = runSql(
    `SELECT id FROM glpi_forms_questions WHERE forms_sections_id = ${sectionId} AND vertical_rank = ${rank} LIMIT 1;`
  ).trim();

  if (qId) {
    runSql(`
      UPDATE glpi_forms_questions
      SET
        name = '${escapedName}',
        description = ${descSql},
        default_value = ${defaultValSql},
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
        uuid, forms_sections_id, forms_sections_uuid, name, description, default_value, type,
        is_mandatory, vertical_rank, conditions, validation_conditions, extra_data
      ) VALUES (
        '${qUuid}', ${sectionId}, '${sectionUuid}', '${escapedName}', ${descSql}, ${defaultValSql},
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
    const headerHtml = escapeSql(
      `<p><strong>Guía rápida:</strong> ${cfg.desc} Los campos marcados con <strong>*</strong> son obligatorios. Al enviar, tu solicitud se asigna automáticamente al equipo <strong>${CATEGORY_GROUP[cfg.itilCategoryId].name}</strong>; no necesitas elegir equipo ni categoría. Recibirás el número de tu ticket y podrás seguir su avance en GSI Service Desk (Mis tickets).</p>`
    );

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
          header = '${headerHtml}',
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
          render_layout, name, header, illustration, description, forms_categories_id,
          usage_count, submit_button_visibility_strategy, submit_button_conditions,
          date_creation, date_mod
        ) VALUES (
          '${formUuid}', 0, 1, 1, 0, 0,
          '', '${escapedName}', '${headerHtml}', '${escapedIll}', '${escapedDesc}', ${cfg.catId},
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
        header = '<p><strong>Guía rápida:</strong> Usa este formulario si tu problema no corresponde a ninguno de los 8 servicios destacados. Selecciona la categoría ITIL exacta para derivar automáticamente al equipo técnico correcto.</p>',
        description = 'Reporte cualquier incidente técnico seleccionando la categoría correspondiente del catálogo completo.',
        is_active = 1, is_deleted = 0
    WHERE id = 1;

    UPDATE glpi_forms_forms
    SET name = 'Solicitar un servicio general',
        header = '<p><strong>Guía rápida:</strong> Usa este formulario para solicitudes generales fuera de los servicios destacados. Los campos marcados con <strong>*</strong> son obligatorios.</p>',
        description = 'Realice una solicitud general seleccionando el servicio requerido dentro de la jerarquía de categorías.',
        is_active = 1, is_deleted = 0
    WHERE id = 2;

    UPDATE glpi_forms_questions SET name = 'Urgencia', default_value = '3', description = '<p>Prioridad operativa del ticket (Media por defecto).</p>' WHERE id IN (1, 9);
    UPDATE glpi_forms_questions SET name = 'Categoría del servicio', is_mandatory = 1,
      description = '<p>Selecciona la categoría ITIL más específica para enrutar tu ticket al área correcta.</p>',
      extra_data = '{"itemtype":"ITILCategory","categories_filter":["request","incident","change","problem"],"root_items_id":0,"subtree_depth":0,"selectable_tree_root":true}'
      WHERE id IN (2, 10);
    UPDATE glpi_forms_questions SET name = 'Dispositivos afectados' WHERE id IN (3, 11);
    UPDATE glpi_forms_questions SET name = 'Observadores' WHERE id IN (4, 12);
    UPDATE glpi_forms_questions SET name = 'Ubicación' WHERE id IN (5, 13);
    UPDATE glpi_forms_questions SET name = 'Asunto', is_mandatory = 1, description = '<p>Resumen claro y conciso de tu solicitud o incidente.</p>' WHERE id IN (6, 14);
    UPDATE glpi_forms_questions SET name = 'Descripción detallada', is_mandatory = 1, description = '<p>Incluye contexto, pasos para reproducir o datos necesarios para atenderlo.</p>' WHERE id IN (7, 15);
    UPDATE glpi_forms_questions SET name = 'Archivos adjuntos', description = '<p>Opcional: capturas de pantalla, planillas o respaldos.</p>' WHERE id IN (8, 16);
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

  // 4b. Enrutamiento: UNA fuente de verdad (categoría ITIL -> grupo). Las reglas H38 duplicaban esa tabla.
  runSql(`
    UPDATE glpi_entities SET auto_assign_mode = 2 WHERE id = 0;
    UPDATE glpi_rules SET is_active = 0 WHERE sub_type = 'RuleTicket' AND name LIKE 'H38 Route%';
  `);
  console.log('✓ Enrutamiento por categoría (auto_assign_mode=2) activo; reglas H38 duplicadas desactivadas.');

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

module.exports = { seedVisualForms, FORMS_CONFIG, CATEGORY_GROUP };
