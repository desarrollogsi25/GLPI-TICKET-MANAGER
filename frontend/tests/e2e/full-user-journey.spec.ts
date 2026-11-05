import { test, expect, type Page } from '@playwright/test'
import { confirmPlanning } from './support/planning'
import { fixtureUrl } from './support/fixture-url'

const GLPI = fixtureUrl('glpi')
const DESK = fixtureUrl('desk')
const REQUESTER_USERNAME = process.env.E2E_REQUESTER_USERNAME ?? 'user_test'
const REQUESTER_PASSWORD = process.env.E2E_REQUESTER_PASSWORD
const TECH_USERNAME = process.env.E2E_TECH_USERNAME ?? 'tech_sd'
const TECH_PASSWORD = process.env.E2E_TECH_PASSWORD
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'admin_test'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

test('journey real: solicitante, técnico, SignalR, filtros, administrador y permisos', async ({ browser }, testInfo) => {
  if (!REQUESTER_PASSWORD || !TECH_PASSWORD || !ADMIN_PASSWORD) {
    throw new Error('Configura E2E_REQUESTER_PASSWORD, E2E_TECH_PASSWORD y E2E_ADMIN_PASSWORD en el entorno de pruebas.')
  }
  // Two native submissions and six browser contexts; Windows trace shows the
  // functional assertions finish but video/context teardown exceeds 120s.
  // Individual navigation/action/realtime deadlines remain unchanged.
  test.setTimeout(180000)
  const title = `E2E demo Hardware ${Date.now()}`
  const serviceDesk = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await serviceDesk.newPage()
  page.setDefaultTimeout(15000)
  const requester = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const glpi = await requester.newPage()


  async function submitNativeTicket(glpiPage: Page, ticketTitle: string) {
    await glpiPage.goto(GLPI)
    if (await glpiPage.locator('#login_name').isVisible().catch(() => false)) {
      await glpiPage.locator('#login_name').fill(REQUESTER_USERNAME)
      await glpiPage.locator('#login_password').fill(REQUESTER_PASSWORD!)
      await glpiPage.locator('button[type="submit"]').click()
    }
    await glpiPage.getByRole('link', { name: /Reportar un problema|Reportar una incidencia general/ }).last().click()
    await expect(glpiPage).toHaveURL(/Form\/Render\/1/)
    await glpiPage.screenshot({ path: testInfo.outputPath('glpi-form.png'), fullPage: true })
    const submitButton = glpiPage.getByRole('button', { name: /Enviar/i })
    const category = glpiPage.getByRole('region', { name: 'Categoría' }).getByRole('combobox').last()
    await category.click()
    await glpiPage.getByText(/»Hardware/).click()
    await expect(submitButton).toBeEnabled()
    await glpiPage.getByRole('textbox', { name: 'Asunto', exact: true }).fill(ticketTitle)
    await expect(submitButton).toBeEnabled()
    const description = glpiPage.frameLocator('iframe[title="Área de Texto Enriquecido"]').locator('body')
    await description.pressSequentially('Prueba completa del flujo de Hardware.', { delay: 10 })
    await description.press('Tab')
    await expect(submitButton).toBeEnabled()
    await expect(description).toContainText('Prueba completa del flujo de Hardware.')
    const submission = glpiPage.waitForResponse(
      r => r.url().includes('/Form/SubmitAnswers') && r.request().method() === 'POST', { timeout: 20000 },
    )
    const submitStartedAt = Date.now()
    await submitButton.click()
    const response = await submission
    const responseReceivedAt = Date.now()
    expect(response.status()).toBeLessThan(400)
    await expect(glpiPage.getByText('Formulario enviado')).toBeVisible({ timeout: 15000 })
    await glpiPage.screenshot({ path: testInfo.outputPath('glpi-submitted.png'), fullPage: true })
    return { submitStartedAt, responseReceivedAt }
  }
  await submitNativeTicket(glpi, title)

  // Técnico: abrir la cola en el Service Desk, asignar e intentar resolver.
  await page.goto(`${DESK}/login`)
  await page.locator('input[name="username"]').fill(TECH_USERNAME)
  await page.locator('input[name="password"]').fill(TECH_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/kanban|dashboard|tickets|queue/, { timeout: 20000 })
  await page.goto(`${DESK}/queue?groupId=3`)
  const groupPicker = page.getByLabel('Seleccionar grupo de soporte').first()
  if (await groupPicker.isVisible().catch(() => false)) {
    const serviceDeskGroupId = await groupPicker.locator('option').filter({ hasText: /^Service Desk$/ }).getAttribute('value')
    expect(serviceDeskGroupId).toBeTruthy()
    const hardwareQueueResponse = page.waitForResponse(response =>
      response.url().includes('/api/tickets/by-group') && response.url().includes(`groupId=${serviceDeskGroupId}`),
    )
    await groupPicker.selectOption(serviceDeskGroupId!)
    await expect(groupPicker.locator('option:checked')).toHaveText('Service Desk')
    expect((await hardwareQueueResponse).ok()).toBeTruthy()
  } else {
    await expect(page.getByTestId('technician-group-label').first()).toBeVisible()
  }
  await expect(page.getByText(title)).toBeVisible({ timeout: 60000 })
  const claimButton = page.getByRole('button', { name: 'Asignarme' }).first()
  await expect(claimButton).toBeVisible({ timeout: 15000 })
  const ticketCard = page.getByText(title).locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const ticketIdText = await ticketCard.getByText(/^#\d+$/).textContent()
  const ticketId = Number(ticketIdText?.replace('#', ''))
  expect(ticketId).toBeGreaterThan(0)
  await ticketCard.getByRole('button', { name: /Asignarme/i }).click()
  await expect(page.getByText(/Ticket asignado correctamente/i).first()).toBeVisible({ timeout: 15000 })
  await page.goto(`${DESK}/tickets/${ticketId}`)
  await expect(page.getByText(title)).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'Planificar tarea' }).click()
  await confirmPlanning(page)
  await expect(page.getByText('En proceso (planificado)', { exact: true }).first()).toBeVisible()
  // The planned step must be a *real* GLPI TicketTask visible after REST readback.
  const timeline = page.getByTestId('ticket-tasks-timeline')
  const plannedTask = timeline.locator('li').filter({ hasText: 'Intervención técnica planificada por prueba E2E' }).first()
  await expect(plannedTask).toBeVisible({ timeout: 20_000 })
  await plannedTask.getByRole('button', { name: 'Reprogramar' }).click()
  const replanDialog = page.getByRole('dialog', { name: /Reprogramar tarea/i })
  await expect(replanDialog).toBeVisible()
  const start = replanDialog.getByLabel('Inicio')
  const end = replanDialog.getByLabel('Fin')
  await expect(start).not.toHaveValue('')
  await expect(end).not.toHaveValue('')
  await replanDialog.getByRole('textbox', { name: 'Trabajo por realizar' }).fill('Intervención técnica reprogramada por prueba E2E')
  await replanDialog.getByRole('button', { name: 'Guardar nueva programación' }).click()
  await expect(replanDialog).not.toBeVisible({ timeout: 20_000 })
  await expect(timeline.getByText('Intervención técnica reprogramada por prueba E2E')).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /^Resolver$/ }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('textarea').fill('Solución aplicada durante la prueba automatizada.')
  await dialog.getByRole('button', { name: /^Resolver$/ }).last().click()
  await expect(dialog).not.toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/Ticket resuelto/i).first()).toBeVisible({ timeout: 15000 })
  await page.screenshot({ path: testInfo.outputPath('technician-resolved.png'), fullPage: true }).catch(() => {})

  // Filtros: el rango inválido se bloquea en español antes de hacer petición.
  // El calendario impide invertir el rango en la UI; un enlace profundo sigue ejercitando el guard.
  await page.goto(`${DESK}/tickets`)
  await page.waitForLoadState('networkidle')
  let rangedTicketRequests = 0
  page.on('request', request => {
    const url = request.url()
    if (url.includes('/api/tickets?') && (url.includes('startDate=') || url.includes('endDate='))) rangedTicketRequests++
  })
  await page.goto(`${DESK}/tickets?startDate=2026-10-20&endDate=2026-10-19`)
  await expect(page.getByRole('alert')).toContainText('La fecha de inicio no puede ser posterior a la fecha de fin.')
  expect(rangedTicketRequests).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('date-filter.png'), fullPage: true }).catch(() => {})

  // Admin: reabrir el ticket recién resuelto y avanzar a En progreso.
  const adminContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const admin = await adminContext.newPage()
  admin.setDefaultTimeout(15000)
  await admin.goto(`${DESK}/login`)
  await admin.locator('input[name="username"]').fill(ADMIN_USERNAME)
  await admin.locator('input[name="password"]').fill(ADMIN_PASSWORD)
  await admin.locator('button[type="submit"]').click()
  await admin.waitForURL(/kanban|dashboard|tickets|queue/)
  await admin.goto(`${DESK}/tickets/${ticketId}`)
  const reopen = admin.getByRole('button', { name: /^Reabrir$/ })
  await expect(reopen).toBeVisible()
  await reopen.click()
  const reopenDialog = admin.getByRole('dialog')
  await reopenDialog.locator('textarea').fill('Reapertura verificada en la demo E2E.')
  await reopenDialog.getByRole('button', { name: /^Reabrir$/ }).last().click()
  await expect(admin.getByText(/Ticket reabierto/i).first()).toBeVisible({ timeout: 15000 })
  await admin.getByRole('button', { name: 'Planificar tarea' }).click()
  await confirmPlanning(admin)
  await expect(admin.getByText('En proceso (planificado)', { exact: true }).first()).toBeVisible()
  const taskToCancel = admin.getByTestId('ticket-tasks-timeline').locator('li')
    .filter({ hasText: 'Intervención técnica planificada por prueba E2E' }).last()
  await expect(taskToCancel.getByRole('button', { name: 'Cancelar tarea' })).toBeVisible()
  await taskToCancel.getByRole('button', { name: 'Cancelar tarea' }).click()
  const cancelDialog = admin.getByRole('dialog', { name: 'Cancelar tarea' })
  await expect(cancelDialog).toContainText('puede ser definitivo')
  await cancelDialog.getByRole('button', { name: 'Confirmar en GLPI' }).click()
  await expect(cancelDialog).not.toBeVisible({ timeout: 20_000 })
  await expect(admin.getByText(/Tarea #\d+ cancelada/).first()).toBeVisible()
  await expect(taskToCancel).not.toBeVisible({ timeout: 20_000 })
  await adminContext.close()

  // Restricción de rol: un solicitante no puede entrar al Kanban.
  const requesterApp = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const app = await requesterApp.newPage()
  await app.goto(`${DESK}/login`)
  await app.locator('input[name="username"]').fill(REQUESTER_USERNAME)
  await app.locator('input[name="password"]').fill(REQUESTER_PASSWORD)
  await app.locator('button[type="submit"]').click()
  await app.waitForURL(/tickets/)
  await app.goto(`${DESK}/kanban`)
  await expect(app).toHaveURL(/\/tickets$/)

  // Realtime: technician and GLPI requester are separate browser contexts.
  // Submit another native GLPI form while the technician observes the queue.
  const techContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const techPage = await techContext.newPage()
  await techPage.goto(`${DESK}/login`)
  await techPage.locator('input[name="username"]').fill(TECH_USERNAME)
  await techPage.locator('input[name="password"]').fill(TECH_PASSWORD)
  await techPage.locator('button[type="submit"]').click()
  await techPage.waitForURL(/kanban|dashboard|tickets|queue/)
  await techPage.goto(`${DESK}/kanban?groupId=3`)
  const realtimeGroupPicker = techPage.getByLabel('Seleccionar grupo de soporte').first()
  if (await realtimeGroupPicker.isVisible().catch(() => false)) {
    await realtimeGroupPicker.selectOption({ label: 'Service Desk' })
    await expect(realtimeGroupPicker.locator('option:checked')).toHaveText('Service Desk')
  } else {
    await expect(techPage.getByTestId('technician-group-label').first()).toBeVisible()
  }
  await expect(techPage.getByTestId('connection-indicator').first()).toHaveAttribute('data-state', 'connected', { timeout: 10000 })
  const requesterPage = await requesterApp.newPage()
  await requesterPage.goto(`${DESK}/tickets`)
  const realtimeTitle = `E2E SignalR ${Date.now()}`
  const [submitted, visibleAt] = await Promise.all([
    submitNativeTicket(glpi, realtimeTitle),
    techPage.locator('[data-column-id="queue"]').getByText(realtimeTitle)
      .waitFor({ state: 'visible', timeout: 60000 }).then(() => Date.now()),
  ])
  await techPage.bringToFront()
  await testInfo.attach('native-creation-to-visible-latency', {
    body: JSON.stringify({
      submitToVisibleMs: visibleAt - submitted.submitStartedAt,
      responseToVisibleMs: visibleAt - submitted.responseReceivedAt,
      includesGLPIProcessing: true,
    }),
    contentType: 'application/json',
  })

  await requester.close()
  await requesterApp.close()
  await techContext.close()
  await serviceDesk.close()
  await adminContext.close().catch(() => {})
})
