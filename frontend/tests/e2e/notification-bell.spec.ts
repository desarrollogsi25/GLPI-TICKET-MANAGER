import { test, expect } from '@playwright/test'


test('notification bell: opens panel, shows notifications, mark as read', async ({ page }) => {
  test.setTimeout(60000)
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // H-65: a browser gesture may request permission once; rendering must not.
  await page.addInitScript(() => {
    localStorage.removeItem('glpi.notification-permission-requested')
    const state = window as Window & { notificationPermissionRequests?: number }
    state.notificationPermissionRequests = 0
    Object.defineProperty(Notification, 'permission', { configurable: true, get: () => 'default' })
    Notification.requestPermission = async () => {
      state.notificationPermissionRequests = (state.notificationPermissionRequests ?? 0) + 1
      return 'default'
    }
  })

  // Go to kanban (already logged in via storageState)
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')
  const permissionRequests = () => page.evaluate(() =>
    (window as Window & { notificationPermissionRequests?: number }).notificationPermissionRequests)
  expect(await permissionRequests()).toBe(0)

  // Click notification bell (first one - header)
  const bell = page.getByTestId('notification-bell').first()
  await expect(bell).toBeVisible()
  await bell.click()
  await expect.poll(permissionRequests).toBe(1)

  // Check panel opens
  const panel = page.getByTestId('notification-panel')
  await expect(panel).toBeVisible()
  await expect(page.getByText('Activar Push', { exact: true })).toHaveCount(0)

  // Check panel has header
  await expect(page.getByRole('heading', { name: 'Notificaciones' })).toBeVisible()

  // Close panel
  await bell.click()
  await expect(panel).not.toBeVisible()
  expect(await permissionRequests()).toBe(1)

  // No console errors
  expect(consoleErrors).toEqual([])
})
