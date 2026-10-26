import { test, expect } from '@playwright/test'

import { resetFixtureTicket } from './support/ticket-fixtures'

/**
 * QA audit spec for the pending-ticket flow (H-34 / H-36).
 *
 * Verifies the full technician flow end to end:
 *   (storageState login as tech1) -> assign a queue ticket -> move it to
 *   "En progreso" -> open "Poner en pendiente" modal -> select reason + comment ->
 *   submit -> verify ticket moves to "Pendiente" and comment appears in ticket history ->
 *   resume to "En progreso" -> resolve -> verify ticket in "Resuelto".
 *
 * Provisions its own dedicated ticket (id 902) via MariaDB resetFixtureTicket.
 */

const TICKET_ID = 904

test.beforeEach(() => {
  resetFixtureTicket(TICKET_ID, 'QA pending-ticket fixture')
})

test('flujo pendiente: asignar -> pendiente (con comentario) -> verificar historial -> reanudar -> resolver', async ({ page }) => {
  test.setTimeout(90_000)
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Cola del grupo: asignarme el ticket dedicado (si está en cola).
  await page.goto('/queue')
  await page.waitForResponse((r) => r.url().includes('/api/tickets/by-group') && r.status() === 200)

  const inQueue = await page.locator(`text=#${TICKET_ID}`).first().isVisible({ timeout: 10000 }).catch(() => false)
  if (inQueue) {
    const card = page
      .getByText(`#${TICKET_ID}`)
      .first()
      .locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
    const claimButton = card.getByRole('button', { name: /Asignarme/i })
    await expect(claimButton).toBeVisible()
    await claimButton.click()
    await expect(page.locator(`text=#${TICKET_ID}`).first()).not.toBeVisible({ timeout: 15000 })
  }

  // 2. Kanban: verificar que el ticket asignado aparece en "Mis tickets" o "En progreso"
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  const mineColumn = page.locator('[data-column-id="mine"]')
  const inProgressColumn = page.locator('[data-column-id="in_progress"]')

  const inMine = await mineColumn.locator(`text=#${TICKET_ID}`).first().isVisible({ timeout: 5000 }).catch(() => false)
  if (inMine) {
    // 3. Mover a "En progreso" (status 3) desde la tarjeta asignada
    const mineCard = mineColumn
      .getByText(`#${TICKET_ID}`)
      .first()
      .locator('xpath=ancestor::div[.//button][1]')
    const startButton = mineCard.getByRole('button', { name: /Iniciar|En progreso|Empezar/i }).first()
    await expect(startButton).toBeVisible({ timeout: 10000 })
    await startButton.click()

    await expect(inProgressColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
      timeout: 15000,
    })
  }

  // 4. Abrir el detalle del ticket y ponerlo en pendiente
  await page.goto(`/tickets/${TICKET_ID}`)
  await page.waitForLoadState('networkidle')

  const pendingButton = page.getByRole('button', { name: /Poner en pendiente/i }).first()
  await expect(pendingButton).toBeVisible({ timeout: 10000 })
  await pendingButton.click()

  // 5. El modal está abierto: seleccionar motivo y llenar comentario
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })

  const reasonSelect = dialog.locator('select[data-testid="pending-reason-select"]').first()
  await expect(reasonSelect).toBeVisible({ timeout: 10000 })

  const textarea = dialog.locator('textarea[data-testid="pending-comment-textarea"]').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })

  const confirmButton = dialog.getByRole('button', { name: /Confirmar/i }).first()
  await expect(confirmButton).toBeDisabled()

  await reasonSelect.selectOption({ index: 1 }) // "Esperando respuesta del usuario" o "repuesto"
  await expect(confirmButton).toBeDisabled() // sin comentario debe seguir deshabilitado

  const pendingComment = 'Ticket en pendiente: esperando repuesto #ABC-123'
  await textarea.fill(pendingComment)
  await expect(confirmButton).toBeEnabled()

  // 6. Enviar y esperar la respuesta de la mutación
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/tickets/${TICKET_ID}/pending`) && r.status() === 200, { timeout: 20000 }),
    confirmButton.click(),
  ])
  expect(response.status()).toBe(200)

  // 7. Modal cerrado y feedback visible
  await expect(textarea).toHaveCount(0, { timeout: 10000 })
  await expect(dialog).toHaveCount(0, { timeout: 10000 })
  await expect(page.getByText(/Ticket puesto en pendiente/i).first()).toBeVisible({ timeout: 10000 })

  // 8. Verificar que el comentario aparece en el seguimiento (historial) del ticket
  await expect(page.getByText(pendingComment).first()).toBeVisible({ timeout: 15000 })

  // 9. Verificar que en Kanban el ticket se movió a la columna "Pendiente" (status 4)
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  const pendingColumn = page.locator('[data-column-id="pending"]')
  await expect(pendingColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 10. Reanudar: usar el botón "Retomar" en la tarjeta de Pendiente
  const pendingCard = pendingColumn
    .getByText(`#${TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
  const resumeButton = pendingCard.getByRole('button', { name: /Retomar|En progreso|Iniciar/i }).first()
  await expect(resumeButton).toBeVisible({ timeout: 10000 })
  await resumeButton.click()

  // 11. El ticket vuelve a "En progreso"
  await expect(inProgressColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 12. Resolver el ticket desde Kanban
  const resumedCard = inProgressColumn
    .getByText(`#${TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
  const resolveButton = resumedCard.getByRole('button', { name: /^Resolver$/ }).first()
  await expect(resolveButton).toBeVisible({ timeout: 10000 })
  await resolveButton.click()

  const resolveDialog = page.getByRole('dialog')
  await expect(resolveDialog).toBeVisible({ timeout: 10000 })

  const resolveTextarea = resolveDialog.locator('textarea').first()
  await expect(resolveTextarea).toBeVisible({ timeout: 10000 })

  const resolveConfirmButton = resolveDialog.getByRole('button', { name: /^Resolver$/ }).last()
  await expect(resolveConfirmButton).toBeDisabled()

  await resolveTextarea.fill('Solución aplicada exitosamente tras ciclo de pendiente (E2E)')
  await expect(resolveConfirmButton).toBeEnabled()

  await resolveConfirmButton.click()

  // 13. Modal de resolución cerrado
  await expect(resolveTextarea).toHaveCount(0, { timeout: 10000 })
  await expect(resolveDialog).toHaveCount(0, { timeout: 10000 })

  // 14. El ticket aparece en la columna "Resuelto" (status 5)
  const resolvedColumn = page.locator('[data-column-id="resolved"]')
  await expect(resolvedColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 15. Sin errores de consola
  expect(consoleErrors).toEqual([])
})
