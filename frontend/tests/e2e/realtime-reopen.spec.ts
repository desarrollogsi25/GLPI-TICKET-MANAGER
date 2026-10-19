import { test, expect } from '@playwright/test'

test('flujo completo de reapertura: resolver -> reabrir con motivo -> verificar seguimiento privado -> resolver nuevamente', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Claim ticket #70 desde la cola
  await page.goto('http://localhost:5173/queue')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('text=#70').first()).toBeVisible({ timeout: 15000 })
  const card70 = page.getByText('#70').first().locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const claimButton = card70.getByRole('button', { name: /Asignarme/i })
  await expect(claimButton).toBeVisible()
  await claimButton.click()
  await expect(page.locator('text=#70').first()).not.toBeVisible({ timeout: 15000 })

  // Navegar al ticket asignado a tech1 (#70)
  await page.goto('http://localhost:5173/tickets/70')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('text=#70').first()).toBeVisible({ timeout: 15000 })

  // 2. Resolver el ticket por primera vez
  const resolveButton = page.getByRole('button', { name: /^Resolver$/ }).first()
  await expect(resolveButton).toBeVisible({ timeout: 10000 })
  await resolveButton.click()

  const textareaSolution = page.locator('textarea').first()
  await expect(textareaSolution).toBeVisible({ timeout: 10000 })
  await textareaSolution.fill('Primera solución aplicada para resolver la incidencia inicial')

  const confirmResolve = page.locator('button', { hasText: /^Resolver$/ }).last()
  await expect(confirmResolve).toBeEnabled()
  await confirmResolve.click()

  // 3. Verificar status = 5 (Solved)
  await expect(page.getByText('Ticket resuelto')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('textarea')).toHaveCount(0, { timeout: 15000 })
  await expect(page.getByText('Solved').first()).toBeVisible({ timeout: 10000 })

  // 4. Click en "Reabrir" con motivo
  const reopenButton = page.getByRole('button', { name: /^Reabrir$/ }).first()
  await expect(reopenButton).toBeVisible({ timeout: 10000 })
  await reopenButton.click()

  const textareaReason = page.locator('textarea').first()
  await expect(textareaReason).toBeVisible({ timeout: 10000 })
  const reopenReason = 'El fallo ha vuelto a reproducirse tras 10 minutos'
  await textareaReason.fill(reopenReason)

  const confirmReopen = page.locator('button', { hasText: /^Reabrir$/ }).last()
  await expect(confirmReopen).toBeEnabled()
  await confirmReopen.click()

  // 5. Verificar status vuelve a 2 (Assigned)
  await expect(page.getByText('Ticket reabierto')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('textarea')).toHaveCount(0, { timeout: 15000 })
  await expect(page.getByText('Assigned').first()).toBeVisible({ timeout: 10000 })

  // 6. Verificar que el motivo aparece como followup privado
  await expect(page.getByText(reopenReason)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Privado').first()).toBeVisible({ timeout: 10000 })

  // 7. Verificar que se puede volver a resolver con nueva solución
  await expect(resolveButton).toBeVisible({ timeout: 10000 })
  await resolveButton.click()

  const textareaNewSolution = page.locator('textarea').first()
  await expect(textareaNewSolution).toBeVisible({ timeout: 10000 })
  await textareaNewSolution.fill('Segunda solución definitiva tras corregir la causa raíz')

  const confirmResolve2 = page.locator('button', { hasText: /^Resolver$/ }).last()
  await expect(confirmResolve2).toBeEnabled()
  await confirmResolve2.click()

  await expect(page.getByText('Ticket resuelto')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Solved').first()).toBeVisible({ timeout: 10000 })

  expect(consoleErrors).toEqual([])
})
