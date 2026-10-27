/**
 * H-45 · Verificación de la Consola de Supervisión en Tiempo Real del Líder.
 * - Validación de Section A: Panel de KPIs (Activos, En Pausa, Resueltos Hoy, MTTR, Estancados) con NumberTicker.
 * - Validación de Section B: Tabla de Carga de Trabajo por Técnico con Última Actividad y alertas ámbar/rojo.
 * - Validación de Section C: Tablero de Tickets del Grupo con filtros por Técnico y Estado, y comentarios de pausa con tooltip.
 * - Prueba de Tiempo Real con SignalR (tech_dev pausa ticket -> lider_dev ve actualización en vivo sin F5).
 * - Prueba de Aislamiento por Grupo (lider_bi solo ve tickets del grupo BI).
 * - Cero errores de consola F12 y cero códigos HTTP 401/403/500.
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.env.E2E_DESK_URL ?? 'http://localhost:5173'
const PASSWORD = 'Password123!'
const ARTIFACTS_DIR = 'C:/Users/DEVELOPMENT/.gemini/antigravity/brain/b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'
const OUT = resolve(process.cwd(), '../docs/qa/evidencias-h45')
mkdirSync(OUT, { recursive: true })
mkdirSync(ARTIFACTS_DIR, { recursive: true })

const report = { startedAt: new Date().toISOString(), checks: [], failures: [] }

function check(name, ok, detail = '') {
  const entry = { name, ok: Boolean(ok), detail }
  report.checks.push(entry)
  if (!ok) report.failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`)
}

async function saveScreenshot(page, filename) {
  const outPath = resolve(OUT, filename)
  const artPath = resolve(ARTIFACTS_DIR, filename)
  await page.screenshot({ path: outPath, fullPage: false })
  copyFileSync(outPath, artPath)
  console.log(`[CAPTURA GUARDADA]: ${filename}`)
}

async function createSession(browser, username, password = PASSWORD) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = { console: [], http: [], requestFailed: [] }

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.console.push(msg.text())
    }
  })
  page.on('response', (response) => {
    const status = response.status()
    const url = response.url()
    if (url.includes('/api/') && [401, 403, 500, 502].includes(status)) {
      errors.http.push(`${status} ${new URL(url).pathname}${new URL(url).search}`)
    }
  })
  page.on('requestfailed', (request) => {
    const errText = request.failure()?.errorText ?? ''
    if (request.url().includes('/api/') && !errText.includes('ERR_ABORTED')) {
      errors.requestFailed.push(`${request.method()} ${new URL(request.url()).pathname} (${errText})`)
    }
  })

  await page.goto(`${BASE}/login`)
  await page.locator('input[name="username"]').click()
  await page.locator('input[name="username"]').fill(username)
  await page.locator('input[name="password"]').click()
  await page.locator('input[name="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForLoadState('networkidle')

  return { context, page, errors, username }
}

function assertClean(session, role) {
  check(`${role}: 0 errores HTTP 401/403/500 en /api`, session.errors.http.length === 0, session.errors.http.join(', '))
  check(`${role}: 0 peticiones fallidas`, session.errors.requestFailed.length === 0, session.errors.requestFailed.join(', '))
  check(`${role}: 0 errores en consola F12`, session.errors.console.length === 0, session.errors.console.join(', '))
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  try {
    console.log('\n--- 1. INICIANDO SESIÓN DE LÍDER DESARROLLO (lider_dev) ---')
    const liderDev = await createSession(browser, 'lider_dev')

    // Navegar a la Consola de Supervisión (/equipo)
    await liderDev.page.goto(`${BASE}/equipo`)
    await liderDev.page.waitForSelector('[data-testid="team-status-cards"]', { timeout: 15000 })
    await liderDev.page.waitForSelector('[data-testid="team-technicians-table"]', { timeout: 15000 })
    await liderDev.page.waitForSelector('[data-testid="group-tickets-table"]', { timeout: 15000 })

    console.log('\n--- 2. VERIFICACIÓN SECCIÓN A: PANEL DE KPIS ---')
    const activeCard = await liderDev.page.locator('[data-testid="team-card-active"]').textContent()
    const pausedCard = await liderDev.page.locator('[data-testid="team-card-paused"]').textContent()
    const resolvedCard = await liderDev.page.locator('[data-testid="team-card-resolved-today"]').textContent()
    const mttrCard = await liderDev.page.locator('[data-testid="team-card-mttr"]').textContent()
    const stalledCard = await liderDev.page.locator('[data-testid="team-card-stalled"]').textContent()

    check('Sección A: Tarjeta Tickets Activos presente', activeCard.includes('Tickets Activos'), activeCard.replace(/\s+/g, ' ').trim())
    check('Sección A: Tarjeta Tickets en Pausa presente', pausedCard.includes('Tickets en Pausa'), pausedCard.replace(/\s+/g, ' ').trim())
    check('Sección A: Tarjeta Resueltos Hoy presente', resolvedCard.includes('Resueltos Hoy'), resolvedCard.replace(/\s+/g, ' ').trim())
    check('Sección A: Tarjeta MTTR presente', mttrCard.includes('MTTR') && mttrCard.includes('h'), mttrCard.replace(/\s+/g, ' ').trim())
    check('Sección A: Tarjeta Tickets Estancados presente', stalledCard.includes('Estancados'), stalledCard.replace(/\s+/g, ' ').trim())

    console.log('\n--- 3. VERIFICACIÓN SECCIÓN B: TABLA DE CARGA DE TRABAJO ---')
    const techRowTechDev = await liderDev.page.locator('[data-testid="tech-row-tech_dev"]')
    const techDevExists = await techRowTechDev.isVisible()
    check('Sección B: tech_dev visible en la tabla de técnicos', techDevExists)

    const techDevText = await techRowTechDev.textContent()
    check('Sección B: tech_dev muestra última actividad', techDevText.includes('hace') || techDevText.includes('Activo') || techDevText.includes('Sin actividad'), techDevText.replace(/\s+/g, ' ').trim())

    // Captura 1: KPI y Carga de Trabajo
    await saveScreenshot(liderDev.page, 'h45-1-kpi-and-workload-desktop.png')

    console.log('\n--- 4. VERIFICACIÓN SECCIÓN C: TABLERO DE TICKETS DEL GRUPO Y FILTROS ---')
    const totalTicketsBeforeFilter = await liderDev.page.locator('[data-testid^="group-ticket-row-"]').count()
    check('Sección C: Tablero muestra tickets del grupo', totalTicketsBeforeFilter > 0, `Total tickets: ${totalTicketsBeforeFilter}`)

    // Probar filtro por técnico: seleccionar tech_dev (userId 14)
    const techSelect = liderDev.page.locator('[data-testid="filter-technician-select"]')
    await techSelect.selectOption('14') // tech_dev
    await liderDev.page.waitForTimeout(300)

    const techDevFilteredCount = await liderDev.page.locator('[data-testid^="group-ticket-row-"]').count()
    check('Sección C: Filtro por técnico funcional (tech_dev)', techDevFilteredCount > 0 && techDevFilteredCount <= totalTicketsBeforeFilter, `Filtrados: ${techDevFilteredCount}`)

    // Probar filtro por estado: Pendiente (4)
    const statusSelect = liderDev.page.locator('[data-testid="filter-status-select"]')
    await statusSelect.selectOption('4') // Pendiente
    await liderDev.page.waitForTimeout(300)

    const pendingFilteredCount = await liderDev.page.locator('[data-testid^="group-ticket-row-"]').count()
    check('Sección C: Filtro por estado funcional (Pendiente)', pendingFilteredCount > 0, `Tickets pendientes de tech_dev: ${pendingFilteredCount}`)

    // Verificar que el último comentario de pausa se muestra en la fila
    const firstPendingComment = await liderDev.page.locator('[data-testid^="group-ticket-comment-"]').first().textContent()
    check('Sección C: Comentario de pausa visible en ticket pendiente', firstPendingComment && firstPendingComment.length > 3, firstPendingComment)

    // Captura 2: Tablero de Tickets con filtros y comentario de pausa
    await saveScreenshot(liderDev.page, 'h45-2-group-tickets-board.png')

    // Resetear filtros para ver todos
    await techSelect.selectOption('all')
    await statusSelect.selectOption('all')
    await liderDev.page.waitForTimeout(300)

    console.log('\n--- 5. PRUEBA DE TIEMPO REAL CON SIGNALR (tech_dev pausa ticket -> lider_dev ve en vivo) ---')
    const techDev = await createSession(browser, 'tech_dev')
    await techDev.page.goto(`${BASE}/kanban`)
    await techDev.page.waitForLoadState('networkidle')
    await techDev.page.locator('[data-testid="connection-indicator"]').first().waitFor({ state: 'visible', timeout: 30000 })

    const pauseNote = `Pausa en vivo H45 [${Date.now()}]`
    console.log(`[TIEMPO REAL]: Preparando ticket para pausar con comentario: "${pauseNote}"...`)

    // Si tech_dev tiene un ticket en 'pending', le damos a 'Retomar' para pasarlo a 'in_progress'
    const pendingColumn = techDev.page.locator('[data-column-id="pending"]')
    const retomarBtn = pendingColumn.locator('button:has-text("Retomar")').first()
    
    if (await retomarBtn.isVisible().catch(() => false)) {
      console.log('[TIEMPO REAL]: Ticket en pending encontrado, retomando a progreso...')
      await retomarBtn.click()
      await techDev.page.waitForTimeout(1000)
    } else {
      // Si hay ticket en assigned, le damos a Iniciar
      const assignedColumn = techDev.page.locator('[data-column-id="assigned"]')
      const iniciarBtn = assignedColumn.locator('button:has-text("Iniciar")').first()
      if (await iniciarBtn.isVisible().catch(() => false)) {
        console.log('[TIEMPO REAL]: Iniciando ticket asignado...')
        await iniciarBtn.click()
        await techDev.page.waitForTimeout(1000)
      }
    }

    // Ahora en in_progress, le damos a 'Pausar'
    const inProgressColumn = techDev.page.locator('[data-column-id="in_progress"]')
    const pausarBtn = inProgressColumn.locator('button:has-text("Pausar")').first()
    await pausarBtn.waitFor({ state: 'visible', timeout: 15000 })
    await pausarBtn.click()

    // Manejar modal de pausa (PendingTicketDialog)
    const pendingDialog = techDev.page.getByRole('dialog')
    await pendingDialog.waitFor({ state: 'visible', timeout: 10000 })
    await pendingDialog.getByTestId('pending-reason-select').selectOption({ index: 1 })

    const commentInput = pendingDialog.getByTestId('pending-comment-textarea')
    await commentInput.click()
    await commentInput.fill(pauseNote)

    await pendingDialog.getByRole('button', { name: /Confirmar/i }).click()
    await pendingDialog.waitFor({ state: 'hidden', timeout: 10000 })
    console.log('[TIEMPO REAL]: Ticket pausado con éxito en la sesión de tech_dev.')

    // VERIFICACIÓN EN LA SESIÓN DE LÍDER (liderDev) SIN F5:
    console.log('[TIEMPO REAL]: Verificando actualización automática en la Consola del Líder...')
    await liderDev.page.bringToFront()

    let realTimeUpdated = false
    const startTime = Date.now()

    while (Date.now() - startTime < 15000) {
      const pageText = await liderDev.page.evaluate(() => document.body.innerText)
      if (pageText.includes(pauseNote)) {
        realTimeUpdated = true
        break
      }
      await liderDev.page.waitForTimeout(500)
    }

    check(
      'Sección C (Tiempo Real): lider_dev recibe actualización y comentario de pausa vía SignalR sin F5',
      realTimeUpdated,
      `Comentario detectado en vivo: "${pauseNote}"`,
    )

    // Captura 3: Consola de Supervisión en vivo con el ticket pausado
    await saveScreenshot(liderDev.page, 'h45-3-realtime-supervision-console.png')

    console.log('\n--- 6. VERIFICACIÓN DE AISLAMIENTO POR GRUPO (lider_bi) ---')
    const liderBi = await createSession(browser, 'lider_bi')
    await liderBi.page.goto(`${BASE}/equipo`)
    await liderBi.page.waitForSelector('[data-testid="team-status-cards"]', { timeout: 15000 })
    await liderBi.page.waitForSelector('[data-testid="group-tickets-table"]', { timeout: 15000 })

    const biHeaderText = await liderBi.page.locator('h1, [data-testid="page-header"]').textContent()
    const biTableText = await liderBi.page.locator('[data-testid="team-technicians-table"]').textContent()

    check('Aislamiento: lider_bi tiene acceso a su grupo', biHeaderText.includes('Consola de Supervisión') || biHeaderText.includes('Mi Equipo'))
    check('Aislamiento: lider_bi NO ve a los técnicos de Desarrollo', !biTableText.includes('tech_dev'))

    console.log('\n--- 7. AUDITORÍA DE CONSOLA Y RED ---')
    assertClean(liderDev, 'lider_dev')
    assertClean(techDev, 'tech_dev')
    assertClean(liderBi, 'lider_bi')

    // Cerrar contextos
    await liderDev.context.close()
    await techDev.context.close()
    await liderBi.context.close()

  } finally {
    await browser.close()
  }

  // Guardar reporte JSON
  report.finishedAt = new Date().toISOString()
  report.success = report.failures.length === 0
  writeFileSync(resolve(OUT, 'report.json'), JSON.stringify(report, null, 2), 'utf-8')

  console.log(`\n========================================`)
  console.log(`TOTAL CHECKS: ${report.checks.length} | FAILURES: ${report.failures.length}`)
  console.log(`STATUS: ${report.success ? 'APPROVED 🟢' : 'FAILED 🔴'}`)
  console.log(`========================================\n`)

  if (!report.success) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
