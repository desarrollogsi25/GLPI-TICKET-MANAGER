import { test, expect } from '@playwright/test'

import { resetFixtureTicket } from './support/ticket-fixtures'

/**
 * QA audit spec for the resolve-dialog hotfix.
 *
 * Verifies the full technician flow end to end:
 *   (storageState login as tech1) -> assign a queue ticket -> move it to
 *   "En progreso" -> open the Resolve modal -> fill the solution -> submit ->
 *   the modal must disappear from the DOM and the ticket must land in "Resuelto".
 *
 * The core regression this guards against: the dialog staying open (or re-opening)
 * after a successful mutation, and the ticket not moving to the Resuelto column.
 *
 * This spec provisions its OWN ticket (id 901) instead of reusing a shared seed
 * fixture: self-assign-flow.spec.ts already consumes #57, so resolving the same
 * ticket twice would break it (workers: 1 runs specs sequentially).
 */

const TICKET_ID = 901

test.beforeAll(() => {
  // Resets the dedicated fixture ticket to "Nuevo / unassigned in the group queue"
  // so the spec is idempotent across repeated runs. Uses the same MariaDB access
  // path documented in scripts/seed-e2e.sh, but only touches this spec's own ticket.
  resetFixtureTicket(TICKET_ID, 'QA resolve-ticket fixture')
})

test('resolver ticket: el modal se cierra y el ticket pasa a Resuelto', async ({ page }) => {
  test.setTimeout(60000)
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Cola del grupo: asignarme el ticket dedicado.
  await page.goto('/queue')
  await page.waitForLoadState('networkidle')

  await expect(page.locator(`text=#${TICKET_ID}`).first()).toBeVisible({ timeout: 15000 })

  const card = page
    .getByText(`#${TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const claimButton = card.getByRole('button', { name: /Asignarme/i })
  await expect(claimButton).toBeVisible()
  await claimButton.click()

  await expect(page.locator(`text=#${TICKET_ID}`).first()).not.toBeVisible({ timeout: 15000 })

  // 2. Kanban: el ticket recién asignado aparece en "Mis tickets".
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  const mineColumn = page.locator('[data-column-id="mine"]')
  const mineCard = mineColumn
    .getByText(`#${TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
  await expect(mineColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({ timeout: 15000 })

  // 3. Moverlo a "En progreso" (status 3) desde la tarjeta asignada.
  const startButton = mineCard.getByRole('button', { name: /Iniciar|En progreso|Empezar/i }).first()
  await expect(startButton).toBeVisible({ timeout: 10000 })
  await mineCard.hover() // H-63: los botones se revelan con hover (expansión de la tarjeta)
  await startButton.click()

  const inProgressColumn = page.locator('[data-column-id="in_progress"]')
  await expect(inProgressColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 4. Abrir el modal de resolución desde la tarjeta en progreso.
  const progressCard = inProgressColumn
    .getByText(`#${TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
  const resolveButton = progressCard.getByRole('button', { name: /^Resolver$/ }).first()
  await expect(resolveButton).toBeVisible({ timeout: 10000 })
  await progressCard.hover() // H-63: los botones se revelan con hover (expansión de la tarjeta)
  await resolveButton.click()

  // 5. El modal está abierto: hay un diálogo y un textarea.
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })
  const textarea = dialog.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })

  const confirmButton = dialog.getByRole('button', { name: /^Resolver$/ }).last()
  await expect(confirmButton).toBeEnabled()
  await textarea.focus()
  await textarea.blur()
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await confirmButton.click()
  await expect(dialog.getByRole('alert')).toContainText('La solución no puede estar vacía.')

  await textarea.fill('Solucion de prueba (auditoria QA Playwright)')
  await expect(confirmButton).toBeEnabled()

  // 6. Enviar la solución.
  await confirmButton.click()

  // 7. El modal DEBE desaparecer del DOM (fix del hotfix).
  await expect(textarea).toHaveCount(0, { timeout: 15000 })
  await expect(dialog).toHaveCount(0, { timeout: 15000 })

  // 8. El ticket aparece en la columna "Resuelto".
  const resolvedColumn = page.locator('[data-column-id="resolved"]')
  await expect(resolvedColumn.locator(`text=#${TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 9. Feedback claro al usuario.
  await expect(page.getByText(/Ticket resuelto/i).first()).toBeVisible({ timeout: 15000 })

  expect(consoleErrors).toEqual([])
})
