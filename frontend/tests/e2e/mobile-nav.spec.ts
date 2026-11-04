import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 375, height: 667 } })

test('mobile: bottom tab bar navigation works', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // Verificar bottom tabs visibles
  await expect(page.getByTestId('mobile-tab-kanban')).toBeVisible()
  await expect(page.getByTestId('mobile-tab-tickets')).toBeVisible()
  await expect(page.getByTestId('mobile-tab-queue')).toBeVisible()
  await expect(page.getByTestId('mobile-tab-more')).toBeVisible()

  // Nav desktop / horizontal oculta en móvil
  const horizontalNav = page.locator('aside nav').first()
  const navVisible = await horizontalNav.isVisible()
  expect(navVisible).toBe(false)

  // Tab activo
  const kanbanTab = page.getByTestId('mobile-tab-kanban')
  await expect(kanbanTab).toHaveAttribute('aria-current', 'page')

  // Navegar a Tickets
  await page.getByTestId('mobile-tab-tickets').click()
  await page.waitForURL(/\/tickets/, { timeout: 5000 })

  // Abrir drawer
  await page.getByTestId('mobile-tab-more').click()
  await expect(page.getByTestId('mobile-drawer')).toBeVisible({ timeout: 3000 })

  // Cerrar drawer con Escape
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('mobile-drawer')).not.toBeVisible({ timeout: 3000 })

  expect(consoleErrors).toEqual([])
})
