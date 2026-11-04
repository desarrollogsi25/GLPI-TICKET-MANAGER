import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 375, height: 667 } })

test('tickets mobile: cards render and are tappable', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/tickets')
  await page.waitForLoadState('networkidle')

  // 1. La tabla desktop NO debe estar visible
  const table = page.locator('table').first()
  await expect(table).not.toBeVisible()

  // 2. Cards móviles SÍ deben estar visibles
  const cards = page.locator('[data-testid="ticket-card"]')
  await expect(cards.first()).toBeVisible({ timeout: 10000 })

  // 3. Tap en una card → navega al detalle
  await cards.first().click()
  await page.waitForURL(/\/tickets\/\d+/, { timeout: 5000 })

  expect(consoleErrors).toEqual([])
})
