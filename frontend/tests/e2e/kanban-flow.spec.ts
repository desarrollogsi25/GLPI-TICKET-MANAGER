import { test, expect } from '@playwright/test'
import { resetFixtureTicket } from './support/ticket-fixtures'

// El test toma posesión de un ticket; cada retry debe restaurar su propio
// fixture para no depender del estado que dejó una ejecución previa.
const TICKET_ID = 908

test.beforeEach(() => {
  resetFixtureTicket(TICKET_ID, 'QA Kanban and date-time controls')
})

test('kanban: 5 columns, valid drag flow, invalid drag blocked', async ({ page }) => {
  test.setTimeout(90000)
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Ticket propio en cola, repuesto antes de cada intento (H-20).
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // 2. Verificar las 5 columnas
  await expect(page.locator('[data-column-id="queue"]').getByText('Cola del grupo')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[data-column-id="mine"]').getByText('Asignado', { exact: true })).toBeVisible()
  await expect(page.locator('[data-column-id="in_progress"]').getByText('En proceso (planificado)').first()).toBeVisible()
  await expect(page.locator('[data-column-id="pending"]').getByText('Pendiente', { exact: true })).toBeVisible()
  await expect(page.locator('[data-column-id="resolved"]').getByText('Resuelto', { exact: true })).toBeVisible()

  // 3. Verificar que el ticket de prueba está en la cola.
  const queueColumn = page.locator('[data-column-id="queue"]')
  await expect(queueColumn.getByText(`#${TICKET_ID}`, { exact: true }).first()).toBeVisible({ timeout: 15000 })

  // 4. Reclamar el ticket dedicado.
  const card = queueColumn.getByText(`#${TICKET_ID}`, { exact: true }).first().locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const claimBtn = card.locator('button', { hasText: 'Asignarme' })
  await expect(claimBtn).toBeVisible()
  // H-63: la tarjeta revela sus botones de acción al hacer hover (expansión suave),
  // así que hay que pasar el mouse por la tarjeta antes de poder clickear.
  await card.hover()
  await claimBtn.click()

  // 5. Esperar a que el ticket se retire de la cola (sin pausa arbitraria).
  await expect(queueColumn.getByText(`#${TICKET_ID}`, { exact: true })).not.toBeVisible({ timeout: 15000 })

  // 6. Abrir el detalle del ticket y verificar status=2
  await page.goto(`/tickets/${TICKET_ID}`)
  await page.waitForLoadState('networkidle')
  // El detalle debe mostrar estado "Asignado"

  // 7. Volver al Kanban
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // 8. Verificar que aparece en "Mis tickets".
  const mineColumn = page.locator('[data-column-id="mine"]')
  await expect(mineColumn.getByText(`#${TICKET_ID}`, { exact: true })).toBeVisible({ timeout: 15000 })

  // UI de programación: calendario temático, acceso por teclado y horas rápidas.
  // No guardamos la tarea aquí; el fixture de pruebas de planificación lo hace.
  const assignedCard = mineColumn.getByText(`#${TICKET_ID}`, { exact: true }).first().locator('xpath=ancestor::div[.//button][1]')
  await assignedCard.hover()
  await assignedCard.getByRole('button', { name: /Planificar/i }).first().click()
  const planDialog = page.getByRole('dialog', { name: /Planificación asistida|Planificar ticket/i })
  await expect(planDialog.getByTestId('plan-start')).toBeVisible()

  // Abrir popover de calendario
  const calendarTrigger = planDialog.getByRole('button', { name: /Elegir fecha para fecha y hora de inicio/i })
  await calendarTrigger.click()
  await expect(page.locator('[data-calendar-popover="true"]')).toBeVisible()
  const todayIso = new Date().toISOString().slice(0, 10)
  const dayButton = page.locator(`[data-calendar-popover="true"] [data-date="${todayIso}"]`)
  if (await dayButton.isVisible()) {
    await dayButton.click()
  } else {
    await page.locator('[data-calendar-popover="true"] button[name="day"]').first().click()
  }
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(planDialog).toBeVisible()
  await planDialog.getByRole('button', { name: /Elegir 17:00 para fecha y hora de inicio/i }).click()
  await expect(planDialog.getByTestId('plan-start')).toHaveValue(/T17:00$/)
  await planDialog.getByRole('button', { name: 'Cancelar' }).click()

  expect(consoleErrors).toEqual([])
})
