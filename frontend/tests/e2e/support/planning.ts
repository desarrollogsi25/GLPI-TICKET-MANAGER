import { expect, type Page } from '@playwright/test'

/** Completes the native GLPI TicketTask scheduling form after it was opened. */
export async function confirmPlanning(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /Planificar ticket/i })
  await expect(dialog).toBeVisible()
  await dialog.getByTestId('plan-content').fill('Intervención técnica planificada por prueba E2E')
  await expect(dialog.getByTestId('plan-start')).not.toHaveValue('')
  await expect(dialog.getByTestId('plan-end')).not.toHaveValue('')
  await dialog.getByTestId('plan-confirm-btn').click()
  await expect(dialog).not.toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/Ticket planificado/i).first()).toBeVisible()
}
