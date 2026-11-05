import { fixtureUrl } from './support/fixture-url'
import { selectNativeCategory } from './support/glpi-form'
import { test, expect } from '@playwright/test'

const DESK = fixtureUrl('desk')
const GLPI = fixtureUrl('glpi')
const TECH_USERNAME = process.env.E2E_TECH_USERNAME ?? 'tech_dev'
const TECH_PASSWORD = process.env.E2E_TECH_PASSWORD
const REQUESTER_USERNAME = process.env.E2E_REQUESTER_USERNAME ?? 'user_test'
const REQUESTER_PASSWORD = process.env.E2E_REQUESTER_PASSWORD

test('realtime: connection indicator connects and maintains real-time link across contexts', async ({ browser }) => {
  if (!TECH_PASSWORD || !REQUESTER_PASSWORD) throw new Error('Configura E2E_TECH_PASSWORD y E2E_REQUESTER_PASSWORD.')
  test.setTimeout(90000)
  const contextA = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const pageA = await contextA.newPage()
  await pageA.goto(`${DESK}/login`)
  await pageA.locator('input[name="username"]').fill(TECH_USERNAME)
  await pageA.locator('input[name="password"]').fill(TECH_PASSWORD)
  await pageA.locator('button[type="submit"]').click()
  await pageA.waitForURL(/kanban|dashboard|tickets|queue/)
  await pageA.goto(`${DESK}/kanban?groupId=1`)
  const kanbanGroup = pageA.getByLabel('Seleccionar grupo de soporte')
  if (await kanbanGroup.isVisible().catch(() => false)) {
    await kanbanGroup.selectOption({ label: 'Desarrollo' })
    await expect(kanbanGroup.locator('option:checked')).toHaveText('Desarrollo')
  }

  const contextB = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const pageB = await contextB.newPage()
  await pageB.goto(`${DESK}/login`)
  await pageB.locator('input[name="username"]').fill(REQUESTER_USERNAME)
  await pageB.locator('input[name="password"]').fill(REQUESTER_PASSWORD)
  await pageB.locator('button[type="submit"]').click()
  await pageB.waitForURL(/\/kanban|\/dashboard|\/tickets|\/queue/, { timeout: 15000 })
  await pageB.goto(`${DESK}/tickets`)

  // El técnico está conectado en SignalR mientras el solicitante usa otro contexto.
  await expect(pageA.getByTestId('connection-indicator').first()).toHaveAttribute(
    'data-state',
    'connected',
    { timeout: 60000 },
  )
  let pageNavigations = 0
  pageA.on('framenavigated', frame => {
    if (frame === pageA.mainFrame()) pageNavigations++
  })

  // Requester routes must not expose the technician board or queue.
  await pageB.goto(`${DESK}/tickets`)
  await pageB.waitForLoadState('networkidle')
  if (await kanbanGroup.isVisible().catch(() => false)) {
    await kanbanGroup.selectOption({ label: 'Desarrollo' })
    await expect(kanbanGroup.locator('option:checked')).toHaveText('Desarrollo')
  }
  const title = `E2E SignalR requester ${Date.now()}`
  const glpi = await contextB.newPage()
  await glpi.goto(GLPI)
  await glpi.locator('#login_name').fill(REQUESTER_USERNAME)
  await glpi.locator('#login_password').fill(REQUESTER_PASSWORD)
  await glpi.locator('button[type="submit"]').click()
  await glpi.getByRole('link', { name: /Reportar un problema|Reportar una incidencia general/ }).last().click()
  await expect(glpi).toHaveURL(/Form\/Render\/1/)
  const submitButton = glpi.getByRole('button', { name: /Enviar/i })
  await selectNativeCategory(glpi, /»Dev$/)
  await expect(submitButton).toBeEnabled()
  await glpi.getByRole('textbox', { name: 'Asunto', exact: true }).fill(title)
  await expect(submitButton).toBeEnabled()
  const description = glpi.frameLocator('iframe[title="Área de Texto Enriquecido"]').locator('body')
  await description.pressSequentially('Ticket nativo de prueba automatizada del evento SignalR.', { delay: 10 })
  await description.press('Tab')
  await expect(submitButton).toBeEnabled()
  await expect(description).toContainText('Ticket nativo de prueba automatizada del evento SignalR.')
  await submitButton.click()
  await expect(glpi.getByText('Formulario enviado')).toBeVisible({ timeout: 15000 })

  // Observe the rendered queue without an explicit fetch, navigation or reload.
  await pageA.bringToFront()
  await expect(pageA.locator('[data-column-id="queue"]').getByText(title)).toBeVisible({
    timeout: 60000,
  })
  expect(pageNavigations).toBe(0)

  await contextA.close()
  await contextB.close()
})
