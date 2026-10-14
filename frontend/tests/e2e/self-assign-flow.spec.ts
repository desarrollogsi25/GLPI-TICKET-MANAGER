import { test, expect } from '@playwright/test'

test('flujo completo: cola -> asignarme -> resolver con solucion', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'tech1')
  await page.fill('input[name="password"]', 'Tech1Pass!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue)/, { timeout: 10000 })

  await page.goto('http://localhost:5173/queue')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('text=#11')).toBeVisible({ timeout: 15000 })

  const claimButton = page.getByRole('button', { name: /Asignarme/i }).first()
  await expect(claimButton).toBeVisible()
  await claimButton.click()

  await expect(page.locator('text=#11')).not.toBeVisible({ timeout: 15000 })

  await page.goto('http://localhost:5173/tickets/11')
  await page.waitForLoadState('networkidle')

  const resolveButton = page.getByRole('button', { name: /^Resolver$/ }).first()
  await expect(resolveButton).toBeVisible({ timeout: 10000 })
  await resolveButton.click()

  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })

  const confirmCandidate = page.locator('button', { hasText: /Resolver|Confirmar/ })
  const confirmButton = confirmCandidate.last()
  await expect(confirmButton).toBeDisabled()

  await textarea.fill('Solucion de prueba E2E automatizada con Playwright')
  await expect(confirmButton).toBeEnabled()

  await confirmButton.click()

  await expect(page.getByText('Ticket resuelto')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('textarea')).toHaveCount(0, { timeout: 15000 })

  expect(consoleErrors).toEqual([])
})