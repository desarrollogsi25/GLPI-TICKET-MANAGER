import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 720 } })

test('desktop: sidebar visible, mobile tabs hidden', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // Sidebar visible
  await expect(page.locator('[data-testid="sidebar-nav-kanban"]')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[data-testid="sidebar-nav-tickets"]')).toBeVisible()
  await expect(page.locator('[data-testid="sidebar-nav-services"]')).toBeVisible()

  // Bottom tabs NO visibles en desktop
  await expect(page.getByTestId('mobile-tab-kanban')).not.toBeVisible()

  // Navegar desde sidebar
  await page.locator('[data-testid="sidebar-nav-tickets"]').click()
  await page.waitForURL(/\/tickets/, { timeout: 5000 })

  expect(consoleErrors).toEqual([])
})
