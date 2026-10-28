import { expect, test, type Page } from '@playwright/test'

import { resetFixtureTicket } from './support/ticket-fixtures'

/**
 * BUG-031 (H-31) — regression spec for the "short solution" defect.
 *
 * Reported chain: a technician wrote a short solution ("OK"), the API answered 201 for
 * the solution and then 422 "Ticket no puede marcarse como resuelto sin solución
 * escrita" for the status change; the retry answered GLPI's 400 "El elemento ya está
 * resuelto" even though the ticket really was solved.
 *
 * Root causes reproduced against the real stack (GLPI 11 + MariaDB):
 *   1. `glpi_itilsolutions` lookup required CHAR_LENGTH(TRIM(content)) >= 10 while the
 *      API only rejects empty content and content over 2000 characters.
 *   2. GLPI 11 moves the ticket to Solved (5) on its own when an ITILSolution is
 *      created, so the legacy two-call sequence fought against itself.
 *
 * This spec runs against the real stack, so it exercises the production SQL and the
 * real GLPI side effects (no test doubles involved).
 *
 * Fixtures: #902 (UI flow) and #903 (API flow). They are reserved for this spec so it
 * can run repeatedly without interfering with the other specs (workers: 1).
 */

const UI_TICKET_ID = 902
const API_TICKET_ID = 903

/** Reads the API JWT that the app persists in localStorage after the login. */
async function readAuthToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    const raw = localStorage.getItem('glpi-ticket-manager.auth')
    if (!raw) return null
    return (JSON.parse(raw) as { state?: { token?: string } }).state?.token ?? null
  })

  expect(token, 'El technician deberia tener sesion iniciada (storageState)').toBeTruthy()
  return token as string
}

test.beforeAll(() => {
  resetFixtureTicket(UI_TICKET_ID, 'QA short-solution UI fixture')
  resetFixtureTicket(API_TICKET_ID, 'QA short-solution API fixture')
})

test('API: una solucion corta ("OK") permite marcar el ticket como resuelto', async ({ page }) => {
  await page.goto('/queue')
  const token = await readAuthToken(page)
  const headers = { Authorization: `Bearer ${token}` }

  // 1. El tecnico se hace cargo del ticket de la cola del grupo.
  const claim = await page.request.post(`/api/tickets/${API_TICKET_ID}/claim`, { headers })
  expect(claim.status()).toBe(200)

  // 2. La solucion corta se acepta (201).
  const solution = await page.request.post(`/api/tickets/${API_TICKET_ID}/solutions`, {
    headers,
    data: { content: 'OK' },
  })
  expect(solution.status()).toBe(201)

  // 3. El cambio de estado a Resuelto ya NO puede respond 422
  //    ("Ticket no puede marcarse como resuelto sin solución escrita"): la solucion
  //    escrita existe aunque sea de dos caracteres. Antes de BUG-031 contestaba 422.
  const status = await page.request.patch(`/api/tickets/${API_TICKET_ID}/status`, {
    headers,
    data: { status: 5 },
  })
  expect(status.status(), await status.text()).toBe(204)
})

test('UI: resolver con la solucion corta "OK" deja el ticket en Resuelto', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Cola del grupo: asignarme el ticket dedicado.
  await page.goto('/queue')
  await expect(page.locator(`text=#${UI_TICKET_ID}`).first()).toBeVisible({ timeout: 15000 })

  const card = page
    .getByText(`#${UI_TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const claimButton = card.getByRole('button', { name: /Asignarme/i })
  await expect(claimButton).toBeVisible()
  await claimButton.click()

  // 2. Kanban: el ticket recién asignado aparece en "Mis tickets".
  await page.goto('/kanban')
  await expect(page.locator('[data-column-id="mine"]').locator(`text=#${UI_TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 3. Moverlo a "En progreso" (status 3) para habilitar la acción de resolver.
  const mineCard = page
    .locator('[data-column-id="mine"]')
    .getByText(`#${UI_TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
  const startButton = mineCard.getByRole('button', { name: /Iniciar/i }).first()
  await expect(startButton).toBeVisible({ timeout: 10000 })
  await mineCard.hover() // H-63: los botones se revelan con hover (expansión de la tarjeta)
  await startButton.click()

  const inProgressColumn = page.locator('[data-column-id="in_progress"]')
  await expect(inProgressColumn.locator(`text=#${UI_TICKET_ID}`).first()).toBeVisible({ timeout: 15000 })

  // 4. Abrir el modal de resolución y escribir una solución corta.
  const progressCard = inProgressColumn
    .getByText(`#${UI_TICKET_ID}`)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
  const resolveButton = progressCard.getByRole('button', { name: /^Resolver$/ }).first()
  await expect(resolveButton).toBeVisible({ timeout: 10000 })
  await progressCard.hover() // H-63: los botones se revelan con hover (expansión de la tarjeta)
  await resolveButton.click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })
  const textarea = dialog.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })

  const confirmButton = dialog.getByRole('button', { name: /^Resolver$/ }).last()
  await expect(confirmButton).toBeDisabled()

  await textarea.fill('OK')
  await expect(confirmButton).toBeEnabled()

  // 5. Un único POST /resolve: la escritura de la solución y el cambio de estado son
  //    una sola operación atómica (antes eran dos llamadas que se contradecían).
  const resolveResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/tickets/${UI_TICKET_ID}/resolve`) &&
      response.request().method() === 'POST',
  )
  await confirmButton.click()

  const response = await resolveResponse
  expect(response.status(), await response.text()).toBe(200)

  // 6. El modal se cierra y el ticket aterriza en la columna "Resuelto".
  await expect(dialog).toHaveCount(0, { timeout: 15000 })
  await expect(page.locator('[data-column-id="resolved"]').locator(`text=#${UI_TICKET_ID}`).first()).toBeVisible({
    timeout: 15000,
  })

  // 7. Feedback en español y ningún error en consola.
  await expect(page.getByText(/Ticket resuelto/i).first()).toBeVisible({ timeout: 15000 })
  expect(consoleErrors).toEqual([])
})
