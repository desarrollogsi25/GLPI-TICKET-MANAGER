import { test, expect } from '@playwright/test'

test('flujo completo: cola -> asignarme -> resolver con solucion', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('http://localhost:5173/queue')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('text=#57').first()).toBeVisible({ timeout: 15000 })

  const card57 = page.getByText('#57').first().locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const claimButton = card57.getByRole('button', { name: /Asignarme/i })
  await expect(claimButton).toBeVisible()
  await claimButton.click()

  await expect(page.locator('text=#57').first()).not.toBeVisible({ timeout: 15000 })

  await page.goto('http://localhost:5173/tickets/57')
  await page.waitForLoadState('networkidle')

  // H-62: Un ticket en Asignado (2) debe iniciarse (En Progreso) antes de resolverse
  const startButton = page.getByRole('button', { name: /Iniciar ticket|Planificado/i }).first()
  if (await startButton.isVisible()) {
    await startButton.click()
    await expect(page.getByText('Estado actualizado')).toBeVisible({ timeout: 10000 })
  }

  const resolveButton = page.getByRole('button', { name: /^Resolver$/ }).first()
  await expect(resolveButton).toBeVisible({ timeout: 10000 })
  await resolveButton.click()

  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })

  const confirmCandidate = page.locator('button', { hasText: /Resolver|Confirmar/ })
  const confirmButton = confirmCandidate.last()
  await expect(confirmButton).toBeEnabled()
  await textarea.focus()
  await textarea.blur()
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveCount(0)
  await confirmButton.click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('La solución no puede estar vacía.')

  await textarea.fill('Solucion de prueba E2E automatizada con Playwright')
  await expect(confirmButton).toBeEnabled()

  await confirmButton.click()

  await expect(page.getByText('Ticket resuelto')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('textarea')).toHaveCount(0, { timeout: 15000 })

  expect(consoleErrors).toEqual([])
})