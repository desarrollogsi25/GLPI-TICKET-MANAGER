import { test, expect } from '@playwright/test'

test('Dashboard arranca y permite ir a la cola del grupo', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'tech1')
  await page.fill('input[name="password"]', 'Tech1Pass!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue)/, { timeout: 10000 })

  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')

  await expect(page.getByText('Tickets en mi cola')).toBeVisible({ timeout: 10000 })
  await page.getByText('Tickets en mi cola').click()
  await page.waitForURL('**/queue', { timeout: 10000 })

  expect(consoleErrors).toEqual([])
})
