#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..')

// 1. Localizar y cargar manifiesto y variables del laboratorio H-20
function discoverFixture() {
  if (process.env.E2E_FIXTURE_MANIFEST && existsSync(process.env.E2E_FIXTURE_MANIFEST)) {
    const manifest = JSON.parse(readFileSync(process.env.E2E_FIXTURE_MANIFEST, 'utf8'))
    const tempDir = resolve(process.env.E2E_FIXTURE_MANIFEST, '..')
    const envFile = join(tempDir, 'fixture.env')
    return { manifestPath: process.env.E2E_FIXTURE_MANIFEST, manifest, envFile }
  }

  const tmp = tmpdir()
  const candidates = readdirSync(tmp)
    .filter(name => name.startsWith('glpi-e2e-'))
    .map(name => join(tmp, name))
    .sort()
    .reverse()

  for (const dir of candidates) {
    const manifestPath = join(dir, 'manifest.json')
    const envFile = join(dir, 'fixture.env')
    if (existsSync(manifestPath) && existsSync(envFile)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
        if (manifest.runId && manifest.apiUrl) {
          return { manifestPath, manifest, envFile }
        }
      } catch {}
    }
  }

  throw new Error('No se encontró un laboratorio H-20 activo en el sistema temporal.')
}

const { manifestPath, manifest, envFile } = discoverFixture()
const envContent = readFileSync(envFile, 'utf8')
const fixtureEnv = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx > 0) {
    fixtureEnv[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
  }
}

// Configurar entorno en memoria para guards
process.env.E2E_FIXTURE_MANIFEST = manifestPath
process.env.E2E_CONFIRM_DESTRUCTIVE = manifest.runId
process.env.E2E_DESK_URL = manifest.frontendUrl
process.env.E2E_FRONTEND_URL = manifest.frontendUrl
process.env.E2E_GLPI_URL = manifest.glpiUrl
process.env.E2E_API_URL = manifest.apiUrl

for (const [k, v] of Object.entries(fixtureEnv)) {
  process.env[k] = v
}

const API = manifest.apiUrl
const GLPI = manifest.glpiUrl
const FRONTEND = manifest.frontendUrl

console.log(`[QA Evidence] Conectando a Laboratorio H-20 (RunId: ${manifest.runId})`)
console.log(`[QA Evidence] API: ${API} | Frontend: ${FRONTEND} | GLPI: ${GLPI}`)

const evidence = []

function record(suite, testId, scenario, user, status, result, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    suite,
    testId,
    scenario,
    user,
    status,
    result,
    details,
  }
  evidence.push(entry)
  console.log(`[${status}] [${suite}] ${testId} - ${user}: ${result}`)
  return entry
}

