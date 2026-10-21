import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

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

/**
 * Resets the dedicated fixture ticket to "Nuevo / unassigned in the group queue"
 * so the spec is idempotent across repeated runs. Uses the same MariaDB access
 * path documented in scripts/seed-e2e.sh, but only touches this spec's own ticket.
 */
function resetFixtureTicket() {
  let password = process.env.MARIADB_PASSWORD
  if (!password) {
    const envPaths = [resolve(process.cwd(), '../.env'), resolve(process.cwd(), '.env')]
    for (const p of envPaths) {
      if (existsSync(p)) {
        const match = readFileSync(p, 'utf8').match(/^MARIADB_PASSWORD=(.*)$/m)
        if (match) {
          password = match[1].trim()
          break
        }
      }
    }
  }

  if (!password) {
    password = 'VW9Qr7m2XSkGd0tHegGGq3hhrHcD'
  }

  const sql = [
    `INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)`,
    `VALUES (${TICKET_ID}, 0, 'QA resolve-ticket fixture', NOW(), NOW(), 1, 3, 'Fixture para resolve-ticket.spec.ts', 3, 3, 3, 1, 1, 2)`,
    `ON DUPLICATE KEY UPDATE status = 1, solvedate = NULL, closedate = NULL, date_mod = NOW();`,
    `INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (${TICKET_ID}, 1, 2)`,
    `ON DUPLICATE KEY UPDATE groups_id = 1, type = 2;`,
    `DELETE FROM glpi_tickets_users WHERE tickets_id = ${TICKET_ID} AND type = 2;`,
    `DELETE FROM glpi_itilsolutions WHERE itemtype = 'Ticket' AND items_id = ${TICKET_ID};`,
  ].join('\n')

  try {
    execFileSync(
      'docker',
      [
        'compose',
        'exec',
        '-T',
        'glpi-db',
        'mariadb',
        '-u',
        'glpi',
        `-p${password}`,
        'glpi',
        '-e',
        sql,
      ],
      { stdio: 'pipe' },
    )
  } catch (err) {
    // In CI (inside the frontend container), docker CLI is not available.
    // Ticket 901 is already pre-seeded by scripts/seed-e2e.sh before test execution.
    console.warn('[resolve-ticket.spec.ts] Notice: docker CLI not available in runner container; relying on pre-seeded fixture:', (err as Error)?.message)
  }
}

test.beforeAll(() => {
  resetFixtureTicket()
})

test('resolver ticket: el modal se cierra y el ticket pasa a Resuelto', async ({ page }) => {
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
  await resolveButton.click()

  // 5. El modal está abierto: hay un diálogo y un textarea.
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })
  const textarea = dialog.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })

  const confirmButton = dialog.getByRole('button', { name: /^Resolver$/ }).last()
  await expect(confirmButton).toBeDisabled()

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
