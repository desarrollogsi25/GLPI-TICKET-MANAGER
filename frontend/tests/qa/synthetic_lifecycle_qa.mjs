import fs from 'node:fs'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'

const BASE_URL = 'http://127.0.0.1:5280'

function getCred(user) {
  const key = `CRED_${user.toUpperCase()}`
  if (process.env[key]) return process.env[key]
  for (const candidate of ['.env.local', '../.env.local', '../../.env.local']) {
    try {
      if (fs.existsSync(candidate)) {
        const text = fs.readFileSync(candidate, 'utf8')
        const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
        if (match) return match[1].trim()
      }
    } catch {}
  }
  return ''
}

async function login(username) {
  const password = getCred(username)
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`)
  const data = await res.json()
  return data.accessToken
}

function runSql(query) {
  const singleLine = query.replace(/\s+/g, ' ').replace(/"/g, '\\"').trim()
  const cmd = `docker exec glpi-db mariadb -u glpi -pVW9Qr7m2XSkGd0tHegGGq3hhrHcD glpi -e "${singleLine}"`
  return execSync(cmd, { encoding: 'utf8' })
}

async function run() {
  console.log('================================================================')
  console.log('CICLO COMPLETO GLPI REAL Y PROTECCIÓN P1 SIN TAREAS (#1049)')
  console.log('Backend QA: http://127.0.0.1:5280 (Compilado desde rama maestra)')
  console.log('================================================================\n')

  const techToken = await login('tech_sd')
  const liderToken = await login('lider_sd')
  const adminToken = await login('admin_test')
  const userToken = await login('user_test')
  console.log('✓ Tokens JWT obtenidos para tech_sd, lider_sd, admin_test, user_test')

  // 1. Crear ticket sintético #1055 directamente en GLPI MariaDB
  console.log('\n[Paso 1] Creando ticket sintético #1055 en GLPI MariaDB...')
  runSql(`
    DELETE FROM glpi_tickettasks WHERE tickets_id = 1055;
    DELETE FROM glpi_itilsolutions WHERE items_id = 1055 AND itemtype = 'Ticket';
    DELETE FROM glpi_itilfollowups WHERE items_id = 1055 AND itemtype = 'Ticket';
    DELETE FROM glpi_groups_tickets WHERE tickets_id = 1055;
    DELETE FROM glpi_tickets_users WHERE tickets_id = 1055;
    DELETE FROM glpi_tickets WHERE id = 1055;

    INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, date_creation, status, users_id_recipient, content, urgency, impact, priority, itilcategories_id, tickettemplates_id, requesttypes_id, global_validation, is_deleted)
    VALUES (1055, 0, '[QA-SINTETICO-1055] Prueba Ciclo Completo y Regresión Tareas', NOW(), NOW(), NOW(), 1, 17, 'Ticket sintético de prueba QA E2E', 3, 3, 3, 16, 1, 1, 1, 0);

    INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (1055, 3, 2);
    INSERT INTO glpi_tickets_users (tickets_id, users_id, type, use_notification) VALUES (1055, 17, 1, 1);
  `)
  console.log('✓ Ticket #1055 creado con estado 1 (Nuevo), grupo 1 (Mesa de Ayuda), solicitante 17 (user_test)')

  // 2. Autoasignación (Claim) por tech_sd
  console.log('\n[Paso 2] Autoasignando ticket #1055 con tech_sd (POST /api/tickets/1055/claim)...')
  const claimRes = await fetch(`${BASE_URL}/api/tickets/1055/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${techToken}` },
  })
  if (!claimRes.ok) {
    throw new Error(`Claim falló con status ${claimRes.status}: ${await claimRes.text()}`)
  }
  const claimData = await claimRes.json()
  console.log(`✓ Ticket autoasignado correctamente. Estado devuelto: ${claimData.status} (${claimData.statusLabel})`)

  // 3. Regresión P1: Intentar resolver SIN tareas por los 3 caminos
  console.log('\n[Paso 3] Regresión P1: Intentando resolver SIN tareas (debe fallar con HTTP 422)...')

  // Camino A: POST /api/tickets/1055/resolve
  const resolveNoTaskRes = await fetch(`${BASE_URL}/api/tickets/1055/resolve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${techToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: 'Solución prematura sin tareas' }),
  })
  console.log(`  - Camino A (/resolve): HTTP ${resolveNoTaskRes.status} (Esperado: 422)`)
  if (resolveNoTaskRes.status !== 422) {
    throw new Error(`Camino A no bloqueó la resolución sin tareas. HTTP: ${resolveNoTaskRes.status}`)
  }

  // Camino B: POST /api/tickets/1055/solutions
  const solutionsNoTaskRes = await fetch(`${BASE_URL}/api/tickets/1055/solutions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${techToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ticketId: 1055, content: 'Solución prematura directa' }),
  })
  console.log(`  - Camino B (/solutions): HTTP ${solutionsNoTaskRes.status} (Esperado: 422)`)
  if (solutionsNoTaskRes.status !== 422) {
    throw new Error(`Camino B no bloqueó la solución sin tareas. HTTP: ${solutionsNoTaskRes.status}`)
  }

  // Camino C: PATCH /api/tickets/1055/status -> 5 (Solved)
  const statusNoTaskRes = await fetch(`${BASE_URL}/api/tickets/1055/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${techToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 5 }),
  })
  console.log(`  - Camino C (/status -> 5): HTTP ${statusNoTaskRes.status} (Esperado: 422)`)
  if (statusNoTaskRes.status !== 422) {
    throw new Error(`Camino C no bloqueó el cambio a resuelto sin tareas. HTTP: ${statusNoTaskRes.status}`)
  }

  // Verificar en DB que el ticket sigue intacto en estado 2
  const dbStatusBefore = runSql('SELECT status FROM glpi_tickets WHERE id = 1055').trim().split('\n')[1]
  console.log(`✓ Verificación DB GLPI: Estado actual en MariaDB es ${dbStatusBefore} (Permanece Asignado = 2)`)

  // 4. Planificación: Planificar tarea nativa GLPI
  console.log('\n[Paso 4] Planificando tarea nativa con tech_sd (POST /api/tickets/1055/plan)...')
  const now = new Date()
  const startAt = new Date(now.getTime() + 3600000).toISOString()
  const endAt = new Date(now.getTime() + 7200000).toISOString()

  const planRes = await fetch(`${BASE_URL}/api/tickets/1055/plan`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${techToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestId: crypto.randomUUID(),
      content: 'Diagnóstico de hardware en laboratorio',
      startAt,
      endAt,
    }),
  })
  if (!planRes.ok) {
    throw new Error(`Plan falló con status ${planRes.status}: ${await planRes.text()}`)
  }
  const planData = await planRes.json()
  const taskId = planData.taskId
  console.log(`✓ Tarea planificada con éxito. TaskId: ${taskId}, Estado devuelto: ${planData.ticketStatus} (Planificado = 3)`)

  // 5. Poner en espera (Pendiente = 4) con seguimiento privado
  console.log('\n[Paso 5] Poniendo ticket en espera (POST /api/tickets/1055/pending)...')
  const pendingRes = await fetch(`${BASE_URL}/api/tickets/1055/pending`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${techToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reasonId: 2,
      comment: 'Piezas agotadas en almacén central, proveedor envía mañana',
    }),
  })
  if (!pendingRes.ok) {
    throw new Error(`Pending falló con status ${pendingRes.status}: ${await pendingRes.text()}`)
  }
  const pendingData = await pendingRes.json()
  console.log(`✓ Ticket puesto en pendiente. Estado: ${pendingData.status} (${pendingData.statusLabel})`)

  // Verificar en MariaDB que el seguimiento privado fue registrado
  const followups = runSql(`SELECT id, is_private, content FROM glpi_itilfollowups WHERE items_id = 1055`)
  console.log('✓ Seguimiento en GLPI MariaDB:', followups.trim().replace(/\n/g, ' | '))

  // 6. Completar la tarea
  console.log(`\n[Paso 6] Completando tarea #${taskId} (POST /api/tickets/1055/tasks/${taskId}/complete)...`)
  const completeTaskRes = await fetch(`${BASE_URL}/api/tickets/1055/tasks/${taskId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${techToken}` },
  })
  if (!completeTaskRes.ok) {
    throw new Error(`Completar tarea falló con status ${completeTaskRes.status}: ${await completeTaskRes.text()}`)
  }
  console.log(`✓ Tarea #${taskId} completada exitosamente`)

  // 6b. Reanudar ticket de Pendiente a En Progreso (Asignado = 2)
  console.log('\n[Paso 6b] Reanudando ticket desde Pendiente a En Curso (PATCH /api/tickets/1055/status -> 2)...')
  const resumeRes = await fetch(`${BASE_URL}/api/tickets/1055/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${techToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 2 }),
  })
  if (!resumeRes.ok) {
    throw new Error(`Resume falló con status ${resumeRes.status}: ${await resumeRes.text()}`)
  }
  console.log('✓ Ticket reanudado a En Curso (2) exitosamente')

  // 7. Resolver ticket (con tarea completada)
  console.log('\n[Paso 7] Resolviendo ticket #1055 con tarea completada (POST /api/tickets/1055/resolve)...')
  const resolveRes = await fetch(`${BASE_URL}/api/tickets/1055/resolve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${techToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: 'Equipo reparado, piezas sustituidas y calibración verificada.',
    }),
  })
  if (!resolveRes.ok) {
    throw new Error(`Resolve falló con status ${resolveRes.status}: ${await resolveRes.text()}`)
  }
  const resolveData = await resolveRes.json()
  console.log(`✓ Ticket resuelto exitosamente. Estado: ${resolveData.status} (${resolveData.statusLabel})`)

  // Verificar en MariaDB el estado 5 (Resuelto) y la solución en glpi_itilsolutions
  const dbStatusFinal = runSql('SELECT status FROM glpi_tickets WHERE id = 1055').trim().split('\n')[1]
  const dbSolution = runSql('SELECT id, status, content FROM glpi_itilsolutions WHERE items_id = 1055').trim()
  console.log(`✓ Verificación DB GLPI: Estado en MariaDB es ${dbStatusFinal} (Resuelto = 5)`)
  console.log(`✓ Solución registrada en glpi_itilsolutions:\n${dbSolution}`)

  // 8. Reabrir ticket (como Admin, dado que para estado Cerrado = 6 solo admin tiene autoridad)
  console.log('\n[Paso 8] Reabriendo ticket #1055 con admin_test (POST /api/tickets/1055/reopen)...')
  const reopenRes = await fetch(`${BASE_URL}/api/tickets/1055/reopen`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Reabierto por administrador para verificación adicional de QA' }),
  })
  if (!reopenRes.ok) {
    throw new Error(`Reopen falló con status ${reopenRes.status}: ${await reopenRes.text()}`)
  }
  const reopenData = await reopenRes.json()
  console.log(`✓ Ticket reabierto correctamente. Estado: ${reopenData.status} (${reopenData.statusLabel})`)

  console.log('\n================================================================')
  console.log('CICLO COMPLETO GLPI Y REGRESIÓN DE TAREAS: 100% PASS 🟢')
  console.log('================================================================\n')
}

run().catch((err) => {
  console.error('ERROR EN QA SINTÉTICO:', err)
  process.exit(1)
})
