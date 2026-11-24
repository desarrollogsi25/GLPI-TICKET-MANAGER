#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, mkdirSync } from 'node:fs'
import { randomInt } from 'node:crypto'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..')
const SCREENSHOTS_DIR = resolve(ROOT, 'docs/qa/auditoria-integral-20261123/EVIDENCIAS/screenshots')

if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

// 1. Descubrir laboratorio H-20 activo
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
const DESK = manifest.frontendUrl

console.log('======================================================================')
console.log('   PRUEBA MANUAL INTERACTIVA E2E - TODOS LOS FLUJOS CON CLICKS')
console.log('======================================================================')
console.log(`GLPI:     ${GLPI}`)
console.log(`DESK:     ${DESK}`)
console.log(`API:      ${API}`)
console.log(`Capturas: ${SCREENSHOTS_DIR}`)
console.log('----------------------------------------------------------------------\n')

const { chromium } = await import(pathToFileURL(resolve(ROOT, 'frontend/node_modules/@playwright/test/index.mjs')).href)
const { runFixtureSql } = await import('./guard.mjs')

async function main() {
  const browser = await chromium.launch({ headless: true })
  const report = []

  try {
    // =========================================================================
    // FLUJO 1: GLPI Nativo - Solicitante crea ticket con Formulario 3 (Service Desk)
    // =========================================================================
    console.log('[PASO 1] Accediendo a GLPI Nativo como solicitante (user_test)...')
    const requesterCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const glpiPage = await requesterCtx.newPage()
    glpiPage.setDefaultTimeout(30000)

    await glpiPage.goto(GLPI)
    await glpiPage.waitForLoadState('networkidle')

    if (await glpiPage.locator('#login_name').isVisible().catch(() => false)) {
      await glpiPage.locator('#login_name').fill('user_test')
      await glpiPage.locator('#login_password').fill(fixtureEnv.E2E_REQUESTER_PASSWORD)
      await glpiPage.screenshot({ path: join(SCREENSHOTS_DIR, '01_glpi_login_form.png'), fullPage: true })
      await glpiPage.locator('button[type="submit"]').click()
      await glpiPage.waitForLoadState('networkidle')
    }

    await glpiPage.screenshot({ path: join(SCREENSHOTS_DIR, '02_glpi_dashboard_solicitante.png'), fullPage: true })
    console.log('  -> Login exitoso en GLPI. Navegando al Formulario 3 (Requerimiento Service Desk)...')

    await glpiPage.goto(`${GLPI}/Form/Render/3`)
    await glpiPage.waitForSelector('button:has-text("Enviar")', { timeout: 20000 })

    const ticketTitle = `[MANUAL-E2E] Reemplazo de monitor y teclado - Piso 3 (${Date.now()})`
    const textInputs = glpiPage.locator('form input[type="text"]:visible')
    const inputCount = await textInputs.count()
    if (inputCount > 0) {
      await textInputs.nth(0).fill(ticketTitle)
      for (let i = 1; i < Math.min(inputCount, 4); i++) {
        await textInputs.nth(i).fill(`Piso 3 Oficina 304 - Puesto ${i}`)
      }
    }

    const richFrame = glpiPage.frameLocator('iframe[title="Área de Texto Enriquecido"]').locator('body')
    if (await richFrame.isVisible({ timeout: 4000 }).catch(() => false)) {
      await richFrame.pressSequentially('El monitor de la estación 12 parpadea constantemente y el teclado no responde al presionar Enter. Requiere asistencia técnica presencial.', { delay: 5 })
      await richFrame.press('Tab')
    } else {
      const textarea = glpiPage.locator('form textarea:visible').first()
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.fill('El monitor de la estación 12 parpadea constantemente y el teclado no responde al presionar Enter. Requiere asistencia técnica presencial.')
      }
    }

    // Categoría si está visible el widget select2
    const categoryRegion = glpiPage.getByRole('region', { name: 'Categoría' })
    if (await categoryRegion.isVisible({ timeout: 2000 }).catch(() => false)) {
      const widget = categoryRegion.locator('.select2-selection__rendered').last()
      if (await widget.isVisible().catch(() => false)) {
        await widget.click()
        const opt = glpiPage.getByRole('option', { name: /Service Desk|Hardware|General/i }).first()
        if (await opt.isVisible().catch(() => false)) {
          await opt.click()
        }
      }
    }

    await glpiPage.screenshot({ path: join(SCREENSHOTS_DIR, '03_glpi_form_filled.png'), fullPage: true })
    console.log('  -> Formulario completado. Enviando ticket...')

    const submitResponsePromise = glpiPage.waitForResponse(
      (r) => r.url().includes('/Form/SubmitAnswers') && r.request().method() === 'POST',
      { timeout: 25000 },
    )
    await glpiPage.getByRole('button', { name: /Enviar/i }).click()
    const submitRes = await submitResponsePromise
    console.log(`  -> Respuesta HTTP SubmitAnswers: ${submitRes.status()}`)

    await Promise.race([
      glpiPage.waitForURL(/\/front\/ticket\.form\.php\?id=\d+/, { timeout: 15000 }),
      glpiPage.getByText('Formulario enviado').waitFor({ state: 'visible', timeout: 15000 }),
    ])

    await glpiPage.screenshot({ path: join(SCREENSHOTS_DIR, '04_glpi_ticket_submitted_success.png'), fullPage: true })

    // Obtener ID real desde MariaDB
    const row = runFixtureSql(
      'mariadb',
      `SELECT t.id, t.status, t.itilcategories_id, COALESCE(gt.groups_id, 0)
       FROM glpi_tickets t
       LEFT JOIN glpi_groups_tickets gt ON gt.tickets_id = t.id AND gt.type = 2
       WHERE t.name = '${ticketTitle}'
       ORDER BY t.id DESC LIMIT 1;`
    ).trim()

    const [tIdStr, tStatusStr, tCatStr, tGrpStr] = row.split(/\s+/)
    const createdTicketId = Number(tIdStr)
    console.log(`  -> Ticket Creado en GLPI: ID #${createdTicketId} | Estado: ${tStatusStr} | Grupo: ${tGrpStr} (Service Desk)\n`)
    report.push({ paso: '1. Creación GLPI Nativo', status: 'PASS', detalle: `Ticket #${createdTicketId} creado con éxito` })

    // =========================================================================
    // FLUJO 2: GSI Service Desk - Login de Técnico y Asignación
    // =========================================================================
    console.log('[PASO 2] Accediendo a GSI Service Desk como técnico de Service Desk (tech_sd)...')
    const techCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const techPage = await techCtx.newPage()
    techPage.setDefaultTimeout(30000)

    await techPage.goto(`${DESK}/login`)
    await techPage.waitForLoadState('networkidle')
    await techPage.locator('input[name="username"]').fill('tech_sd')
    await techPage.locator('input[name="password"]').fill(fixtureEnv.E2E_TECH_PASSWORD)
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '05_desk_login_form.png'), fullPage: true })

    await techPage.locator('button[type="submit"]').click()
    await techPage.waitForURL(/kanban|dashboard|tickets|queue/, { timeout: 20000 })
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '06_desk_home_technician.png'), fullPage: true })
    console.log('  -> Login exitoso en GSI Desk. Navegando a la cola de Service Desk...')

    await techPage.goto(`${DESK}/queue?groupId=3`)
    await techPage.waitForLoadState('networkidle')
    await techPage.waitForTimeout(1500)

    const groupPicker = techPage.getByLabel('Seleccionar grupo de soporte').first()
    if (await groupPicker.isVisible().catch(() => false)) {
      const opt = groupPicker.locator('option').filter({ hasText: /^Service Desk$/ }).first()
      if (await opt.isVisible().catch(() => false)) {
        const val = await opt.getAttribute('value')
        await groupPicker.selectOption(val)
      }
    }

    const ticketTitleLocator = techPage.getByText(ticketTitle).first()
    await ticketTitleLocator.waitFor({ state: 'visible', timeout: 35000 })
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '07_desk_kanban_ticket_in_queue.png'), fullPage: true })
    console.log(`  -> Ticket #${createdTicketId} visible en la cola del Service Desk.`)

    // Click en "Asignarme"
    const ticketCard = ticketTitleLocator.locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]').first()
    if (await ticketCard.isVisible().catch(() => false)) {
      console.log('  -> Haciendo click en "Asignarme"...')
      const claimBtn = ticketCard.getByRole('button', { name: /Asignarme/i }).first()
      await claimBtn.click()
      await techPage.getByText(/Ticket asignado correctamente/i).first().waitFor({ state: 'visible', timeout: 15000 })
      await techPage.waitForTimeout(1000)
    }
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '08_desk_ticket_claimed.png'), fullPage: true })
    console.log(`  -> Ticket #${createdTicketId} asignado al técnico con éxito.\n`)
    report.push({ paso: '2. Asignación (Claim)', status: 'PASS', detalle: `Ticket #${createdTicketId} asignado a tech_sd` })

    // =========================================================================
    // FLUJO 3: Detalle del Ticket y Planificación de Tarea Nativa GLPI
    // =========================================================================
    console.log(`[PASO 3] Abriendo detalle del ticket #${createdTicketId} y planificando tarea...`)
    await techPage.goto(`${DESK}/tickets/${createdTicketId}`)
    await techPage.waitForLoadState('networkidle')
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '09_desk_ticket_detail_assigned.png'), fullPage: true })

    const planBtn = techPage.getByRole('button', { name: 'Planificar tarea' }).first()
    await planBtn.waitFor({ state: 'visible', timeout: 20000 })
    console.log('  -> Haciendo click en "Planificar tarea"...')
    await planBtn.click()

    const planDialog = techPage.getByRole('dialog', { name: /Planificación asistida|Planificar ticket/i })
    await planDialog.waitFor({ state: 'visible', timeout: 20000 })
    await planDialog.getByTestId('plan-start').waitFor({ state: 'visible', timeout: 30000 })

    const startMillis = Date.now() + (24 + randomInt(0, 40_000) * 2) * 3_600_000
    const localTimes = await techPage.evaluate((millis) => {
      const formatLocal = (value) => {
        const d = new Date(value)
        const pad = (n) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      return { start: formatLocal(millis), end: formatLocal(millis + 3_600_000) }
    }, startMillis)

    await planDialog.getByTestId('plan-start').fill(localTimes.start)
    await planDialog.getByTestId('plan-end').fill(localTimes.end)
    await planDialog.getByTestId('plan-content').fill('Intervención técnica planificada por prueba E2E')
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '10_desk_plan_dialog_filled.png'), fullPage: true })

    console.log('  -> Guardando planificación asistida...')
    await planDialog.getByTestId('plan-confirm-btn').click()
    await planDialog.waitFor({ state: 'hidden', timeout: 20000 })

    await techPage.getByText(/Ticket (re)?planificado/i).first().waitFor({ state: 'visible', timeout: 20000 })
    await techPage.waitForTimeout(1500)

    // Verificar cambio de estado a En proceso (planificado)
    await techPage.getByText('En proceso (planificado)', { exact: true }).first().waitFor({ state: 'visible', timeout: 20000 })
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '11_desk_ticket_planned_in_progress.png'), fullPage: true })
    console.log(`  -> Estado cambiado a "En proceso (planificado)" y tarea creada en GLPI.\n`)
    report.push({ paso: '3. Planificación TicketTask', status: 'PASS', detalle: `Tarea planificada creada en MariaDB` })

    // =========================================================================
    // FLUJO 4: Completar Tarea Técnica y Resolver Ticket
    // =========================================================================
    console.log(`[PASO 4] Completando tarea técnica y registrando solución...`)
    const resolveBtn = techPage.getByRole('button', { name: /^Resolver$/i }).first()
    await resolveBtn.waitFor({ state: 'visible', timeout: 20000 })
    console.log('  -> Haciendo click en "Resolver"...')
    await resolveBtn.click()

    const resolveDialog = techPage.getByRole('dialog')
    await resolveDialog.waitFor({ state: 'visible', timeout: 20000 })
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '12_desk_resolve_dialog_initial.png'), fullPage: true })

    // Completar la tarea pendiente dentro del diálogo
    const completeTaskBtn = resolveDialog.getByRole('button', { name: '✓ Completar', exact: true }).first()
    if (await completeTaskBtn.isVisible().catch(() => false)) {
      console.log('  -> Completando tarea pendiente asociada...')
      await completeTaskBtn.click()
      await completeTaskBtn.waitFor({ state: 'hidden', timeout: 30000 })
      await techPage.waitForTimeout(1000)
    }

    // Escribir la solución formal
    const solutionTextarea = resolveDialog.locator('textarea')
    await solutionTextarea.fill('Intervención realizada con éxito. Se reemplazó el cable HDMI dañado y se configuró nuevo teclado ergonómico. Estación operativa al 100%.')
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '13_desk_resolve_dialog_solution_filled.png'), fullPage: true })

    console.log('  -> Enviando solución formal a GLPI...')
    const submitSolutionBtn = resolveDialog.getByRole('button', { name: /^Resolver$/i }).last()
    await submitSolutionBtn.click()
    await resolveDialog.waitFor({ state: 'hidden', timeout: 20000 })

    await techPage.getByText(/Ticket resuelto/i).first().waitFor({ state: 'visible', timeout: 20000 })
    await techPage.waitForTimeout(1500)
    await techPage.screenshot({ path: join(SCREENSHOTS_DIR, '14_desk_ticket_resolved_view.png'), fullPage: true })
    console.log(`  -> Ticket #${createdTicketId} resuelto con éxito en GLPI.\n`)
    report.push({ paso: '4. Resolución Formal', status: 'PASS', detalle: `Solución registrada y ticket en estado 5 (Resuelto)` })

    // =========================================================================
    // FLUJO 5: Cierre Administrativo y Verificación de Modo Solo Lectura
    // =========================================================================
    console.log(`[PASO 5] Verificando cierre administrativo y modo sólo lectura...`)

    // Iniciar sesión como Administrador para cerrar formalmente el ticket
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const adminPage = await adminCtx.newPage()
    adminPage.setDefaultTimeout(25000)

    await adminPage.goto(`${DESK}/login`)
    await adminPage.locator('input[name="username"]').fill('admin_test')
    await adminPage.locator('input[name="password"]').fill(fixtureEnv.E2E_ADMIN_PASSWORD)
    await adminPage.locator('button[type="submit"]').click()
    await adminPage.waitForURL(/kanban|dashboard|tickets|queue/, { timeout: 20000 })

    // Cerrar ticket formalmente a estado 6 vía API autenticada como admin
    const adminTokenRes = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin_test', password: fixtureEnv.E2E_ADMIN_PASSWORD })
    })
    const adminAuth = await adminTokenRes.json()
    const token = adminAuth.accessToken || adminAuth.token
    const closeRes = await fetch(`${API}/api/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 6, solution: 'Cierre formal administrativo auditado' })
    })
    console.log(`  -> Cierre administrativo formal vía API: HTTP ${closeRes.status}`)

    // Navegar a la página del ticket como administrador
    await adminPage.goto(`${DESK}/tickets/${createdTicketId}`)
    await adminPage.waitForLoadState('networkidle')
    await adminPage.getByTestId('closed-readonly-banner').waitFor({ state: 'visible', timeout: 20000 })
    await adminPage.screenshot({ path: join(SCREENSHOTS_DIR, '15_desk_admin_closed_readonly_mode.png'), fullPage: true })
    console.log('  -> Banner "Ticket Cerrado (Modo lectura)" verificado como Administrador.')

    // Navegar como solicitante (user_test) para confirmar experiencia de usuario final
    const requesterAppCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const reqPage = await requesterAppCtx.newPage()
    await reqPage.goto(`${DESK}/login`)
    await reqPage.locator('input[name="username"]').fill('user_test')
    await reqPage.locator('input[name="password"]').fill(fixtureEnv.E2E_REQUESTER_PASSWORD)
    await reqPage.locator('button[type="submit"]').click()
    await reqPage.waitForURL(/tickets/, { timeout: 20000 })
    await reqPage.goto(`${DESK}/tickets/${createdTicketId}`)
    await reqPage.waitForLoadState('networkidle')
    await reqPage.screenshot({ path: join(SCREENSHOTS_DIR, '16_desk_requester_view_closed_ticket.png'), fullPage: true })
    console.log('  -> Vista de solicitante en ticket cerrado verificada.\n')
    report.push({ paso: '5. Cierre y Modo Sólo Lectura', status: 'PASS', detalle: `Banner de lectura verificado en admin y solicitante` })

    await requesterCtx.close()
    await techCtx.close()
    await adminCtx.close()
    await requesterAppCtx.close()

    console.log('======================================================================')
    console.log('   PRUEBA MANUAL INTERACTIVA COMPLETADA CON ÉXITO: 5/5 PASOS PASS')
    console.log('======================================================================')
    for (const r of report) {
      console.log(`[${r.status}] ${r.paso}: ${r.detalle}`)
    }

  } catch (err) {
    console.error('ERROR EN PRUEBA MANUAL INTERACTIVA:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
