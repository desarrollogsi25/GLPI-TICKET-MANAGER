import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth/tech1.json' })

test('multi-group: tech1 can access Hardware group', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // Go to kanban
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // Check group selector shows Hardware
  const groupSelect = page.getByLabel('Seleccionar grupo de soporte')
  if (await groupSelect.isVisible().catch(() => false)) {
    await expect(groupSelect.locator('option:checked')).toHaveText('Hardware')
  }

  // Check Kanban loads without errors
  await expect(page.locator('[data-column-id="queue"]')).toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('multi-group: tech1 can switch to Call Center group', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // Go to kanban
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // Check group selector exists and switch to Call Center
  const groupSelect = page.getByLabel('Seleccionar grupo de soporte')
  if (await groupSelect.isVisible().catch(() => false)) {
    await groupSelect.selectOption({ label: 'Call Center' })
    await expect(groupSelect.locator('option:checked')).toHaveText('Call Center')
    
    // Wait for queue to load
    await page.waitForResponse((r) => r.url().includes('/api/tickets/by-group') && r.status() === 200)
  }

  // Check Kanban loads without errors
  await expect(page.locator('[data-column-id="queue"]')).toBeVisible()

  expect(consoleErrors).toEqual([])
})