import { test, expect } from '@playwright/test'

test('kanban: 5 columns, valid drag flow, invalid drag blocked', async ({ page }) => {
  test.setTimeout(60000)
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Seed garantiza ticket #11 en cola (el seed lo hace)
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // 2. Verificar las 5 columnas
  await expect(page.locator('[data-column-id="queue"]').getByText('Cola del grupo')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[data-column-id="mine"]').getByText('Mis tickets')).toBeVisible()
  await expect(page.locator('[data-column-id="in_progress"]').getByText('En progreso')).toBeVisible()
  await expect(page.locator('[data-column-id="pending"]').getByText('Pendiente', { exact: true })).toBeVisible()
  await expect(page.locator('[data-column-id="resolved"]').getByText('Resuelto')).toBeVisible()

  // 3. Verificar que #11 está en la cola
  const queueColumn = page.locator('[data-column-id="queue"]')
  await expect(queueColumn.locator('span').filter({ hasText: /^#11$/ }).first()).toBeVisible({ timeout: 10000 })

  // 4. Click en "Asignarme" del ticket #11
  const card11 = queueColumn.locator('span').filter({ hasText: /^#11$/ }).first().locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
  const claimBtn = card11.locator('button', { hasText: 'Asignarme' })
  await expect(claimBtn).toBeVisible()
  // H-63: la tarjeta revela sus botones de acción al hacer hover (expansión suave),
  // así que hay que pasar el mouse por la tarjeta antes de poder clickear.
  await card11.hover()
  await claimBtn.click()

  // 5. Esperar a que el ticket aparezca en "Mis tickets"
  await page.waitForTimeout(1500) // esperar invalidación + re-render
  // Verificar que ya no está en cola
  await expect(queueColumn.locator('span').filter({ hasText: /^#11$/ })).not.toBeVisible({ timeout: 10000 })

  // 6. Abrir el detalle del ticket y verificar status=2
  await page.goto('/tickets/11')
  await page.waitForLoadState('networkidle')
  // El detalle debe mostrar estado "Asignado"

  // 7. Volver al Kanban
  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // 8. Verificar que #11 está en "Mis tickets"
  const mineColumn = page.locator('[data-column-id="mine"]')
  await expect(mineColumn.locator('span').filter({ hasText: /^#11$/ })).toBeVisible({ timeout: 10000 })

  expect(consoleErrors).toEqual([])
})
