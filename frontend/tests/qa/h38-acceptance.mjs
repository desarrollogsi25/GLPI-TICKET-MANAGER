/**
 * H-38 · Aceptación con clics reales (Chromium real, no mocks).
 *
 * Recorre la UI como un humano y falla si aparece cualquier 401/403/500/502
 * en /api/**  o un error de consola. Genera capturas y un reporte JSON.
 *
 * Uso:  node tests/qa/h38-acceptance.mjs
 * Requisitos: frontend dev en http://localhost:5173 y API en :8080.
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.env.E2E_DESK_URL ?? 'http://localhost:5173'
const PASSWORD = 'Password123!'
// Fuera de test-results/: Playwright borra ese directorio al inicio de cada suite.
const OUT = resolve(process.cwd(), '../docs/qa/evidencias-h38')
mkdirSync(OUT, { recursive: true })

const report = { startedAt: new Date().toISOString(), checks: [], failures: [] }

function check(name, ok, detail = '') {
  const entry = { name, ok: Boolean(ok), detail }
  report.checks.push(entry)
  if (!ok) report.failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`)
}

async function session(browser, username, password = PASSWORD) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = { console: [], http: [], requestFailed: [] }
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.console.push(msg.text())
  })
  page.on('response', (response) => {
    const status = response.status()
    const url = response.url()
    if (url.includes('/api/') && [401, 403, 500, 502].includes(status)) {
      errors.http.push(`${status} ${new URL(url).pathname}${new URL(url).search}`)
    }
  })
  page.on('requestfailed', (request) => {
    if (request.url().includes('/api/')) {
      errors.requestFailed.push(`${request.method()} ${new URL(request.url()).pathname}`)
    }
  })
  await page.goto(`${BASE}/login`)
  await page.locator('input[name="username"]').fill(username)
  await page.locator('input[name="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue|equipo|administracion)/, { timeout: 30000 })
  return { context, page, errors }
}

function assertClean(session, label) {
  const { console: consoleErrors, http, requestFailed } = session.errors
  check(`${label}: sin errores 401/403/500 en /api`, http.length === 0, http.join(', '))
  check(`${label}: sin peticiones fallidas`, requestFailed.length === 0, requestFailed.join(', '))
  check(`${label}: sin errores de consola`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))
}

const browser = await chromium.launch()

try {
  // ── 1. TECH_DEV ────────────────────────────────────────────────────────────
  {
    const { context, page, errors } = await session(browser, 'tech_dev')

    await page.goto(`${BASE}/kanban`)
    await page.waitForLoadState('networkidle')
    const groupLabel = page.getByTestId('technician-group-label').first()
    const groupText = await groupLabel.textContent().catch(() => '')
    check('tech_dev: el Kanban muestra solo el grupo Desarrollo', /Desarrollo/.test(groupText ?? ''), groupText ?? 'sin etiqueta')

    // Campana de notificaciones: abrir y cerrar con clic real.
    await page.getByTestId('notification-bell').first().click()
    const panel = page.getByTestId('notification-panel').first()
    await panel.waitFor({ state: 'visible', timeout: 10000 })
    check('tech_dev: la campana abre el panel de notificaciones', await panel.isVisible())
    await page.screenshot({ path: `${OUT}/01-tech-dev-campana.png`, fullPage: true })
    await page.keyboard.press('Escape')

    // Cola del grupo → asignarme #11
    await page.goto(`${BASE}/queue`)
    await page.waitForResponse((r) => r.url().includes('/api/tickets/by-group') && r.status() === 200)
    const queueCard = page
      .getByText('#11')
      .first()
      .locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
    check('tech_dev: el ticket #11 está en la cola de Desarrollo', await queueCard.count() > 0)
    await queueCard.getByRole('button', { name: /Asignarme/i }).click()
    await page.getByText(/Ticket asignado correctamente/i).first().waitFor({ timeout: 15000 })
    check('tech_dev: #11 se asigna con un clic', true)

    // Kanban → Iniciar (En Progreso)
    await page.goto(`${BASE}/kanban`)
    await page.waitForLoadState('networkidle')
    const mineCard = page
      .locator('[data-column-id="mine"]')
      .getByText('#11')
      .first()
      .locator('xpath=ancestor::div[.//button][1]')
    await mineCard.getByRole('button', { name: /Iniciar|En progreso|Empezar/i }).first().click()
    await page.locator('[data-column-id="in_progress"]').getByText('#11').first().waitFor({ timeout: 15000 })
    check('tech_dev: #11 pasa a En Progreso', true)

    // Detalle → Pendiente (modal obligatorio)
    await page.goto(`${BASE}/tickets/11`)
    await page.waitForLoadState('networkidle')
    await page.getByTestId('pending-ticket-btn').first().click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 10000 })
    const reason = dialog.locator('select[data-testid="pending-reason-select"]').first()
    const comment = dialog.locator('textarea[data-testid="pending-comment-textarea"]').first()
    const confirm = dialog.getByRole('button', { name: /Confirmar/i }).first()
    check('Pendiente: el modal exige motivo y comentario (Confirmar deshabilitado)', await confirm.isDisabled())
    await reason.selectOption({ index: 1 })
    check('Pendiente: solo con motivo sigue deshabilitado', await confirm.isDisabled())
    const pendingComment = 'H38 QA: en espera de pieza de proveedor (clic real)'
    await comment.fill(pendingComment)
    check('Pendiente: con motivo + comentario se habilita', await confirm.isEnabled())
    await page.screenshot({ path: `${OUT}/02-tech-dev-modal-pendiente.png`, fullPage: true })
    const [pendingResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/tickets/11/pending') && r.status() === 200),
      confirm.click(),
    ])
    check('Pendiente: POST /pending responde 200', pendingResponse.status() === 200)

    await page.getByText(pendingComment).first().waitFor({ timeout: 15000 })
    check('Pendiente: el comentario aparece en el seguimiento', true)

    const resolveButton = page.getByRole('button', { name: /^Resolver$/ }).first()
    const hint = page.getByText(/usa «Retomar» para volver a En Progreso antes de resolverlo/i).first()
    await hint.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    check('Pendiente → Resuelto bloqueado: botón Resolver deshabilitado', await resolveButton.isDisabled())
    check('Pendiente → Resuelto bloqueado: aviso en español visible', await hint.isVisible())
    await page.screenshot({ path: `${OUT}/03-tech-dev-pendiente-bloqueado.png`, fullPage: true })

    // Kanban → Retomar → Resolver
    await page.goto(`${BASE}/kanban`)
    await page.waitForLoadState('networkidle')
    const pendingCard = page
      .locator('[data-column-id="pending"]')
      .getByText('#11')
      .first()
      .locator('xpath=ancestor::div[.//button][1]')
    await pendingCard.getByRole('button', { name: /Retomar/i }).click()
    await page.locator('[data-column-id="in_progress"]').getByText('#11').first().waitFor({ timeout: 15000 })
    check('Pendiente: «Retomar» devuelve el ticket a En Progreso', true)

    await page.goto(`${BASE}/tickets/11`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /^Resolver$/ }).first().click()
    const resolveDialog = page.getByRole('dialog')
    await resolveDialog.waitFor({ state: 'visible', timeout: 10000 })
    await resolveDialog.locator('textarea').first().fill('H38 QA: solución aplicada tras reanudar (clic real)')
    await resolveDialog.getByRole('button', { name: /^Resolver$/ }).last().click()
    await page.getByText(/Ticket resuelto/i).first().waitFor({ timeout: 20000 })
    check('Resuelto: el ticket se resuelve tras reanudar', true)
    await page.screenshot({ path: `${OUT}/04-tech-dev-resuelto.png`, fullPage: true })

    await page.goto(`${BASE}/kanban`)
    await page.waitForLoadState('networkidle')
    const inResolved = await page.locator('[data-column-id="resolved"]').getByText('#11').first().isVisible()
    check('Resuelto: #11 aparece en la columna Resuelto', inResolved)

    assertClean({ errors }, 'tech_dev')
    await context.close()
  }

  // ── 2. TECH_BI ─────────────────────────────────────────────────────────────
  {
    const { context, page, errors } = await session(browser, 'tech_bi')
    await page.goto(`${BASE}/kanban`)
    await page.waitForLoadState('networkidle')
    const label = await page.getByTestId('technician-group-label').first().textContent().catch(() => '')
    check('tech_bi: solo ve el grupo BI', /BI/.test(label ?? '') && !/Desarrollo|Service Desk/.test(label ?? ''), label ?? '')
    const descriptor = page.getByLabel('Seleccionar grupo de soporte')
    if (await descriptor.isVisible().catch(() => false)) {
      const options = await descriptor.locator('option').allTextContents()
      check('tech_bi: el selector no ofrece otros grupos', options.length === 1 && options[0] === 'BI', options.join(','))
    }
    const queueVisible = await page.locator('[data-column-id="queue"]').isVisible()
    check('tech_bi: el Kanban carga sin errores', queueVisible)
    await page.screenshot({ path: `${OUT}/05-tech-bi-kanban.png`, fullPage: true })
    assertClean({ errors }, 'tech_bi')
    await context.close()
  }

  // ── 3. LIDER_DEV → /equipo ─────────────────────────────────────────────────
  {
    const { context, page, errors } = await session(browser, 'lider_dev')
    await page.goto(`${BASE}/equipo`)
    await page.waitForLoadState('networkidle')
    const table = page.locator('table')
    await table.waitFor({ timeout: 20000 })
    const text = (await table.textContent()) ?? ''
    check('lider_dev: /equipo lista a tech_dev', text.includes('tech_dev'), text.replace(/\s+/g, ' ').trim())
    check('lider_dev: /equipo no muestra "Error al cargar"', !text.includes('Sin datos de equipo'))
    await page.screenshot({ path: `${OUT}/06-lider-dev-equipo.png`, fullPage: true })
    assertClean({ errors }, 'lider_dev')
    await context.close()
  }

  // ── 4. ADMIN_TEST → /administracion ────────────────────────────────────────
  {
    const { context, page, errors } = await session(browser, 'admin_test')
    await page.goto(`${BASE}/administracion`)
    await page.waitForLoadState('networkidle')
    const body = (await page.locator('body').textContent()) ?? ''
    check('admin_test: /administracion muestra Desarrollo', body.includes('Desarrollo'))
    check('admin_test: /administracion muestra BI', body.includes('BI'))
    check('admin_test: /administracion muestra Service Desk', body.includes('Service Desk'))
    await page.screenshot({ path: `${OUT}/07-admin-3-grupos.png`, fullPage: true })
    assertClean({ errors }, 'admin_test')
    await context.close()
  }

  // ── 5. ENRUTAMIENTO: categoría "software" → Desarrollo ─────────────────────
  let routedTicketId = 0
  {
    const requester = await session(browser, 'user_test')
    const title = `H38 QA software routing ${Date.now()}`
    const created = await requester.page.evaluate(async (ticketTitle) => {
      const stored = JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}')
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.state?.accessToken}` },
        // 13 = categoría "software" → regla H38 Route Desarrollo (grupo 1)
        body: JSON.stringify({ title: ticketTitle, description: 'Verificación de enrutamiento H-38.', urgency: 3, categoryId: 13 }),
      })
      return { status: response.status, body: await response.json() }
    }, title)
    check('user_test: puede crear un ticket (201)', created.status === 201, JSON.stringify(created.body))
    routedTicketId = created.body?.ticketId ?? 0
    await requester.context.close()
  }
  {
    const tech = await session(browser, 'tech_dev')
    await tech.page.goto(`${BASE}/queue`)
    await tech.page.waitForResponse((r) => r.url().includes('/api/tickets/by-group') && r.status() === 200)
    const visible = await tech.page.getByText(`#${routedTicketId}`).first().isVisible({ timeout: 15000 }).catch(() => false)
    check(
      `Enrutamiento: el ticket #${routedTicketId} de categoría "software" aparece en la cola de Desarrollo`,
      visible,
    )
    await tech.page.screenshot({ path: `${OUT}/08-routing-software-desarrollo.png`, fullPage: true })
    assertClean({ errors: tech.errors }, 'routing')
    await tech.context.close()
  }
} catch (error) {
  report.failures.push(`Excepción: ${error?.message ?? error}`)
  console.error(error)
} finally {
  report.finishedAt = new Date().toISOString()
  report.ok = report.failures.length === 0
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
  await browser.close()
}

console.log(`\n${report.ok ? 'ACEPTACIÓN OK' : 'ACEPTACIÓN CON FALLOS'} — ${report.checks.length} comprobaciones, ${report.failures.length} fallos`)
if (report.failures.length) {
  console.log(report.failures.join('\n'))
  process.exit(1)
}
