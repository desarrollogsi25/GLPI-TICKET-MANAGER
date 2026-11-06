#!/usr/bin/env node
/**
 * P1-02: repairs the destination of the GLPI form "Requerimiento BI" (form 5).
 *
 * Root cause (GLPI log, 2026-11-06): the ITIL category strategy was
 * `specific_answer` pointing at question 42 (a long-text question), so GLPI crashed
 * with "Cannot access offset of type string on string" while creating the ticket.
 * The title/content tags also pointed at stale labels. The fix pins the category
 * to "BI > Requerimiento BI" (routes to group BI) and rebuilds title and content with
 * one labelled paragraph per answer.
 *
 * Idempotent. Needs the `glpi-db` container (uses its MARIADB_USER env). Backs up the
 * previous config next to the script output directory given by BACKUP_DIR (default ./scratch).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const FORM_ID = 5
const CATEGORY_ID = 14 // BI > Requerimiento BI (group BI)
const Q = { title: 23, report: 24, goal: 25, description: 42 }

const run = (query) => execFileSync('docker', ['exec', '-i', 'glpi-db', 'sh', '-lc',
  'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" glpi -N -B'], { input: query, encoding: 'utf8', maxBuffer: 1 << 26 })

const tag = (id, label) => `<span data-form-tag="true" data-form-tag-value="${id}" data-form-tag-provider="Glpi\\Form\\Tag\\AnswerTagProvider" class="border-teal border-start border-3 bg-dark-lt">#Respuesta: ${label}</span>`

const row = run(`SELECT id, HEX(config) FROM glpi_forms_destinations_formdestinations WHERE forms_forms_id = ${FORM_ID};`).trim().split('\t')
if (row.length !== 2) throw new Error(`No destination found for form ${FORM_ID}`)
const [destId, hex] = row
const config = JSON.parse(Buffer.from(hex, 'hex').toString('utf8'))

const dir = process.env.BACKUP_DIR || 'scratch'
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(`${dir}/form5-destination-config.backup.json`, JSON.stringify(config, null, 2))

const p = (label, id, name) => `<p><strong>${label}:</strong> ${tag(id, name)}</p>`
config['glpi-form-destination-commonitilfield-titlefield'] = { value: tag(Q.title, 'Asunto') }
config['glpi-form-destination-commonitilfield-contentfield_auto'] = false
config['glpi-form-destination-commonitilfield-contentfield'] = {
  value: '<p><strong>Servicio solicitado:</strong> Requerimiento BI</p>'
    + p('Informe, tablero o indicador requerido', Q.report, 'Informe, tablero o indicador requerido')
    + p('Objetivo del requerimiento y periodicidad', Q.goal, 'Objetivo del requerimiento y periodicidad')
    + '<hr><p><strong>Descripción y criterios de negocio:</strong></p>'
    + `<p>${tag(Q.description, 'Descripción y criterios de negocio')}</p>`,
}
config['glpi-form-destination-commonitilfield-itilcategoryfield'] = {
  strategy: 'specific_value', specific_question_id: null, specific_itilcategory_id: CATEGORY_ID,
}

const next = Buffer.from(JSON.stringify(config), 'utf8').toString('hex')
run(`UPDATE glpi_forms_destinations_formdestinations SET config = CONVERT(0x${next} USING utf8mb4) WHERE id = ${destId};`)
console.log(`Form ${FORM_ID} destination ${destId} repaired (category ${CATEGORY_ID}).`)
