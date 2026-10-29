import { test, expect } from '@playwright/test'

import { resetFixtureTicket } from './support/ticket-fixtures'

/**
 * H-20: this spec owns a ticket created for this exact run instead of a fixed
 * seed id (#57). The fixed id was fragile: `kanban-mobile.spec.ts` runs earlier
 * and claims "the first" queue card, which used to be #57 once #11 had been
 * claimed, so this spec then found no #57 in the queue. A per-run id + name
 * cannot be consumed by another spec.
 */
const RUN_TAG = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const TICKET_ID = 900_000 + Math.floor(Math.random() * 90_000)
const TICKET_NAME = `E2E self-assign ${RUN_TAG}`
const TICKET_BADGE = `#${TICKET_ID}`

test.beforeAll(() => {
  // Idempotent across retries: resets only this spec's own ticket to "Nuevo".
  resetFixtureTicket(TICKET_ID, TICKET_NAME)
})

test('flujo completo: cola -> asignarme -> resolver con solucion', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/queue')
  await page.waitForLoadState('networkidle')

  await expect(page.locator(`text=${TICKET_BADGE}`).first()).toBeVisible({ timeout: 15000 })

  const card = page
    .getByText(TICKET_BADGE)
    .first()
    .locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const claimButton = card.getByRole('button', { name: /Asignarme/i })
  await expect(claimButton).toBeVisible()
  await claimButton.click()

  await expect(page.locator(`text=${TICKET_BADGE}`).first()).not.toBeVisible({ timeout: 15000 })

  await page.goto(`/tickets/${TICKET_ID}`)
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
