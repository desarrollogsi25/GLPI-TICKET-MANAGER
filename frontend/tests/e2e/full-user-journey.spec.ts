import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const GLPI = process.env.E2E_GLPI_URL ?? 'http://localhost:8081'
const DESK = process.env.E2E_DESK_URL ?? 'http://localhost:5173'
const REQUESTER_USERNAME = process.env.E2E_REQUESTER_USERNAME ?? 'user_test'
const REQUESTER_PASSWORD = process.env.E2E_REQUESTER_PASSWORD ?? 'Password123!'
const TECH_USERNAME = process.env.E2E_TECH_USERNAME ?? 'tech_sd'
const TECH_PASSWORD = process.env.E2E_TECH_PASSWORD ?? 'Password123!'
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'admin_test'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Password123!'

test('journey real: solicitante, técnico, SignalR, filtros, administrador y permisos', async ({ browser }) => {
  test.setTimeout(120000)
  const title = `E2E demo Hardware ${Date.now()}`
  mkdirSync(resolve(process.cwd(), 'test-results/full-user-journey'), { recursive: true })
  const serviceDesk = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await serviceDesk.newPage()
  page.setDefaultTimeout(15000)
  const requester = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const glpi = await requester.newPage()

  // CI's minimal GLPI schema does not include the populated category tree used
  // by the native form. Keep the native SubmitAnswers check for local runs and
  // create the same Hardware ticket through the authenticated API in CI.
  if (process.env.E2E_GLPI_NATIVE !== 'true') {
    await glpi.goto(`${DESK}/login`)
    await glpi.waitForSelector('input[name="username"]', { timeout: 15000 })
    await glpi.locator('input[name="username"]').fill(REQUESTER_USERNAME)
    await glpi.locator('input[name="password"]').fill(REQUESTER_PASSWORD)
    await glpi.locator('button[type="submit"]').click()
    await glpi.waitForURL(/\/(tickets|kanban)/, { timeout: 15000 })
    const created = await glpi.evaluate(async (ticketTitle) => {
      const stored = JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}')
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.state?.accessToken}` },
        body: JSON.stringify({ title: ticketTitle, description: 'Prueba completa del flujo de Hardware.', urgency: 3, categoryId: 16 }),
      })
      return { status: response.status, body: await response.json() }
    }, title)
    expect(created.status).toBe(201)
  } else {
    await glpi.goto(GLPI)
    if (await glpi.locator('#login_name').isVisible().catch(() => false)) {
      await glpi.locator('#login_name').fill(REQUESTER_USERNAME)
      await glpi.locator('#login_password').fill(REQUESTER_PASSWORD)
      await glpi.locator('button[type="submit"]').click()
    }
    await glpi.getByRole('link', { name: /Reportar un problema/ }).last().click()
    await expect(glpi).toHaveURL(/Form\/Render\/1/)
    await glpi.screenshot({ path: 'test-results/full-user-journey/glpi-form.png', fullPage: true }).catch(() => {})
    await glpi.getByRole('textbox', { name: 'Título' }).fill(title)
    await glpi.frameLocator('iframe[title="Área de Texto Enriquecido"]').locator('body').fill('Prueba completa del flujo de Hardware.')
    const category = glpi.getByRole('region', { name: 'Categoría' }).getByRole('combobox').last()
    await category.click()
    await glpi.getByText(/»Hardware/).click()
    const glpiResponse = glpi.waitForResponse(r => r.url().includes('/Form/SubmitAnswers') && r.request().method() === 'POST')
    await glpi.getByRole('button', { name: /Enviar/i }).click()
    const submit = await glpiResponse
    expect(submit.status(), 'GLPI SubmitAnswers no debe responder con error 500').toBeLessThan(500)
    await expect(glpi.getByText('Formulario enviado')).toBeVisible({ timeout: 15000 })
    await glpi.screenshot({ path: 'test-results/full-user-journey/glpi-submitted.png', fullPage: true }).catch(() => {})
  }

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
  await page.getByRole('button', { name: 'Planificado' }).click()
  await expect(page.getByText('Estado actualizado').first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Planificado', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: /^Resolver$/ }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('textarea').fill('Solución aplicada durante la prueba automatizada.')
  await dialog.getByRole('button', { name: /^Resolver$/ }).last().click()
  await expect(dialog).not.toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/Ticket resuelto/i).first()).toBeVisible({ timeout: 15000 })
  await page.screenshot({ path: 'test-results/full-user-journey/technician-resolved.png', fullPage: true }).catch(() => {})

  // Filtros: el rango inválido se bloquea en español antes de hacer petición.
  await page.goto(`${DESK}/tickets`)
  await page.waitForLoadState('networkidle')
  await page.locator('#start-date-filter').fill('2026-10-20')
  let rangedTicketRequests = 0
  page.on('request', request => {
    const url = request.url()
    if (url.includes('/api/tickets?') && (url.includes('startDate=') || url.includes('endDate='))) rangedTicketRequests++
  })
  await page.locator('#end-date-filter').fill('2026-10-19')
  await expect(page.getByRole('alert')).toContainText('La fecha de inicio no puede ser posterior a la fecha de fin.')
  expect(rangedTicketRequests).toBe(0)
  await page.screenshot({ path: 'test-results/full-user-journey/date-filter.png', fullPage: true }).catch(() => {})

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
  await admin.getByRole('button', { name: 'Planificado' }).click()
  await expect(admin.getByText('Estado actualizado').first()).toBeVisible({ timeout: 15000 })
  await expect(admin.getByText('Planificado', { exact: true }).first()).toBeVisible()
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
  // GLPI's native form submission is covered above; this additional API-created
  // ticket verifies the SignalR path used by the Service Desk integration.
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
  const created = await requesterPage.evaluate(async ticketTitle => {
    const stored = JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}')
    const response = await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.state?.accessToken}` }, body: JSON.stringify({ title: ticketTitle, description: 'SignalR journey', urgency: 3, categoryId: 16 }) })
    return { status: response.status, body: await response.json() }
  }, realtimeTitle)
  expect(created.status).toBe(201)
  await techPage.bringToFront()
  await expect(techPage.locator('[data-column-id="queue"]').getByText(`#${created.body.ticketId}`)).toBeVisible({ timeout: 60000 })

  await requester.close()
  await requesterApp.close()
  await techContext.close()
  await serviceDesk.close()
  await adminContext.close().catch(() => {})
})
