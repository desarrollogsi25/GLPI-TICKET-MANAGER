import { expect, type Page } from '@playwright/test'
import { randomInt } from 'node:crypto'

/** Completes the native GLPI TicketTask scheduling form after it was opened. */
export async function confirmPlanning(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /Planificar ticket/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByTestId('plan-start')).not.toHaveValue('')
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
  await expect(page.getByText(/Ticket planificado/i).first()).toBeVisible()
}