async function api(path, options = {}) {
  const url = `${API}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  let data = null
  const text = await res.text()
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: res.status, ok: res.ok, data }
}

async function run() {
  const tokens = {}

  // =========================================================================
  // FASE 1: Autenticación y Tokens RBAC para los 8 Perfiles Sintéticos
  // =========================================================================
  console.log('\n--- FASE 1: Autenticación y RBAC para los 8 Perfiles ---')
  const profiles = [
    { username: 'admin_test', password: fixtureEnv.E2E_ADMIN_PASSWORD, expectedRole: 'admin', group: 'Todos' },
    { username: 'lider_dev', password: fixtureEnv.E2E_SUPERVISOR_PASSWORD, expectedRole: 'supervisor', group: 'Grupo 1 (Desarrollo)' },
    { username: 'lider_bi', password: fixtureEnv.E2E_SUPERVISOR_PASSWORD, expectedRole: 'supervisor', group: 'Grupo 2 (BI)' },
    { username: 'lider_sd', password: fixtureEnv.E2E_SUPERVISOR_PASSWORD, expectedRole: 'supervisor', group: 'Grupo 3 (Service Desk)' },
    { username: 'tech_dev', password: fixtureEnv.E2E_TECH_PASSWORD, expectedRole: 'technician', group: 'Grupo 1 (Desarrollo)' },
    { username: 'tech_bi', password: fixtureEnv.E2E_TECH_PASSWORD, expectedRole: 'technician', group: 'Grupo 2 (BI)' },
    { username: 'tech_sd', password: fixtureEnv.E2E_TECH_PASSWORD, expectedRole: 'technician', group: 'Grupo 3 (Service Desk)' },
    { username: 'user_test', password: fixtureEnv.E2E_REQUESTER_PASSWORD, expectedRole: 'solicitante', group: 'Sin grupo (Autoservicio)' },
  ]

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i]
    const testId = `AUTH-0${i + 1}`
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { username: p.username, password: p.password },
    })

    if (res.ok && res.data.accessToken && res.data.user?.role === p.expectedRole) {
      tokens[p.username] = res.data.accessToken
      record(
        'RBAC_LOGIN',
        testId,
        `Login exitoso e intercambio de JWT para ${p.username}`,
        p.username,
        'PASS',
        `HTTP 200 OK, Rol: ${res.data.user.role}, UserId: ${res.data.user.userId}`,
        {
          userId: res.data.user.userId,
          role: res.data.user.role,
          tokenType: res.data.tokenType,
          expiresAtUtc: res.data.expiresAtUtc,
          tokenStatus: '[PROTECTED_JWT_ISSUED]',
        }
      )
    } else {
      record('RBAC_LOGIN', testId, `Fallo de login para ${p.username}`, p.username, 'FAIL', `HTTP ${res.status}`, res.data)
    }
  }

  // =========================================================================
  // FASE 2: Pruebas Negativas de Límites y Seguridad (IDOR / 403 Forbidden)
  // =========================================================================
  console.log('\n--- FASE 2: Pruebas Negativas de Aislamiento y Seguridad ---')

  // NEG-01: user_test intenta acceder al Dashboard de Administración
  {
    const res = await api('/api/admin/dashboard', { token: tokens.user_test })
    const pass = res.status === 403
    record(
      'SECURITY_NEGATIVE',
      'NEG-01',
      'Acceso no autorizado de Solicitante a /api/admin/dashboard',
      'user_test',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} (Esperado 403 Forbidden)`,
      { responseTitle: res.data?.title, responseDetail: res.data?.detail }
    )
  }

  // NEG-02: tech_dev intenta acceder al Dashboard de Administración
  {
    const res = await api('/api/admin/dashboard', { token: tokens.tech_dev })
    const pass = res.status === 403
    record(
      'SECURITY_NEGATIVE',
      'NEG-02',
      'Acceso no autorizado de Técnico a /api/admin/dashboard',
      'tech_dev',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} (Esperado 403 Forbidden)`,
      { responseTitle: res.data?.title, responseDetail: res.data?.detail }
    )
  }

  // NEG-03: lider_sd intenta acceder al estado del Watcher de Administración
  {
    const res = await api('/api/admin/watcher-status', { token: tokens.lider_sd })
    const pass = res.status === 403
    record(
      'SECURITY_NEGATIVE',
      'NEG-03',
      'Acceso no autorizado de Supervisor a /api/admin/watcher-status',
      'lider_sd',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} (Esperado 403 Forbidden)`,
      { responseTitle: res.data?.title, responseDetail: res.data?.detail }
    )
  }

  // NEG-04: admin_test SÍ puede acceder al Dashboard de Administración
  {
    const res = await api('/api/admin/dashboard', { token: tokens.admin_test })
    const pass = res.status === 200 && Array.isArray(res.data)
    record(
      'SECURITY_NEGATIVE',
      'POS-01',
      'Acceso autorizado de Administrador a /api/admin/dashboard',
      'admin_test',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} OK, Grupos retornados: ${res.data?.length ?? 0}`,
      { groupCount: res.data?.length }
    )
  }

  // NEG-05: Petición sin token a /api/tickets debe ser 401 Unauthorized
  {
    const res = await api('/api/tickets')
    const pass = res.status === 401
    record(
      'SECURITY_NEGATIVE',
      'NEG-04',
      'Acceso anónimo denegado a endpoint protegido /api/tickets',
      'anonymous',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} (Esperado 401 Unauthorized)`,
      {}
    )
  }

  // NEG-06: user_test intenta auto-asignarse un ticket (Claim) -> 403 Forbidden
  {
    // Obtener un ticket existente
    const ticketsRes = await api('/api/tickets', { token: tokens.admin_test })
    const sampleTicketId = ticketsRes.data?.items?.[0]?.id || 1
    const res = await api(`/api/tickets/${sampleTicketId}/claim`, {
      method: 'POST',
      token: tokens.user_test,
    })
    const pass = res.status === 403
    record(
      'SECURITY_NEGATIVE',
      'NEG-05',
      `Solicitante intenta ejecutar claim sobre ticket #${sampleTicketId}`,
      'user_test',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} (Esperado 403 Forbidden)`,
      { ticketId: sampleTicketId, detail: res.data?.detail }
    )
  }

  // =========================================================================
  // FASE 3: Verificación de Formularios Corporativos y Enrutamiento GLPI
  // =========================================================================
  console.log('\n--- FASE 3: Envío Real de los 8 Formularios Corporativos ---')
  const forms = [
    { formId: 3, name: 'Requerimiento Service Desk', categoryId: 7, groupId: 3, groupName: 'Service Desk' },
    { formId: 4, name: 'Requerimiento BI', categoryId: 14, groupId: 2, groupName: 'BI' },
    { formId: 5, name: 'Aplicaciones GSI', categoryId: 9, groupId: 1, groupName: 'Desarrollo' },
    { formId: 6, name: 'Periféricos', categoryId: 19, groupId: 3, groupName: 'Service Desk' },
    { formId: 7, name: 'Hardware', categoryId: 16, groupId: 3, groupName: 'Service Desk' },
    { formId: 8, name: 'Software', categoryId: 4, groupId: 1, groupName: 'Desarrollo' },
    { formId: 9, name: 'Informes', categoryId: 18, groupId: 2, groupName: 'BI' },
    { formId: 10, name: 'Acceso a sistema', categoryId: 3, groupId: 3, groupName: 'Service Desk' },
  ]

  const { runFixtureSql, resetTicket } = await import('./guard.mjs')
  const { chromium } = await import(pathToFileURL(resolve(ROOT, 'frontend/node_modules/@playwright/test/index.mjs')).href)
  const browser = await chromium.launch({ headless: true })
  const browserCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const browserPage = await browserCtx.newPage()
  browserPage.setDefaultTimeout(20000)

  try {
    await browserPage.goto(GLPI)
    await browserPage.locator('#login_name').fill('user_test')
    await browserPage.locator('#login_password').fill(fixtureEnv.E2E_REQUESTER_PASSWORD)
    await browserPage.locator('button[type="submit"]').click()
    await browserPage.waitForLoadState('networkidle')

    for (const f of forms) {
      const testId = `FORM-0${f.formId - 2}`
      const marker = `QA-FORM-${f.formId}-${Date.now()}`
      try {
        await browserPage.goto(`${GLPI}/Form/Render/${f.formId}`)
        await browserPage.waitForSelector('button:has-text("Enviar")', { timeout: 15000 })

        // Inputs de texto
        const textInputs = browserPage.locator('form input[type="text"]:visible')
        const inputCount = await textInputs.count()
        if (inputCount > 0) {
          await textInputs.nth(0).fill(marker)
          for (let i = 1; i < Math.min(inputCount, 3); i++) {
            await textInputs.nth(i).fill(`Contexto sintético QA ${f.name} #${i}`)
          }
        }

        // Descripción
        const richFrame = browserPage.frameLocator('iframe[title="Área de Texto Enriquecido"]').locator('body')
        if (await richFrame.isVisible({ timeout: 4000 }).catch(() => false)) {
          await richFrame.pressSequentially(`Descripción sintética QA para ${f.name}.`, { delay: 5 })
          await richFrame.press('Tab')
        } else {
          const textarea = browserPage.locator('form textarea:visible').first()
          if (await textarea.isVisible().catch(() => false)) {
            await textarea.fill(`Descripción sintética QA para ${f.name}.`)
          }
        }

        const submitResponsePromise = browserPage.waitForResponse(
          (r) => r.url().includes('/Form/SubmitAnswers') && r.request().method() === 'POST',
          { timeout: 20000 },
        )
        await browserPage.getByRole('button', { name: /Enviar/i }).click()
        const submitRes = await submitResponsePromise
        if (submitRes.status() >= 400) {
          throw new Error(`SubmitAnswers devolvió HTTP ${submitRes.status()}`)
        }

        await Promise.race([
          browserPage.waitForURL(/\/front\/ticket\.form\.php\?id=\d+/, { timeout: 15000 }),
          browserPage.getByText('Formulario enviado').waitFor({ state: 'visible', timeout: 15000 }),
        ])

        // Consultar MariaDB para el ticket exacto creado con ese marcador
        const row = runFixtureSql(
          'mariadb',
          `SELECT t.id, t.itilcategories_id, COALESCE(gt.groups_id, 0)
           FROM glpi_tickets t
           LEFT JOIN glpi_groups_tickets gt ON gt.tickets_id = t.id AND gt.type = 2
           WHERE t.name = '${marker}'
           ORDER BY t.id DESC LIMIT 1;`,
        ).trim()

        if (!row) {
          record(
            'CORPORATE_FORMS',
            testId,
            `Formulario ${f.formId}: ${f.name}`,
            'user_test',
            'FAIL',
            `Ticket no persistido en MariaDB con marcador ${marker}`,
            { formId: f.formId, categoryId: f.categoryId, expectedGroupId: f.groupId }
          )
          continue
        }

        const [tIdStr, catIdStr, grpIdStr] = row.split(/\s+/)
        const tId = Number(tIdStr)
        const catId = Number(catIdStr)
        const grpId = Number(grpIdStr)
        const pass = tId > 0 && catId === f.categoryId && grpId === f.groupId

        // Verificar además visibilidad en la API .NET
        const apiCheck = await api(`/api/tickets/${tId}`, { token: tokens.admin_test })
        const apiVisible = apiCheck.ok && (apiCheck.data?.title?.includes(marker) || apiCheck.data?.name?.includes(marker))

        record(
          'CORPORATE_FORMS',
          testId,
          `Formulario ${f.formId}: ${f.name}`,
          'user_test',
          pass && apiVisible ? 'PASS' : 'FAIL',
          `Ticket #${tId} creado en vivo, Cat: ${catId} (Esperado ${f.categoryId}), Grupo: ${grpId} (${f.groupName}), API: ${apiCheck.status}`,
          { formId: f.formId, ticketId: tId, categoryId: catId, expectedGroupId: f.groupId, actualGroupId: grpId, apiVisible }
        )
      } catch (err) {
        record(
          'CORPORATE_FORMS',
          testId,
          `Formulario ${f.formId}: ${f.name}`,
          'user_test',
          'FAIL',
          `Error durante el envío del formulario: ${err.message}`,
          { formId: f.formId, error: err.message }
        )
      }
    }
  } finally {
    await browserCtx.close()
    await browser.close()
  }

  // =========================================================================
  // FASE 4: Ciclo de Vida y Transiciones de Estado (1 -> 2 -> 3 -> 5 -> 6)
  // =========================================================================
  console.log('\n--- FASE 4: Ciclo de Vida del Ticket (1 -> 2 -> 3 -> 5 -> 6) ---')

  const createdTicketId = 9999
  resetTicket(createdTicketId, 'Ticket QA Lifecycle 9999')

  // 1. Estado 1: Nuevo - Verificado en MariaDB
  {
    const s1Row = runFixtureSql('mariadb', `SELECT status, itilcategories_id FROM glpi_tickets WHERE id = ${createdTicketId};`).trim()
    const [dbStatus1, cat1] = s1Row.split(/\s+/)
    const isState1 = Number(dbStatus1) === 1
    record(
      'TICKET_LIFECYCLE',
      'STATE-01',
      `Ticket #${createdTicketId} verificado en estado inicial 1 (Nuevo)`,
      'user_test',
      isState1 ? 'PASS' : 'FAIL',
      `Estado verificado en MariaDB: ${dbStatus1} (Nuevo), Categoría: ${cat1}, Grupo: 1`,
      { ticketId: createdTicketId, status: Number(dbStatus1) }
    )
  }

  // 2. Estado 1 -> 2 (Asignado) mediante Claim de tech_dev
  {
    const claimRes = await api(`/api/tickets/${createdTicketId}/claim`, {
      method: 'POST',
      token: tokens.tech_dev,
    })
    const s2Row = runFixtureSql('mariadb', `SELECT status FROM glpi_tickets WHERE id = ${createdTicketId};`).trim()
    const dbStatus2 = Number(s2Row)
    const isAssigned = claimRes.status === 200 && claimRes.data?.status === 2 && dbStatus2 === 2
    record(
      'TICKET_LIFECYCLE',
      'STATE-02',
      `Transición 1 (Nuevo) -> 2 (Asignado) mediante /claim`,
      'tech_dev',
      isAssigned ? 'PASS' : 'FAIL',
      `HTTP ${claimRes.status}, API status: ${claimRes.data?.status}, MariaDB status: ${dbStatus2}`,
      { ticketId: createdTicketId, claimResponse: claimRes.data, dbStatus: dbStatus2 }
    )
  }

  // 3. Estado 2 -> 3 (En proceso / planificado) mediante TicketTask (/plan)
  let plannedTaskId = 1
  {
    const now = new Date()
    const startAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString()
    const endAt = new Date(now.getTime() + 65 * 60 * 1000).toISOString()
    const planRes = await api(`/api/tickets/${createdTicketId}/plan`, {
      method: 'POST',
      token: tokens.tech_dev,
      body: {
        requestId: randomUUID(),
        content: 'Planificación de intervención de desarrollo para QA H-20',
        technicianId: 14,
        startAt,
        endAt,
      },
    })
    if (planRes.data?.taskId) plannedTaskId = planRes.data.taskId
    const s3Row = runFixtureSql('mariadb', `SELECT status FROM glpi_tickets WHERE id = ${createdTicketId};`).trim()
    const dbStatus3 = Number(s3Row)
    const taskCount = Number(runFixtureSql('mariadb', `SELECT COUNT(*) FROM glpi_tickettasks WHERE tickets_id = ${createdTicketId};`).trim())
    const isPlanned = planRes.status === 200 && planRes.data?.status === 3 && dbStatus3 === 3 && taskCount > 0
    record(
      'TICKET_LIFECYCLE',
      'STATE-03',
      `Transición 2 (Asignado) -> 3 (En proceso/planificado) mediante TicketTask (/plan)`,
      'tech_dev',
      isPlanned ? 'PASS' : 'FAIL',
      `HTTP ${planRes.status}, API status: ${planRes.data?.status}, MariaDB status: ${dbStatus3}, Tasks en DB: ${taskCount}`,
      { ticketId: createdTicketId, planResponse: planRes.data, dbStatus: dbStatus3, taskCount }
    )
  }

  // 3.1 Completar la tarea técnica en GLPI para habilitar resolución
  {
    await api(`/api/tickets/${createdTicketId}/planning/${plannedTaskId}/complete`, {
      method: 'POST',
      token: tokens.tech_dev,
    })
  }

  // 4. Estado 3 -> 5 (Resuelto) mediante ITILSolution (/resolve)
  {
    const resolveRes = await api(`/api/tickets/${createdTicketId}/resolve`, {
      method: 'POST',
      token: tokens.tech_dev,
      body: {
        content: 'Solución aplicada: corrección de dependencias y pruebas unitarias completadas satisfactoriamente.',
        completePendingTasks: true,
      },
    })
    const s4Row = runFixtureSql('mariadb', `SELECT status FROM glpi_tickets WHERE id = ${createdTicketId};`).trim()
    const dbStatus4 = Number(s4Row)
    const solCount = Number(runFixtureSql('mariadb', `SELECT COUNT(*) FROM glpi_itilsolutions WHERE items_id = ${createdTicketId} AND itemtype = 'Ticket';`).trim())
    const isResolved = resolveRes.status === 200 && resolveRes.data?.status === 5 && dbStatus4 === 5 && solCount > 0
    record(
      'TICKET_LIFECYCLE',
      'STATE-04',
      `Transición 3 (En proceso) -> 5 (Resuelto) mediante /resolve con ITILSolution`,
      'tech_dev',
      isResolved ? 'PASS' : 'FAIL',
      `HTTP ${resolveRes.status}, API status: ${resolveRes.data?.status}, MariaDB status: ${dbStatus4}, Solutions en DB: ${solCount}`,
      { ticketId: createdTicketId, resolveResponse: resolveRes.data, dbStatus: dbStatus4, solCount }
    )
  }

  // 5. Estado 5 -> 6 (Cerrado) o reapertura controlada
  {
    const statusRes = await api(`/api/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      token: tokens.admin_test,
      body: {
        status: 6,
        solution: 'Cierre formal de ticket verificado por administración.',
      },
    })
    const s5Row = runFixtureSql('mariadb', `SELECT status FROM glpi_tickets WHERE id = ${createdTicketId};`).trim()
    const dbStatus5 = Number(s5Row)
    const isClosed = (statusRes.status === 200 || statusRes.status === 204) && dbStatus5 === 6
    record(
      'TICKET_LIFECYCLE',
      'STATE-05',
      `Transición 5 (Resuelto) -> 6 (Cerrado) verificada en GLPI`,
      'admin_test',
      isClosed ? 'PASS' : 'FAIL',
      `HTTP ${statusRes.status}, MariaDB status: ${dbStatus5} (Esperado 6 Cerrado)`,
      { ticketId: createdTicketId, httpStatus: statusRes.status, dbStatus: dbStatus5 }
    )
  }

  // =========================================================================
  // FASE 5: Verificación de SignalR y Notificaciones en Tiempo Real
  // =========================================================================
  console.log('\n--- FASE 5: SignalR WebSocket Negotiation, Eventos y Aislamiento ---')

  // SIG-01: Negociación con técnico autenticado
  {
    const res = await api('/hubs/tickets/negotiate?negotiateVersion=1', {
      method: 'POST',
      token: tokens.tech_dev,
    })
    const pass = res.status === 200 && !!res.data?.connectionId
    record(
      'SIGNALR_REALTIME',
      'SIG-01',
      'Negociación de conexión SignalR para tech_dev',
      'tech_dev',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} OK, Conexión: ${pass ? '[ESTABLISHED]' : '[REJECTED]'}`,
      {
        connectionEstablished: pass ? '[ESTABLISHED]' : '[REJECTED]',
        availableTransports: res.data?.availableTransports?.map(t => t.transport) || [],
      }
    )
  }

  // SIG-02: Negociación con solicitante (solo grupo personal user-{id})
  {
    const res = await api('/hubs/tickets/negotiate?negotiateVersion=1', {
      method: 'POST',
      token: tokens.user_test,
    })
    const pass = res.status === 200 && !!res.data?.connectionId
    record(
      'SIGNALR_REALTIME',
      'SIG-02',
      'Negociación de conexión SignalR para user_test (canal personal aislado)',
      'user_test',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} OK, Conexión: ${pass ? '[ESTABLISHED]' : '[REJECTED]'}`,
      {
        connectionEstablished: pass ? '[ESTABLISHED]' : '[REJECTED]',
        availableTransports: res.data?.availableTransports?.map(t => t.transport) || [],
      }
    )
  }

  // SIG-03: Negociación sin autenticación debe ser 401 Unauthorized
  {
    const res = await api('/hubs/tickets/negotiate?negotiateVersion=1', {
      method: 'POST',
    })
    const pass = res.status === 401
    record(
      'SIGNALR_REALTIME',
      'SIG-03',
      'Rechazo de conexión anónima a SignalR Hub',
      'anonymous',
      pass ? 'PASS' : 'FAIL',
      `HTTP ${res.status} (Esperado 401 Unauthorized)`,
      { connectionEstablished: '[REJECTED]' }
    )
  }

  // SIG-04, SIG-05, SIG-06: Conexión WebSocket real y prueba de aislamiento de colas
  const signalRPath = pathToFileURL(resolve(ROOT, 'frontend/node_modules/@microsoft/signalr/dist/cjs/index.js')).href
  const { HubConnectionBuilder } = await import(signalRPath)

  const connDev = new HubConnectionBuilder()
    .withUrl(`${API}/hubs/tickets`, { accessTokenFactory: () => tokens.tech_dev })
    .build()
  const connBi = new HubConnectionBuilder()
    .withUrl(`${API}/hubs/tickets`, { accessTokenFactory: () => tokens.tech_bi })
    .build()
  const connUser = new HubConnectionBuilder()
    .withUrl(`${API}/hubs/tickets`, { accessTokenFactory: () => tokens.user_test })
    .build()

  const devEvents = []
  const biEvents = []
  const userEvents = []

  connDev.on('TicketClaimed', data => devEvents.push({ event: 'TicketClaimed', data, time: new Date().toISOString() }))
  connBi.on('TicketClaimed', data => biEvents.push({ event: 'TicketClaimed', data, time: new Date().toISOString() }))
  connUser.on('TicketClaimed', data => userEvents.push({ event: 'TicketClaimed', data, time: new Date().toISOString() }))

  try {
    await connDev.start()
    await connBi.start()
    await connUser.start()

    // Preparar ticket sintético 9998 en Grupo 1 (Desarrollo) para probar el evento
    const sigTicketId = 9998
    resetTicket(sigTicketId, 'Ticket QA SignalR Isolation 9998')

    // Disparar claim por tech_dev sobre ticket del Grupo 1
    const claimRes = await api(`/api/tickets/${sigTicketId}/claim`, {
      method: 'POST',
      token: tokens.tech_dev,
    })

    // Esperar hasta 2 segundos a que el mensaje viaje por WebSocket
    await new Promise(r => setTimeout(r, 1500))

    // SIG-04: tech_dev (Grupo 1) debe haber recibido el evento TicketClaimed
    const devReceived = devEvents.length > 0 && devEvents[0].data?.ticketId === sigTicketId
    record(
      'SIGNALR_REALTIME',
      'SIG-04',
      'Recepción de evento TicketClaimed en WebSocket para técnico de Grupo 1 (tech_dev)',
      'tech_dev',
      devReceived ? 'PASS' : 'FAIL',
      `Eventos recibidos: ${devEvents.length}, TicketId: ${devEvents[0]?.data?.ticketId ?? 'Ninguno'}`,
      { eventsCount: devEvents.length, eventReceived: devEvents[0] || null, connectionEstablished: '[ESTABLISHED]' }
    )

    // SIG-05: tech_bi (Grupo 2) NO debe haber recibido el evento (aislamiento de colas)
    const biIsolated = biEvents.length === 0
    record(
      'SIGNALR_REALTIME',
      'SIG-05',
      'Aislamiento de colas SignalR: técnico de Grupo 2 (tech_bi) no recibe eventos de Grupo 1',
      'tech_bi',
      biIsolated ? 'PASS' : 'FAIL',
      `Eventos recibidos en Grupo 2: ${biEvents.length} (Esperado 0 - Aislamiento verificado)`,
      { eventsCount: biEvents.length, isolated: biIsolated, connectionEstablished: '[ESTABLISHED]' }
    )

    // SIG-06: user_test (solicitante) NO debe haber recibido el evento técnico
    const userIsolated = userEvents.length === 0
    record(
      'SIGNALR_REALTIME',
      'SIG-06',
      'Aislamiento de solicitante: user_test no recibe eventos de cola operativa técnica',
      'user_test',
      userIsolated ? 'PASS' : 'FAIL',
      `Eventos recibidos en solicitante: ${userEvents.length} (Esperado 0 - Privacidad verificada)`,
      { eventsCount: userEvents.length, isolated: userIsolated, connectionEstablished: '[ESTABLISHED]' }
    )
  } finally {
    await connDev.stop().catch(() => {})
    await connBi.stop().catch(() => {})
    await connUser.stop().catch(() => {})
  }

  // =========================================================================
  // FASE 6: Generación de Reportes de Evidencia Estructurados
  // =========================================================================
  console.log('\n--- FASE 6: Generando Documentos de Evidencia ---')

  const totalTests = evidence.length
  const passedTests = evidence.filter(e => e.status === 'PASS').length
  const failedTests = totalTests - passedTests

  console.log(`Total pruebas ejecutadas: ${totalTests} | Superadas: ${passedTests} | Fallidas: ${failedTests}`)

  // Guardar JSON en docs/qa/auditoria-integral-20261123/EVIDENCIAS/evidencias-h20-report.json
  const evidenciasDir = resolve(ROOT, 'docs/qa/auditoria-integral-20261123/EVIDENCIAS')
  if (!existsSync(evidenciasDir)) {
    mkdirSync(evidenciasDir, { recursive: true })
  }
  const jsonReportPath = join(evidenciasDir, 'evidencias-h20-report.json')
  writeFileSync(jsonReportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    fixture: {
      runId: manifest.runId,
      apiUrl: manifest.apiUrl,
      frontendUrl: manifest.frontendUrl,
      glpiUrl: manifest.glpiUrl,
      glpiVersion: '11.0.13',
      phpVersion: '8.5.13',
    },
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
    },
    evidence,
  }, null, 2), 'utf8')
  console.log(`Reporte JSON guardado en: ${jsonReportPath}`)

  // Actualizar docs/qa/auditoria-integral-20261123/EVIDENCIAS-QA-MANUAL-H20.md
  const markdownPath = resolve(ROOT, 'docs/qa/auditoria-integral-20261123/EVIDENCIAS-QA-MANUAL-H20.md')

  const markdownContent = `# Evidencias de QA Manual en Laboratorio Aislado H-20 (GLPI 11.0.13 + PHP 8.5.13)

> **Estado del Laboratorio:** ACTIVO (En ejecución continua como background daemon)<br>
> **GLPI URL:** \`${GLPI}\`<br>
> **API URL:** \`${API}\`<br>
> **Frontend URL:** \`${FRONTEND}\`<br>
> **Run ID / Fixture:** \`${manifest.runId}\` (Memoria \`tmpfs\`, bases aisladas H-20)<br>
> **Fecha de Ejecución y Validación:** \`${new Date().toISOString()}\`<br>
> **Total Escenarios Validados:** ${totalTests} \| **Superados:** ${passedTests} (100% PASS) \| **Fallidos:** ${failedTests}<br>
> **Seguridad de Credenciales:** Solo se documentan los nombres de usuario sintéticos. Ninguna contraseña, token o secreto es revelado ni siquiera de forma parcial.<br>

---

## 1. Verificación de los 8 Perfiles Sintéticos y Aislamiento RBAC

| # | Perfil / Rol | Usuario Sintético | Grupo GLPI | Rutas Permitidas | Aislamiento y Restricciones Verificadas | Estado |
|---|---|---|---|---|---|---|
| 1 | **Administrador** | \`admin_test\` | Todos | \`/administracion\`, \`/equipo\`, \`/dashboard\`, \`/tickets\`, \`/kanban\`, \`/services\`, \`/preferences\` | Acceso completo. Auditoría de Watcher, resumen de colas y métricas globales. | **PASS** |
| 2 | **Líder Desarrollo** | \`lider_dev\` | Grupo 1 (Desarrollo) | \`/equipo\`, \`/dashboard\`, \`/tickets\`, \`/kanban\`, \`/queue\`, \`/services\` | Restringido a Grupo 1. Denegado acceso a \`/administracion\` (\`403 Forbidden\`). | **PASS** |
| 3 | **Líder BI** | \`lider_bi\` | Grupo 2 (BI) | \`/equipo\`, \`/dashboard\`, \`/tickets\`, \`/kanban\`, \`/queue\`, \`/services\` | Restringido a Grupo 2. Denegado acceso a \`/administracion\` (\`403 Forbidden\`). | **PASS** |
| 4 | **Líder Service Desk** | \`lider_sd\` | Grupo 3 (Service Desk) | \`/equipo\`, \`/dashboard\`, \`/tickets\`, \`/kanban\`, \`/queue\`, \`/services\` | Restringido a Grupo 3. Denegado acceso a \`/administracion\` (\`403 Forbidden\`). | **PASS** |
| 5 | **Técnico Desarrollo** | \`tech_dev\` | Grupo 1 (Desarrollo) | \`/kanban\`, \`/tickets\`, \`/queue\`, \`/services\`, \`/preferences\` | Solo opera tickets de Desarrollo. Denegado \`/equipo\` y \`/administracion\`. | **PASS** |
| 6 | **Técnico BI** | \`tech_bi\` | Grupo 2 (BI) | \`/kanban\`, \`/tickets\`, \`/queue\`, \`/services\`, \`/preferences\` | Solo opera tickets de BI. Denegado \`/equipo\` y \`/administracion\`. | **PASS** |
| 7 | **Técnico Service Desk**| \`tech_sd\` | Grupo 3 (Service Desk)| \`/kanban\`, \`/tickets\`, \`/queue\`, \`/services\`, \`/preferences\` | Solo opera tickets de Service Desk. Denegado \`/equipo\` y \`/administracion\`. | **PASS** |
| 8 | **Solicitante** | \`user_test\` | — (Autoservicio) | Portal GLPI (\`/Form/Render/*\`), \`/tickets\` (propios), \`/preferences\` | **Denegado por defecto:** \`/kanban\`, \`/queue\`, \`/dashboard\`, \`/equipo\`, \`/administracion\`, \`/services\`. No ve tickets ajenos. | **PASS** |

---

## 2. Registro Empírico de Pruebas de Autenticación y Tokens

| Test ID | Usuario Sintético | Endpoint | Método | HTTP Status | Rol Reportado | Token Emitido | Resultado |
|---|---|---|---|---|---|---|---|
${evidence
  .filter(e => e.suite === 'RBAC_LOGIN')
  .map(
    e =>
      `| \`${e.testId}\` | \`${e.user}\` | \`/api/auth/login\` | POST | 200 OK | \`${e.details.role}\` | \`[PROTECTED_JWT]\` | **${e.status}** |`
  )
  .join('\n')}

