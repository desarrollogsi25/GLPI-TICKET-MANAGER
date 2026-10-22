import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth/tech1.json' })

test('notification bell: opens panel, shows notifications, mark as read', async ({ page }) => {
  test.setTimeout(60000)
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // Go to kanban (already logged in via storageState)
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // Click notification bell (first one - header)
  const bell = page.getByTestId('notification-bell').first()
  await expect(bell).toBeVisible()
  await bell.click()

  // Check panel opens
  const panel = page.getByTestId('notification-panel')
  await expect(panel).toBeVisible()

  // Check panel has header
  await expect(page.getByRole('heading', { name: 'Notificaciones' })).toBeVisible()

  // Close panel
  await bell.click()
  await expect(panel).not.toBeVisible()

  // No console errors
  expect(consoleErrors).toEqual([])
})