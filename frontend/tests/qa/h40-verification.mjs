/**
 * H-40 · Verificación manual con navegador real (headed Chromium), clics reales,
 * escritura secuencial real y captura de evidencias de los 5 puntos + 6 usuarios.
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.env.E2E_DESK_URL ?? 'http://localhost:5173'
const PASSWORD = 'Password123!'
const ARTIFACTS_DIR = 'C:/Users/DEVELOPMENT/.gemini/antigravity/brain/b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'
const OUT = resolve(process.cwd(), '../docs/qa/evidencias-h40')
mkdirSync(OUT, { recursive: true })
mkdirSync(ARTIFACTS_DIR, { recursive: true })

const report = { startedAt: new Date().toISOString(), checks: [], failures: [] }

function check(name, ok, detail = '') {
  const entry = { name, ok: Boolean(ok), detail }
  report.checks.push(entry)
  if (!ok) report.failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`)
}

function saveScreenshot(page, filename) {
  const outPath = resolve(OUT, filename)
  const artPath = resolve(ARTIFACTS_DIR, filename)
  return page.screenshot({ path: outPath, fullPage: false }).then(() => {
    copyFileSync(outPath, artPath)
  })
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
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue|equipo|administracion)/, { timeout: 30000 })
  return { context, page, errors }
}

function assertClean(session, label) {
  const { console: consoleErrors, http, requestFailed } = session.errors
  check(`${label}: 0 errores HTTP 401/403/500 en /api`, http.length === 0, http.join(', '))
  check(`${label}: 0 peticiones fallidas`, requestFailed.length === 0, requestFailed.join(', '))
  check(`${label}: 0 errores en consola F12`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))
}

// Launch headed browser so all interactions are rendered visually
const browser = await chromium.launch({ headless: false })

try {
  // =========================================================================
  // PUNTO 1 & 2 & 3 & 4 & 5: Flujo con tech_dev y ventana paralela lider_dev
  // =========================================================================
  const techDev = await createSession(browser, 'tech_dev')
  await techDev.page.goto(`${BASE}/kanban`)
  await techDev.page.waitForLoadState('networkidle')
  await techDev.page.waitForTimeout(2000)

  const groupText = await techDev.page.getByTestId('technician-group-label').first().textContent().catch(() => '')
  check('Punto 6 (tech_dev): solo ve su cola (Grupo: Desarrollo)', /Desarrollo/.test(groupText ?? ''), groupText ?? '')

  // Read initial notification badge count on tech_dev (desktop sidebar is first in DOM)
  const badgeLocator = techDev.page.getByTestId('notification-badge').first()
  const initialBadgeText = (await badgeLocator.isVisible().catch(() => false))
    ? (await badgeLocator.textContent()) ?? '0'
    : '0'
  const initialBadgeCount = parseInt(initialBadgeText.replace(/\D/g, '') || '0', 10)

  // Open Window 2 with lider_dev
  const liderDev = await createSession(browser, 'lider_dev')
  await liderDev.page.goto(`${BASE}/equipo`)
  await liderDev.page.waitForLoadState('networkidle')
  await liderDev.page.waitForTimeout(1500)

  // Verify Punto 5 on lider_dev (/equipo)
  const totalCard = liderDev.page.getByTestId('team-card-total')
  await totalCard.waitFor({ state: 'visible', timeout: 15000 })
  const totalCardText = (await totalCard.textContent()) ?? ''
  const totalBefore = parseInt(totalCardText.replace(/\D/g, '') || '0', 10)
  check('Punto 5 (lider_dev): /equipo muestra tarjetas de totales por estado', totalBefore > 0, `Total=${totalBefore}`)

  const techRow = liderDev.page.getByTestId('tech-row-tech_dev')
  await techRow.waitFor({ state: 'visible', timeout: 15000 })
  const techRowText = (await techRow.textContent()) ?? ''
  check('Punto 5 (lider_dev): tabla muestra a tech_dev con sus métricas', techRowText.includes('tech_dev'), techRowText.replace(/\s+/g, ' ').trim())

  // Lider_dev creates a ticket using the "+ Crear ticket" button on /equipo
  await liderDev.page.getByTestId('create-ticket-btn').click()
  const createDialog = liderDev.page.getByRole('dialog')
  await createDialog.waitFor({ state: 'visible', timeout: 10000 })

  const uniqueTitle = `H40 Ticket Tiempo Real ${Date.now()}`
  await createDialog.getByTestId('create-ticket-title-input').click()
  await createDialog.getByTestId('create-ticket-title-input').pressSequentially(uniqueTitle, { delay: 15 })
  // Select category 13 (software -> routes to group 1 Desarrollo)
  await createDialog.getByTestId('create-ticket-category-select').selectOption('13')
  await createDialog.getByTestId('create-ticket-description-textarea').click()
  await createDialog.getByTestId('create-ticket-description-textarea').pressSequentially('Ticket creado por lider_dev para verificar SignalR en vivo sin F5.', { delay: 10 })

  const [createRes] = await Promise.all([
    liderDev.page.waitForResponse((r) => r.url().includes('/api/tickets') && r.request().method() === 'POST'),
    createDialog.getByTestId('create-ticket-submit-btn').click(),
  ])
  check('Punto 5 (lider_dev): puede crear tickets desde /equipo (POST /api/tickets -> 201)', createRes.status() === 201)

  // Wait up to 12s on Window 1 (tech_dev) WITHOUT touching anything or pressing F5
  const newTicketCardOnTech = techDev.page.locator('[data-column-id="queue"]').getByText(uniqueTitle).first()
  await newTicketCardOnTech.waitFor({ state: 'visible', timeout: 12000 })
  check('Punto 2 (Tiempo Real Kanban): el nuevo ticket aparece automáticamente en la cola de tech_dev sin F5', await newTicketCardOnTech.isVisible())

  // Wait for notification badge to increment on tech_dev without clicking the bell or pressing F5
  await techDev.page.waitForFunction(
    (prevCount) => {
      const el = document.querySelector('[data-testid="notification-badge"]')
      if (!el) return false
      const n = parseInt((el.textContent || '0').replace(/\D/g, '') || '0', 10)
      return n > prevCount
    },
    initialBadgeCount,
    { timeout: 10000 },
  )
  const afterBadgeText = (await badgeLocator.textContent()) ?? '0'
  const afterBadgeCount = parseInt(afterBadgeText.replace(/\D/g, '') || '0', 10)
  check(
    'Punto 2 (Tiempo Real Campana): el contador rojo de la campana suma +1 automáticamente vía SignalR sin F5',
    afterBadgeCount > initialBadgeCount,
    `${initialBadgeCount} -> ${afterBadgeCount}`,
  )

  await saveScreenshot(techDev.page, '2-tiempo-real-campana-y-kanban.png')

  // Claim ticket #11 on tech_dev and start it (move to En progreso)
  const card11Queue = techDev.page
    .locator('[data-column-id="queue"]')
    .getByText('#11')
    .first()
    .locator('xpath=ancestor::div[@role="article"][1]')
  if ((await card11Queue.count()) > 0) {
    await card11Queue.getByRole('button', { name: /Asignarme/i }).click()
    await techDev.page.locator('[data-column-id="mine"]').getByText('#11').first().waitFor({ timeout: 15000 })
  }

  const card11Mine = techDev.page
    .locator('[data-column-id="mine"]')
    .getByText('#11')
    .first()
    .locator('xpath=ancestor::div[@role="article"][1]')
  if ((await card11Mine.count()) > 0) {
    await card11Mine.getByRole('button', { name: /Iniciar/i }).click()
    await techDev.page.locator('[data-column-id="in_progress"]').getByText('#11').first().waitFor({ timeout: 15000 })
  }

  // Verify on Window 2 (lider_dev /equipo) that tech_dev's row updated in real time via SignalR without F5!
  await liderDev.page.waitForFunction(
    () => {
      const row = document.querySelector('[data-testid="tech-row-tech_dev"]')
      return row && row.textContent && row.textContent.includes('#11')
    },
    null,
    { timeout: 12000 },
  )
  const updatedTechRowText = (await techRow.textContent()) ?? ''
  check(
    'Punto 5 (Tiempo Real Dashboard Líder): /equipo de lider_dev refleja el cambio de estado de tech_dev (#11 En Progreso) sin F5',
    updatedTechRowText.includes('#11'),
    updatedTechRowText.replace(/\s+/g, ' ').trim(),
  )
  await saveScreenshot(liderDev.page, '5-dashboard-lider-tiempo-real.png')

  // =========================================================================
  // PUNTO 1: Bug del Modal de Pendiente (Foco estable al escribir "Hola mundo")
  // =========================================================================
  const card11InProgress = techDev.page
    .locator('[data-column-id="in_progress"]')
    .getByText('#11')
    .first()
    .locator('xpath=ancestor::div[@role="article"][1]')
  await card11InProgress.getByRole('button', { name: /Pausar/i }).click()

  const pendingDialog = techDev.page.getByRole('dialog')
  await pendingDialog.waitFor({ state: 'visible', timeout: 10000 })

  const reasonSelect = pendingDialog.getByTestId('pending-reason-select')
  const commentTextarea = pendingDialog.getByTestId('pending-comment-textarea')

  await reasonSelect.selectOption({ index: 1 })
  await commentTextarea.click()

  // Type "Hola mundo" character by character and check activeElement after each character
  let focusNeverJumped = true
  for (const ch of 'Hola mundo') {
    await techDev.page.keyboard.type(ch, { delay: 40 })
    const isStillFocused = await techDev.page.evaluate(() => {
      return document.activeElement?.getAttribute('data-testid') === 'pending-comment-textarea'
    })
    if (!isStillFocused) {
      focusNeverJumped = false
    }
  }

  const typedValue = await commentTextarea.inputValue()
  check(
    'Punto 1 (Modal de Pendiente): al hacer clic en el textarea y escribir "Hola mundo", el foco NO se mueve al select',
    focusNeverJumped && typedValue === 'Hola mundo',
    `focusStable=${focusNeverJumped}, value="${typedValue}"`,
  )

  await saveScreenshot(techDev.page, '1-modal-pendiente-foco-hola-mundo.png')

  // Confirm putting ticket #11 in Pending so we can test Punto 4 (Pendiente -> Resuelto bloqueado)
  await pendingDialog.getByRole('button', { name: /Confirmar/i }).click()
  await techDev.page.locator('[data-column-id="pending"]').getByText('#11').first().waitFor({ timeout: 15000 })

  // =========================================================================
  // PUNTO 4: Mensajes de Error Visuales (Transiciones bloqueadas Pendiente -> Resuelto)
  // =========================================================================
  const pendingCardEl = techDev.page
    .locator('[data-column-id="pending"]')
    .getByText('#11')
    .first()
    .locator('xpath=ancestor::div[@role="article"][1]')

  // Click the blocked "Resolver" button on the Pending card in Kanban
  const blockedBtn = pendingCardEl.getByTestId('pending-resolve-blocked-trigger')
  await blockedBtn.waitFor({ state: 'visible', timeout: 10000 })
  await blockedBtn.click()

  const exactToast = techDev.page
    .getByTestId('toast-item')
    .getByText('No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.')
    .first()
  await exactToast.waitFor({ state: 'visible', timeout: 10000 })
  check(
    'Punto 4 (Toast en Kanban al intentar pasar de Pendiente a Resuelto): muestra el mensaje exacto en español',
    await exactToast.isVisible(),
  )
  await saveScreenshot(techDev.page, '4-transicion-bloqueada-toast.png')

  // Also check Detail.tsx disabled Resolver button & helper message
  await techDev.page.goto(`${BASE}/tickets/11`)
  await techDev.page.waitForLoadState('networkidle')
  const detailBlockedMsg = techDev.page.getByText(
    'No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.',
  ).first()
  await detailBlockedMsg.waitFor({ state: 'visible', timeout: 10000 })
  const resolveBtnInDetail = techDev.page.getByRole('button', { name: /^Resolver$/ }).first()
  check(
    'Punto 4 (Detalle del Ticket): botón Resolver deshabilitado con explicación exacta',
    (await resolveBtnInDetail.isDisabled()) && (await detailBlockedMsg.isVisible()),
  )
  await saveScreenshot(techDev.page, '4b-detalle-resolver-deshabilitado.png')

  // =========================================================================
  // PUNTO 3: Cerrar sesión y volver a entrar (0 errores 401 en consola)
  // =========================================================================
  await techDev.page.getByTestId('logout-btn').first().click()
  await techDev.page.waitForURL(/\/login/, { timeout: 15000 })

  await techDev.page.locator('input[name="username"]').click()
  await techDev.page.locator('input[name="username"]').fill('tech_dev')
  await techDev.page.locator('input[name="password"]').click()
  await techDev.page.locator('input[name="password"]').fill(PASSWORD)
  await techDev.page.locator('button[type="submit"]').click()
  await techDev.page.waitForURL(/\/(kanban|tickets)/, { timeout: 30000 })
  await techDev.page.goto(`${BASE}/kanban`)
  await techDev.page.waitForLoadState('networkidle')
  await techDev.page.locator('[data-column-id="queue"]').waitFor({ state: 'visible', timeout: 15000 })
  await techDev.page.waitForTimeout(1000)

  check(
    'Punto 3 (Logout y re-login sin 401): 0 errores 401 al cerrar sesión, volver a entrar y cargar Kanban',
    techDev.errors.http.length === 0,
    techDev.errors.http.join(', '),
  )
  await saveScreenshot(techDev.page, '3-relogin-kanban-sin-401.png')

  assertClean(techDev, 'tech_dev')
  assertClean(liderDev, 'lider_dev')
  await techDev.context.close()
  await liderDev.context.close()

  // =========================================================================
  // PUNTO 6: Pruebas manuales con el resto de usuarios (admin_test, lider_bi, tech_bi, tech_sd)
  // =========================================================================

  // 6.1 admin_test
  {
    const admin = await createSession(browser, 'admin_test')
    await admin.page.goto(`${BASE}/administracion`)
    await admin.page.waitForLoadState('networkidle')
    await admin.page.waitForTimeout(1000)
    const bodyText = (await admin.page.locator('body').textContent()) ?? ''
    const seesAll3 =
      bodyText.includes('Desarrollo') && bodyText.includes('BI') && bodyText.includes('Service Desk')
    check('Punto 6 (admin_test): /administracion muestra los 3 grupos con totales', seesAll3)
    await saveScreenshot(admin.page, '6-admin-test-3-grupos.png')
    assertClean(admin, 'admin_test')
    await admin.context.close()
  }

  // 6.2 lider_bi
  {
    const liderBi = await createSession(browser, 'lider_bi')
    await liderBi.page.goto(`${BASE}/equipo`)
    await liderBi.page.waitForLoadState('networkidle')
    await liderBi.page.waitForTimeout(1000)
    const tableText = (await liderBi.page.locator('table').textContent()) ?? ''
    const createBtnVisible = await liderBi.page.getByTestId('create-ticket-btn').isVisible()
    check(
      'Punto 6 (lider_bi): /equipo muestra solo su equipo (tech_bi) y botón Crear ticket',
      tableText.includes('tech_bi') && !tableText.includes('tech_dev') && createBtnVisible,
      tableText.replace(/\s+/g, ' ').trim(),
    )
    await saveScreenshot(liderBi.page, '6-lider-bi-equipo.png')
    assertClean(liderBi, 'lider_bi')
    await liderBi.context.close()
  }

  // 6.3 tech_bi
  {
    const techBi = await createSession(browser, 'tech_bi')
    await techBi.page.goto(`${BASE}/kanban`)
    await techBi.page.waitForLoadState('networkidle')
    await techBi.page.waitForTimeout(1000)
    const label = (await techBi.page.getByTestId('technician-group-label').first().textContent().catch(() => '')) ?? ''
    check('Punto 6 (tech_bi): solo ve su cola (Grupo: BI)', /BI/.test(label) && !/Desarrollo/.test(label), label)
    assertClean(techBi, 'tech_bi')
    await techBi.context.close()
  }

  // 6.4 tech_sd
  {
    const techSd = await createSession(browser, 'tech_sd')
    await techSd.page.goto(`${BASE}/kanban`)
    await techSd.page.waitForLoadState('networkidle')
    await techSd.page.waitForTimeout(1000)
    const label = (await techSd.page.getByTestId('technician-group-label').first().textContent().catch(() => '')) ?? ''
    check('Punto 6 (tech_sd): solo ve su cola (Grupo: Service Desk)', /Service Desk/.test(label), label)
    assertClean(techSd, 'tech_sd')
    await techSd.context.close()
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

console.log(`\n${report.ok ? 'VERIFICACIÓN H-40 OK' : 'VERIFICACIÓN H-40 CON FALLOS'} — ${report.checks.length} comprobaciones, ${report.failures.length} fallos`)
if (report.failures.length) {
  console.log(report.failures.join('\n'))
  process.exit(1)
}