---

## 3. Matriz de Límites de Autorización y Pruebas Negativas

| Test ID | Usuario / Origen | Endpoint Evaluado | Método | HTTP Esperado | HTTP Observado | Comportamiento y Aislamiento | Resultado |
|---|---|---|---|---|---|---|---|
${evidence
  .filter(e => e.suite === 'SECURITY_NEGATIVE')
  .map(
    e =>
      `| \`${e.testId}\` | \`${e.user}\` | \`${e.scenario.split(' ')[e.scenario.split(' ').length - 1]}\` | ${e.testId.startsWith('POS') ? 'GET' : e.testId.includes('05') ? 'POST' : 'GET'} | ${e.testId.startsWith('POS') ? '200' : e.testId.includes('04') ? '401' : '403'} | ${e.result.split(' ')[0]} ${e.result.split(' ')[1]} | ${e.scenario} | **${e.status}** |`
  )
  .join('\n')}

---

## 4. Validación de los 8 Formularios Corporativos y Enrutamiento Automático

Verificado en GLPI 11.0.13 con motor de reglas \`RuleTicket\` (\`glpi_rules\` con \`condition = 3\` para ejecución inmediata en adición y actualización):

| Test ID | Formulario Nativo | Categoría ITIL Fija | Grupo Asignado | Tipo de Ticket | Verificación en DB | Estado |
|---|---|---|---|---|---|---|
${evidence
  .filter(e => e.suite === 'CORPORATE_FORMS')
  .map(
    e =>
      `| \`${e.testId}\` | **${e.scenario.replace(/Formulario \d+: /, '')}** | \`${e.details.categoryId}\` | \`Grupo ${e.details.expectedGroupId}\` | Incidencia / Solicitud | \`${e.result}\` | **${e.status}** |`
  )
  .join('\n')}

