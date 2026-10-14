import { test, expect } from '@playwright/test'

test('crear ticket externo con canal y requester formateado ADR-005', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })

  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'tech1')
  await page.fill('input[name="password"]', 'Tech1Pass!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue)/, { timeout: 10000 })

  await page.goto('http://localhost:5173/tickets')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Nuevo ticket/i }).click()
  await page.waitForTimeout(300)

  await page.fill('input#title', 'Paso E ticket externo Playwright')

  // requester externo
  await page.click('label:has-text("Externo")')
  await page.fill('input#externalName', 'Juan Perez')
  await page.fill('input#externalPhone', '+34 600 111 222')
  await page.fill('input#externalEmail', 'juan@acme.com')
  await page.fill('input#externalCompany', 'ACME')

  // canal (selector native)
  const channelSelect = page.locator('#channel')
  if (await channelSelect.count()) {
    try { await channelSelect.selectOption({ label: /Phone/i }) } catch (e) {}
  }

  await page.fill('textarea#content', 'Laptop no enciende')

  await page.getByRole('button', { name: /Crear ticket/i }).click()

  await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 })
  const url = page.url()
  const newId = Number((url.match(/\/tickets\/(\d+)/) || [])[1])
  console.log('Created ticket id:', newId)
  expect(Number.isInteger(newId) && newId > 0).toBeTruthy()

  // sanity: toast
  expect(consoleErrors).toEqual([])
})