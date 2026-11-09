import { test, expect } from '@playwright/test'

import { resetFixtureTicket } from './support/ticket-fixtures'
import { completeSinglePendingTask, confirmPlanning } from './support/planning'

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

  // 1. Cola del grupo: asignarme el ticket dedicado. The fixture always resets it
  // to New + group 1 without technician, so a missing card is a real failure.
  await page.goto('/queue')
  await page.waitForResponse((r) => r.url().includes('/api/tickets/by-group') && r.status() === 200)

  const queueCard = page
    .getByText(`#${TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const claimButton = queueCard.getByRole('button', { name: /Asignarme/i })
  await expect(claimButton).toBeVisible({ timeout: 10000 })
  const [claimResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/tickets/${TICKET_ID}/claim`) && r.request().method() === 'POST'),
    claimButton.click(),
  ])
  expect(claimResponse.status()).toBe(200)
  await expect(page.locator(`text=#${TICKET_ID}`).first()).not.toBeVisible({ timeout: 15000 })

  // 2. Kanban: the claim write must be visible as an assigned card before planning.
  // `locator.isVisible()` returns immediately (its timeout is ignored), so the
  // previous conditional check raced the list query and skipped step 3 entirely.
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  const mineColumn = page.locator('[data-column-id="mine"]')
  const inProgressColumn = page.locator('[data-column-id="in_progress"]')

  await expect(mineColumn.getByText(`#${TICKET_ID}`).first()).toBeVisible({ timeout: 15000 })

  // 3. Plan a real GLPI TicketTask so the ticket reaches En proceso (status 3)
  // with a TODO task; Pending must then resume that same task.
  {
    const mineCard = mineColumn
      .getByText(`#${TICKET_ID}`)
      .first()
      .locator('xpath=ancestor::div[.//button][1]')
    const startButton = mineCard.getByRole('button', { name: /Planificar/i }).first()
    await expect(startButton).toBeVisible({ timeout: 10000 })
    await mineCard.hover() // H-63: los botones se revelan con hover (expansión de la tarjeta)
    await startButton.click()
    await confirmPlanning(page)

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
  await reasonSelect.focus()
  await textarea.focus()
  await confirmButton.focus()
  await expect(dialog.getByRole('alert')).toHaveCount(0)

  let pendingRequests = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes(`/api/tickets/${TICKET_ID}/pending`)) {
      pendingRequests += 1
    }
  })
  await confirmButton.click()
  await expect(dialog.getByRole('alert')).toContainText([
    'El motivo es obligatorio.',
    'El comentario no puede estar vacío.',
  ])
  expect(pendingRequests).toBe(0)

  await reasonSelect.selectOption({ index: 1 }) // "Esperando respuesta del usuario" o "repuesto"
  await confirmButton.click()
  await expect(dialog.getByRole('alert')).toContainText(['El comentario no puede estar vacío.'])
  expect(pendingRequests).toBe(0)

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

  // Al pausar, GLPI solo permite reanudar a Asignado (2), nunca un PATCH directo
  // a Planificado (3). La UI debe ofrecer el camino real sin proponer un 409.
  await expect(page.getByTestId('resume-waiting-ticket-btn')).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Asignado', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'En proceso (planificado)', exact: true })).toBeDisabled()

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
  const resumeButton = pendingCard.getByRole('button', { name: /Replanificar/i }).first()
  await expect(resumeButton).toBeVisible({ timeout: 10000 })
  await pendingCard.hover() // H-63: los botones se revelan con hover (expansión de la tarjeta)
  await resumeButton.click()

  // The Pending ticket already has a scheduled GLPI task: the dialog must offer
  // reprogramming it in place (traceability, no duplicate task) instead of
  // failing with an opaque 409.
  const resumeDialog = page.getByRole('dialog', { name: /Planificación asistida|Planificar ticket/i })
  await expect(resumeDialog.getByText('Reprogramar tarea existente')).toBeVisible({ timeout: 30_000 })
  await expect(resumeDialog.getByRole('alert')).toHaveCount(0)

  await confirmPlanning(page)

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
  await resumedCard.hover() // H-63: los botones se revelan con hover (expansión de la tarjeta)
  await resolveButton.click()

  const resolveDialog = page.getByRole('dialog')
  await expect(resolveDialog).toBeVisible({ timeout: 10000 })
  await completeSinglePendingTask(page)

  const resolveTextarea = resolveDialog.locator('textarea').first()
  await expect(resolveTextarea).toBeVisible({ timeout: 10000 })

  const resolveConfirmButton = resolveDialog.getByRole('button', { name: /^Resolver$/ }).last()
  await resolveTextarea.focus()
  await resolveConfirmButton.focus()
  await expect(resolveDialog.getByRole('alert')).toHaveCount(0)
  await resolveConfirmButton.click()
  await expect(resolveDialog.getByRole('alert')).toContainText('La solución no puede estar vacía.')

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
