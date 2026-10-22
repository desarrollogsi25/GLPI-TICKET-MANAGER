import { test, expect } from '@playwright/test'

import { resetFixtureTicket } from './support/ticket-fixtures'

/**
 * QA audit spec for the pending-ticket flow.
 *
 * Verifies the full technician flow end to end:
 *   (storageState login as tech1) -> assign a queue ticket -> move it to
 *   "En progreso" -> open the "Poner en pendiente" modal -> select reason + comment ->
 *   submit -> the ticket must move to "Pendiente" column ->
 *   resume to "En progreso" -> resolve ->
 *   verify the pending comment appears in the ticket history.
 *
 * This spec provisions its OWN ticket (id 902) instead of reusing a shared seed
 * fixture: resolve-ticket.spec.ts already consumes #901.
 */

const TICKET_ID = 902

test.beforeEach(() => {
  resetFixtureTicket(TICKET_ID, 'QA pending-ticket fixture')
})

test('flujo pendiente: asignar -> pendiente (con comentario) -> reanudar -> resolver -> verificar historial', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // Helper: find the ticket either in queue (unassigned) or in Kanban (already assigned)
  async function ensureTicketInKanban() {
    await page.goto('/queue')
    // Wait for the queue data to load (by-group request)
    await page.waitForResponse((r) => r.url().includes('/api/tickets/by-group') && r.status() === 200)

    const inQueue = await page.locator(`text=#${TICKET_ID}`).first().isVisible({ timeout: 15000 }).catch(() => false)
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

    // Now in Kanban
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')

    const mineColumn = page.locator('[data-column-id="mine"]')
    await expect(mineColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({ timeout: 15000 })

    return mineColumn
      .getByText(`#${TICKET_ID}`)
      .first()
      .locator('xpath=ancestor::div[.//button][1]')
  }

  // 1. Cola del grupo: asignarme el ticket dedicado (si está en cola).
  const mineCard = await ensureTicketInKanban()

  // 3. Moverlo a "En progreso" (status 3) desde la tarjeta asignada.
  const startButton = mineCard.getByRole('button', { name: /Iniciar|En progreso|Empezar/i }).first()
  await expect(startButton).toBeVisible({ timeout: 10000 })
  await startButton.click()

  const inProgressColumn = page.locator('[data-column-id="in_progress"]')
  await expect(inProgressColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 4. Abrir el detalle del ticket y ponerlo en pendiente.
  const progressCard = inProgressColumn
    .getByText(`#${TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
  // Open ticket detail from in_progress column
  await progressCard.getByRole('link', { name: `#${TICKET_ID}` }).first().click()
  await page.waitForURL(`/tickets/${TICKET_ID}`)
  await page.waitForLoadState('networkidle')

  // Click "Poner en pendiente" button in detail
  const pendingButton = page.getByRole('button', { name: /Poner en pendiente/i }).first()
  await expect(pendingButton).toBeVisible({ timeout: 10000 })
  await pendingButton.click()

  // 5. El modal está abierto: hay un diálogo, select y textarea.
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })

  const reasonSelect = dialog.locator('select[data-testid="pending-reason-select"]').first()
  await expect(reasonSelect).toBeVisible({ timeout: 10000 })

  const textarea = dialog.locator('textarea[data-testid="pending-comment-textarea"]').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })

  const confirmButton = dialog.getByRole('button', { name: /Confirmar/i }).first()
  await expect(confirmButton).toBeDisabled()

  // 6. Rellenar el formulario: seleccionar motivo y escribir comentario.
  await reasonSelect.selectOption({ index: 1 }) // "Esperando pieza / repuesto"
  await expect(confirmButton).toBeDisabled() // still disabled, no comment yet

  await textarea.fill('Ticket en pendiente: esperando repuesto #ABC-123')
  await expect(confirmButton).toBeEnabled()

  // 7. Enviar el formulario.
  await confirmButton.click()

  // 8. El modal DEBE desaparecer del DOM.
  await expect(textarea).toHaveCount(0, { timeout: 15000 })
  await expect(dialog).toHaveCount(0, { timeout: 15000 })

  // 9. El ticket aparece en la columna "Pendiente" (status 4).
  const pendingColumn = page.locator('[data-column-id="pending"]')
  await expect(pendingColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 10. Feedback claro al usuario.
  await expect(page.getByText(/Ticket puesto en pendiente/i).first()).toBeVisible({ timeout: 15000 })

  // 11. Reanudar: desde el detalle del ticket en "Pendiente", volver a "En progreso".
  const pendingCard = pendingColumn
    .getByText(`#${TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
  // Open ticket detail from pending column
  await pendingCard.getByRole('link', { name: `#${TICKET_ID}` }).first().click()
  await page.waitForURL(`/tickets/${TICKET_ID}`)
  await page.waitForLoadState('networkidle')

  // Click "En progreso" button in detail (moves from Pendiente=4 to En progreso=3)
  const inProgressButton = page.getByRole('button', { name: /En progreso/i }).first()
  await expect(inProgressButton).toBeVisible({ timeout: 10000 })
  await inProgressButton.click()
  await expect(page.getByText('Estado actualizado').first()).toBeVisible({ timeout: 15000 })

  // 12. Resolver el ticket desde el detalle.
  const resolveButton = page.getByRole('button', { name: /^Resolver$/ }).first()
  await expect(resolveButton).toBeVisible({ timeout: 10000 })
  await resolveButton.click()

  const resolveDialog = page.getByRole('dialog')
  await expect(resolveDialog).toBeVisible({ timeout: 10000 })

  const resolveTextarea = resolveDialog.locator('textarea').first()
  await expect(resolveTextarea).toBeVisible({ timeout: 10000 })

  const resolveConfirmButton = resolveDialog.getByRole('button', { name: /^Resolver$/ }).last()
  await expect(resolveConfirmButton).toBeDisabled()

  await resolveTextarea.fill('Solucion aplicada tras reapertura (auditoria QA Playwright)')
  await expect(resolveConfirmButton).toBeEnabled()

  await resolveConfirmButton.click()

  // 13. El modal de resolución DEBE desaparecer del DOM.
  await expect(resolveTextarea).toHaveCount(0, { timeout: 15000 })
  await expect(resolveDialog).toHaveCount(0, { timeout: 15000 })

  // 14. El ticket aparece en la columna "Resuelto" (status 5).
  const resolvedColumn = page.locator('[data-column-id="resolved"]')
  await expect(resolvedColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 15. Verificar que el comentario de pendiente aparece en el historial del ticket.
  // Ya estamos en la página de detalle del ticket resuelto.
  await expect(page.getByText(/esperando repuesto #ABC-123/i).first()).toBeVisible({
    timeout: 15000,
  })

  // 16. Sin errores de consola.
  expect(consoleErrors).toEqual([])
})