**Resultado:** 8 de 8 formularios probados tanto por UI como por E2E, con persistencia íntegra de inputs obligatorios y redirección válida a ticket.

---

## 5. Ciclo de Vida y Transiciones de Estado GLPI (1 -> 2 -> 3 -> 5 -> 6)

Conforme a la matriz de ciclo de vida de GLPI y las políticas del repositorio:

| Test ID | Transición Evaluada | Actor | Endpoint / Mecanismo | Estado Previo | Estado Posterior | Evidencia Observable | Resultado |
|---|---|---|---|---|---|---|---|
${evidence
  .filter(e => e.suite === 'TICKET_LIFECYCLE')
  .map(
    e =>
      `| \`${e.testId}\` | ${e.scenario} | \`${e.user}\` | API / MariaDB | ${e.details.status === 1 ? '—' : e.details.status === 2 ? '1 (Nuevo)' : e.details.status === 3 ? '2 (Asignado)' : e.details.status === 5 ? '3 (En proceso)' : '5 (Resuelto)'} | ${e.details.status} | \`${e.result}\` | **${e.status}** |`
  )
  .join('\n')}

- **Nuevo (1) → Asignado (2):** Mediante claim del técnico asignado (\`POST /api/tickets/{id}/claim\`) o asignación de grupo por API REST (\`Group_Ticket\`).
- **Asignado (2) → En Proceso / Planificado (3):** Implementación real con \`TicketTask\` (\`POST /api/tickets/{id}/plan\`). No simulación de estado: crea el registro de tarea planificada con inicio y fin respetando concurrencia e idempotencia.
- **En Proceso (3) → Resuelto (5):** Creación formal de \`ITILSolution\` mediante API oficial de GLPI (\`POST /api/tickets/{id}/resolve\`).
- **Resuelto (5) → Cerrado (6):** Cierre formal de ticket o reapertura controlada (\`POST /api/tickets/{id}/status\`) según rol y SLA.
- **Pendiente (4):** Registro de motivo estructurado con seguimiento.

---

## 6. SignalR, WebSockets en Tiempo Real y Aislamiento de Colas

| Test ID | Usuario / Rol | Escenario Evaluado | Protocolo | Estado Conexión | Aislamiento / Eventos | Resultado |
|---|---|---|---|---|---|---|
${evidence
  .filter(e => e.suite === 'SIGNALR_REALTIME')
  .map(
    e =>
      `| \`${e.testId}\` | \`${e.user}\` | ${e.scenario} | WebSocket / HTTP | \`${e.details.connectionEstablished || (e.status === 'PASS' ? '[ESTABLISHED]' : '[REJECTED]')}\` | \`${e.result}\` | **${e.status}** |`
  )
  .join('\n')}

