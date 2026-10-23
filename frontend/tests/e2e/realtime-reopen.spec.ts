import { test, expect } from '@playwright/test'

test.setTimeout(120000)

test('flujo completo de reapertura: resolver -> reabrir con motivo -> verificar seguimiento privado -> resolver nuevamente', async ({
  page,
  browser,
}) => {
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

  // 3. Verificar status resuelto y cierre automático
  await expect(page.getByText('Ticket resuelto')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('textarea')).toHaveCount(0, { timeout: 15000 })
  await expect(page.getByText(/Resuelto|Solved/).first()).toBeVisible({ timeout: 10000 })

  // 3b. Al resolver el ticket se cierra automáticamente (6). Sólo un administrador
  //     puede reabrirlo, así que el técnico no debe ver el botón "Reabrir".
  await expect(page.getByRole('button', { name: /^Reabrir$/ })).toHaveCount(0)

  // 4. Reabrir como administrador. Se usa un contexto aparte para no cerrar la
  //    sesión compartida de tech1 (el resto de la suite depende de storageState).
  const adminContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const adminPage = await adminContext.newPage()
  adminPage.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[admin] ${msg.text()}`)
  })

  await adminPage.goto('http://localhost:5173/login')
  await adminPage.fill('input[name="username"]', 'admin_test')
  await adminPage.fill('input[name="password"]', 'Tech1Pass!')
  await adminPage.click('button[type="submit"]')
  await adminPage.waitForURL(/\/(kanban|dashboard|tickets|queue|services)/, { timeout: 15000 })

  await adminPage.goto('http://localhost:5173/tickets/70')
  await adminPage.waitForLoadState('networkidle')

  const reopenButton = adminPage.getByRole('button', { name: /^Reabrir$/ }).first()
  await expect(reopenButton).toBeVisible({ timeout: 10000 })
  await reopenButton.click()

  const textareaReason = adminPage.locator('textarea').first()
  await expect(textareaReason).toBeVisible({ timeout: 10000 })
  const reopenReason = 'El fallo ha vuelto a reproducirse tras 10 minutos'
  await textareaReason.fill(reopenReason)

  const confirmReopen = adminPage.locator('button', { hasText: /^Reabrir$/ }).last()
  await expect(confirmReopen).toBeEnabled()
  await confirmReopen.click()

  // 5. Verificar status vuelve a 2 (Assigned / Asignado)
  await expect(adminPage.getByText(/Ticket reabierto/i).first()).toBeVisible({ timeout: 15000 })
  await expect(adminPage.locator('textarea')).toHaveCount(0, { timeout: 15000 })
  await expect(adminPage.getByText(/Asignado|Assigned/).first()).toBeVisible({ timeout: 10000 })

  // 6. Verificar que el motivo aparece como followup privado
  await expect(adminPage.getByText(reopenReason).first()).toBeVisible({ timeout: 10000 })
  await expect(adminPage.getByText('Privado').first()).toBeVisible({ timeout: 10000 })

  await adminContext.close()

  // 7. El técnico asignado puede volver a resolver con una nueva solución.
  await page.reload()
  await page.waitForLoadState('networkidle')

  const resolveButton2 = page.getByRole('button', { name: /^Resolver$/ }).first()
  await expect(resolveButton2).toBeVisible({ timeout: 15000 })
  await resolveButton2.click()

  const textareaNewSolution = page.locator('textarea').first()
  await expect(textareaNewSolution).toBeVisible({ timeout: 10000 })
  await textareaNewSolution.fill('Segunda solución definitiva tras corregir la causa raíz')

  const confirmResolve2 = page.locator('button', { hasText: /^Resolver$/ }).last()
  await expect(confirmResolve2).toBeEnabled()
  await confirmResolve2.click()

  await expect(page.getByText('Ticket resuelto')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/Resuelto|Solved/).first()).toBeVisible({ timeout: 10000 })

  expect(consoleErrors).toEqual([])
})
