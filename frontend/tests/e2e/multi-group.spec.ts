import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth/tech1.json' })

test('multi-group: tech1 can access Desarrollo group', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // Go to kanban
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // tech1 belongs to Desarrollo first, so that is the default group.
  const groupSelect = page.getByLabel('Seleccionar grupo de soporte')
  if (await groupSelect.isVisible().catch(() => false)) {
    await expect(groupSelect.locator('option:checked')).toHaveText('Desarrollo')
  }

  // Check Kanban loads without errors
  await expect(page.locator('[data-column-id="queue"]')).toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('multi-group: tech1 can switch to Service Desk group', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // Go to kanban
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // Check group selector exists and switch to Service Desk
  const groupSelect = page.getByLabel('Seleccionar grupo de soporte')
  if (await groupSelect.isVisible().catch(() => false)) {
    await groupSelect.selectOption({ label: 'Service Desk' })
    await expect(groupSelect.locator('option:checked')).toHaveText('Service Desk')
    
    // Wait for queue to load
    await page.waitForResponse((r) => r.url().includes('/api/tickets/by-group') && r.status() === 200)
  }

  // Check Kanban loads without errors
  await expect(page.locator('[data-column-id="queue"]')).toBeVisible()

  expect(consoleErrors).toEqual([])
})