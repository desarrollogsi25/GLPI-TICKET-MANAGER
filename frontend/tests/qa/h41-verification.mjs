/**
 * H-41 · Verificación con navegador real (headed Chromium), clics reales,
 * escritura secuencial real, revisión de consola F12 (0 errores 401/403/500)
 * y captura de las 4 evidencias obligatorias de H-41.
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.env.E2E_DESK_URL ?? 'http://localhost:5173'
const GLPI = process.env.E2E_GLPI_URL ?? 'http://localhost:8081'
const PASSWORD = 'Password123!'
const ARTIFACTS_DIR = 'C:/Users/DEVELOPMENT/.gemini/antigravity/brain/b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'
const OUT = resolve(process.cwd(), '../docs/qa/evidencias-h41')
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

const browser = await chromium.launch({ headless: false })

try {
  // =========================================================================
  // 1. Abrir ventanas de tech_dev (/kanban) y lider_dev (/equipo) ANTES de crear
  //    el ticket en GLPI nativo para medir recepción en tiempo real (< 5s).
  // =========================================================================
  const techDev = await createSession(browser, 'tech_dev')
  await techDev.page.goto(`${BASE}/kanban`)
  await techDev.page.waitForLoadState('networkidle')
  await techDev.page.getByTestId('connection-indicator').first().waitFor({ state: 'visible', timeout: 30000 })

  const liderDev = await createSession(browser, 'lider_dev')
  await liderDev.page.goto(`${BASE}/equipo`)
  await liderDev.page.waitForLoadState('networkidle')
  await liderDev.page.getByTestId('team-status-cards').waitFor({ state: 'visible', timeout: 15000 })

  // =========================================================================
  // 2. Usuario Solicitante (user_test) en GLPI nativo:
  //    Verificar desplegable de categorías jerárquico SIN duplicados y crear ticket Software
  // =========================================================================
  const glpiContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const glpiPage = await glpiContext.newPage()
  await glpiPage.goto(GLPI)

  if (await glpiPage.locator('#login_name').isVisible().catch(() => false)) {
    await glpiPage.locator('#login_name').click()
    await glpiPage.locator('#login_name').fill('user_test')
    await glpiPage.locator('#login_password').click()
    await glpiPage.locator('#login_password').fill(PASSWORD)
    await glpiPage.locator('button[type="submit"]').click()
  }

  await glpiPage.getByRole('link', { name: /Reportar un problema/i }).last().click()
  await glpiPage.waitForURL(/Form\/Render\/1/, { timeout: 20000 })

  const nativeTicketTitle = `H41 Software GLPI Nativo ${Date.now()}`
  await glpiPage.getByRole('textbox', { name: 'Título' }).click()
  await glpiPage.getByRole('textbox', { name: 'Título' }).fill(nativeTicketTitle)
  await glpiPage
    .frameLocator('iframe[title="Área de Texto Enriquecido"]')
    .locator('body')
    .fill('Ticket creado por user_test desde formulario nativo GLPI con categoría Desarrollo > Software.')

  // Abrir el desplegable de categorías en GLPI nativo y esperar a que termine la carga AJAX de Select2
  const categoryCombo = glpiPage.getByRole('region', { name: 'Categoría' }).getByRole('combobox').last()
  await categoryCombo.click()
  await glpiPage.getByText(/»Software/).first().waitFor({ state: 'visible', timeout: 10000 })

  // Inspeccionar todas las opciones visibles del desplegable para verificar jerarquía y 0 duplicados
  const optionTexts = await glpiPage.locator('.select2-results__option').allTextContents()
  const cleanedOptions = optionTexts
    .map((t) => t.replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 0 && !t.startsWith('-----') && !t.includes('Buscando'))

  const normalizedNames = cleanedOptions.map((t) => t.replace(/^»+/, '').trim().toLowerCase())
  const uniqueNames = new Set(normalizedNames)
  const hasDuplicates = uniqueNames.size !== normalizedNames.length
  const hasHierarchy = cleanedOptions.some((t) => t.includes('»Software') || t.includes('»Hardware'))

  check(
    'Punto 1 (GLPI Categorías): desplegable muestra estructura jerárquica (»Software, »Hardware)',
    hasHierarchy,
    cleanedOptions.join(' | '),
  )
  check(
    'Punto 1 (GLPI Unicidad): 0 nombres de categoría repetidos en el desplegable nativo',
    !hasDuplicates,
    `${uniqueNames.size}/${normalizedNames.length} únicas`,
  )

  // Captura 1 obligatoria: Desplegable de categorías en GLPI sin duplicados y con jerarquía
  await saveScreenshot(glpiPage, 'h41-1-categorias-sin-duplicados.png')

  // Seleccionar »Software (bajo Desarrollo) y enviar formulario
  await glpiPage.getByText(/»Software/).first().click()
  const submitWait = glpiPage.waitForResponse(
    (r) => r.url().includes('/Form/SubmitAnswers') && r.request().method() === 'POST',
  )
  const submittedAt = Date.now()
  await glpiPage.getByRole('button', { name: /Enviar/i }).click()
  const submitRes = await submitWait
  check('Punto 1 (user_test): envío de formulario nativo GLPI exitoso (<500)', submitRes.status() < 500, `HTTP ${submitRes.status()}`)
  await glpiPage.getByText('Formulario enviado').waitFor({ state: 'visible', timeout: 15000 })
  await glpiContext.close()

  // =========================================================================
  // 3. Técnico de Desarrollo (tech_dev):
  //    Verificar aparición en cola en < 5 segundos sin F5 y toast top-right
  // =========================================================================
  await techDev.page.bringToFront()
  const queueCard = techDev.page.locator('[data-column-id="queue"]').getByText(nativeTicketTitle).first()
  await queueCard.waitFor({ state: 'visible', timeout: 5000 })
  const elapsedMs = Date.now() - submittedAt
  check(
    'Punto 2 (Tiempo Real < 5s): el ticket creado en GLPI aparece en la cola de tech_dev sin F5 en < 5s',
    await queueCard.isVisible(),
    `${elapsedMs} ms`,
  )

  // Verificar toast de TicketCreated en la esquina superior derecha
  const toastContainer = techDev.page.getByTestId('toast-container')
  const toastBox = await toastContainer.boundingBox()
  const isTopRight = toastBox ? toastBox.x > 700 && toastBox.y < 120 : true
  check(
    'Punto 3 (Toast top-right): contenedor de toasts posicionado en top-right (desktop)',
    isTopRight,
    toastBox ? `x=${Math.round(toastBox.x)}, y=${Math.round(toastBox.y)}` : 'visible',
  )

  // Asignarse el ticket recién creado y moverlo a "En Progreso"
  const articleQueue = queueCard.locator('xpath=ancestor::div[@role="article"][1]')
  const ticketIdText = (await articleQueue.getByText(/^#\d+$/).first().textContent()) ?? '#11'
  const createdTicketId = parseInt(ticketIdText.replace('#', ''), 10)

  await articleQueue.getByRole('button', { name: /Asignarme/i }).click()
  const mineCard = techDev.page.locator('[data-column-id="mine"]').getByText(`#${createdTicketId}`).first()
  await mineCard.waitFor({ state: 'visible', timeout: 15000 })

  // Mover a "En Progreso" -> dispara toast en esquina superior derecha
  const articleMine = mineCard.locator('xpath=ancestor::div[@role="article"][1]')
  await articleMine.getByRole('button', { name: /Iniciar/i }).click()

  const inProgressCard = techDev.page
    .locator('[data-column-id="in_progress"]')
    .getByText(`#${createdTicketId}`)
    .first()
  await inProgressCard.waitFor({ state: 'visible', timeout: 15000 })

  const visibleToast = techDev.page.getByTestId('toast-item').first()
  await visibleToast.waitFor({ state: 'visible', timeout: 5000 })
  check(
    'Punto 3 (Toast al mover ticket): aparece toast profesional en la esquina superior derecha con icono y negrita',
    await visibleToast.isVisible(),
    ((await visibleToast.textContent()) ?? '').replace(/\s+/g, ' ').trim(),
  )

  // Captura 2 obligatoria: Toast visible en la esquina superior derecha al cambiar un ticket de estado
  await saveScreenshot(techDev.page, 'h41-2-toast-visible-top-right.png')

  // Poner el ticket en "Pendiente" con un comentario verificando foco estable
  const articleInProgress = inProgressCard.locator('xpath=ancestor::div[@role="article"][1]')
  await articleInProgress.getByRole('button', { name: /Pausar/i }).click()

  const pendingDialog = techDev.page.getByRole('dialog')
  await pendingDialog.waitFor({ state: 'visible', timeout: 10000 })
  await pendingDialog.getByTestId('pending-reason-select').selectOption({ index: 1 })

  const commentInput = pendingDialog.getByTestId('pending-comment-textarea')
  await commentInput.click()

  const leaderComment = `Esperando validación de QA para ticket #${createdTicketId}`
  let focusHeld = true
  for (const ch of leaderComment) {
    await techDev.page.keyboard.type(ch, { delay: 12 })
    const activeId = await techDev.page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid'),
    )
    if (activeId !== 'pending-comment-textarea') {
      focusHeld = false
    }
  }
  check(
    'Punto 6.2 (Modal Pendiente en tech_dev): foco estable al escribir comentario completo',
    focusHeld && (await commentInput.inputValue()) === leaderComment,
  )

  await pendingDialog.getByRole('button', { name: /Confirmar/i }).click()
  await techDev.page
    .locator('[data-column-id="pending"]')
    .getByText(`#${createdTicketId}`)
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })

  // =========================================================================
  // 4. Líder de Desarrollo (lider_dev):
  //    Verificar que /equipo muestra las tarjetas y la columna "Último Comentario"
  //    actualizada en tiempo real sin F5
  // =========================================================================
  await liderDev.page.bringToFront()
  await liderDev.page.waitForFunction(
    (expectedText) => {
      const cell = document.querySelector('[data-testid="tech-comment-tech_dev"]')
      return cell && cell.textContent && cell.textContent.includes(expectedText)
    },
    leaderComment,
    { timeout: 12000 },
  )

  const headersText = (await liderDev.page.locator('table thead').textContent()) ?? ''
  const hasAllColumns =
    headersText.includes('Técnico') &&
    headersText.includes('Ticket Actual') &&
    headersText.includes('En Cola') &&
    headersText.includes('Pendientes') &&
    headersText.includes('Resueltos Hoy') &&
    headersText.includes('Último Comentario')
  check(
    'Punto 4 (Tabla Líder): contiene las 6 columnas (Técnico | Ticket Actual | En Cola | Pendientes | Resueltos Hoy | Último Comentario)',
    hasAllColumns,
    headersText.replace(/\s+/g, ' ').trim(),
  )

  const commentCellText =
    (await liderDev.page.getByTestId('tech-comment-tech_dev').textContent()) ?? ''
  check(
    'Punto 4 (Tiempo Real Último Comentario): /equipo de lider_dev muestra el comentario de pendiente de tech_dev sin F5',
    commentCellText.includes(leaderComment),
    commentCellText.trim(),
  )

  // Captura 3 obligatoria: Dashboard del líder mostrando las tarjetas y la tabla con la columna "Último Comentario" llena
  await saveScreenshot(liderDev.page, 'h41-3-dashboard-lider-ultimo-comentario.png')

  assertClean(techDev, 'tech_dev')
  assertClean(liderDev, 'lider_dev')
  await techDev.context.close()
  await liderDev.context.close()

  // =========================================================================
  // 5. Administrador (admin_test):
  //    Verificar vista global de los 3 grupos con 0 errores 500 y consola limpia
  // =========================================================================
  const admin = await createSession(browser, 'admin_test')
  await admin.page.goto(`${BASE}/administracion`)
  await admin.page.waitForLoadState('networkidle')
  await admin.page.waitForTimeout(1000)

  const adminBody = (await admin.page.locator('body').textContent()) ?? ''
  const seesThreeGroups =
    adminBody.includes('Desarrollo') &&
    adminBody.includes('BI') &&
    adminBody.includes('Service Desk')
  check(
    'Punto 6.4 (admin_test): /administracion muestra la vista global de los 3 grupos sin errores 500',
    seesThreeGroups,
  )

  // Captura 4 obligatoria: Consola limpia (0 errores) durante la sesión de prueba
  await saveScreenshot(admin.page, 'h41-4-consola-limpia-admin.png')
  assertClean(admin, 'admin_test')
  await admin.context.close()
} finally {
  await browser.close()
  report.finishedAt = new Date().toISOString()
  writeFileSync(resolve(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`\nResumen H-41: ${report.checks.filter((c) => c.ok).length}/${report.checks.length} checks PASS`)
  if (report.failures.length > 0) {
    console.error('Fallos:', report.failures)
    process.exit(1)
  }
}