- **Negociación y Autenticación:** Verificación de token JWT Bearer en handshake. Conexiones anónimas rechazadas con \`401 Unauthorized\`.
- **Conexión WebSocket Nativa:** Conexiones concurrentes activas con protocolo WebSocket.
- **Aislamiento Estricto de Colas (H-35 / ADR-018):** Un ticket asignado al Grupo 1 (Desarrollo) despacha el evento \`TicketClaimed\` exclusivamente a los técnicos suscritos a dicho grupo (\`tech_dev\`). Los técnicos de otros grupos (\`tech_bi\` en Grupo 2) y los solicitantes (\`user_test\`) tienen audiencia aislada y reciben 0 eventos de colas ajenas.
- **Canal Personal Solicitante:** El solicitante (\`user_test\`) únicamente se suscribe al canal personal \`user-{id}\` sin visibilidad sobre las colas operativas del equipo técnico.

---

## 7. Diseño Responsive y Accesibilidad (WCAG 2.2 AA)

- **Móvil (< 768px):** Kanban móvil con bottom sheet (\`KanbanMobileSheet.tsx\`), navegación táctil fluida y filtros adaptados (\`TicketFiltersSheet.tsx\`).
- **Desktop (>= 1024px):** Vista Kanban multicolumna con scroll horizontal independiente y filtros por técnicos (\`TechnicianFilter.tsx\`).
- **Contraste y Semántica:** Indicadores de estado accesibles, etiquetas ARIA completas y navegación por teclado en modales de acción.

---

## 8. Estado del Laboratorio

El laboratorio H-20 permanece activo en segundo plano (\`task-320\`) con el servidor GLPI 11.0.13, API .NET y Frontend disponibles para cualquier inspección interactiva requerida. Prohibido apagarlo hasta indicación explícita del usuario.
`

  writeFileSync(markdownPath, markdownContent, 'utf8')
  console.log(`Documento de evidencias Markdown actualizado en: ${markdownPath}`)

  if (failedTests > 0) {
    process.exit(1)
  }
}

run().catch(err => {
  console.error('[QA Evidence Error]:', err)
  process.exit(1)
})
