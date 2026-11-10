import { expect, type Page } from '@playwright/test'
import { randomInt } from 'node:crypto'

/** Completing a task is an explicit native operation before resolving its ticket. */
export async function completeSinglePendingTask(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  const complete = dialog.getByRole('button', { name: '✓ Completar', exact: true })
  await expect(complete).toHaveCount(1)
  await expect(complete).toBeEnabled()
  await complete.click()
  await expect(complete).toHaveCount(0, { timeout: 30_000 })
  await expect(dialog.getByRole('alert')).toHaveCount(0)
}

/**
 * A ticket cannot be resolved while it still has pending tasks, so the resolve
 * dialog disables "Resolver" and lists them with a per-task button. Complete every
 * listed task in place (0..n, whatever the fixture scheduled) before submitting.
 */
export async function completePendingTasks(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  const complete = dialog.getByRole('button', { name: /Completar/ })
  while ((await complete.count()) > 0) {
    const remaining = await complete.count()
    await complete.first().click()
    await expect(complete).toHaveCount(remaining - 1, { timeout: 30_000 })
    await expect(dialog.getByRole('alert')).toHaveCount(0)
  }
}

/** Completes the native GLPI TicketTask scheduling form after it was opened. */
export async function confirmPlanning(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /Planificación asistida|Planificar ticket/i })
  await expect(dialog).toBeVisible()
  // The dialog stays read-only until GLPI returns the ticket's tasks. A fresh
  // fixture pays the first REST session handshake (measured 3.7 s warm, more on
  // a cold GLPI), so allow well beyond the default 5 s expect timeout.
  await expect(dialog.getByTestId('plan-start')).not.toHaveValue('', { timeout: 30_000 })
  // E2E exercises a *shared* GLPI technician calendar. After enforcing real
  // overlap rejection, unrelated sequential tests must not all schedule the
  // default "now + 15 min" slot. Choose a high-entropy 2-hour block within
  // GLPI's supported TIMESTAMP range, including on Playwright retries.
  const startMillis = Date.now() + (24 + randomInt(0, 40_000) * 2) * 3_600_000
  const localTimes = await page.evaluate((millis) => {
    const formatLocal = (value: number) => {
      const d = new Date(value)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    return { start: formatLocal(millis), end: formatLocal(millis + 3_600_000) }
  }, startMillis)
  await dialog.getByTestId('plan-start').fill(localTimes.start)
  await dialog.getByTestId('plan-end').fill(localTimes.end)
  await dialog.getByTestId('plan-content').fill('Intervención técnica planificada por prueba E2E')
  await dialog.getByTestId('plan-confirm-btn').click()
  await expect(dialog).not.toBeVisible({ timeout: 20_000 })
  // An Assigned ticket creates a task ("Ticket planificado"); a Pending ticket
  // updates its existing task in place ("Ticket replanificado").
  await expect(page.getByText(/Ticket (re)?planificado/i).first()).toBeVisible()
}
