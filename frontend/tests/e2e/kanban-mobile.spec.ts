import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 375, height: 667 } })

test('kanban mobile: segmented tabs + assign flow', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  // 1. Segmented tabs visibles
  await expect(page.getByTestId('kanban-tab-queue')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('kanban-tab-mine')).toBeVisible()
  await expect(page.getByTestId('kanban-tab-in_progress')).toBeVisible()
  await expect(page.getByTestId('kanban-tab-pending')).toBeVisible()
  await expect(page.getByTestId('kanban-tab-resolved')).toBeVisible()

  // 2. Tab activa por defecto (queue si no hay tickets en progreso)
  const queueTab = page.getByTestId('kanban-tab-queue')
  await expect(queueTab).toHaveAttribute('aria-selected', 'true')

  // 3. Ticket en cola dedicado a este spec (el seed reserva #61 para kanban-mobile).
  // H-20: no reclamar "el primer ticket" de la lista: ese ticket era #57, que
  // pertenecía a self-assign-flow.spec.ts, y rompía ese spec al consumirlo.
  const mobileList = page.locator('[data-testid="kanban-mobile-list"]')
  const ticketToClaim = '#61'
  const ticketBadge = mobileList.getByText(ticketToClaim, { exact: true }).first()
  await expect(ticketBadge).toBeVisible({ timeout: 10000 })

  // 4. Tap en "Asignarme" inline del ticket dedicado de la cola
  const claimBtn = ticketBadge
    .locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Asignarme")]][1]')
    .getByRole('button', { name: 'Asignarme' })
  await expect(claimBtn).toBeVisible()
  await claimBtn.click()

  // 5. Esperar confirmación de asignación (toast) y cambiar a tab "Mis tickets"
  await expect(page.getByText(/Ticket asignado correctamente/i)).toBeVisible({ timeout: 10000 })
  const mineTab = page.getByTestId('kanban-tab-mine')
  await mineTab.click()
  await expect(mineTab).toHaveAttribute('aria-selected', 'true')

  // 6. Verificar que el ticket está en "Mis tickets"
  await expect(mobileList.getByText(ticketToClaim).first()).toBeVisible({ timeout: 10000 })

  // 7. Swipe a "En progreso" (drag en la lista)
  const list = page.locator('[data-testid="kanban-mobile-list"]')
  try {
    const box = await list.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width - 20, box.y + 40)
      await page.mouse.down()
      await page.mouse.move(box.x + 20, box.y + 40, { steps: 5 })
      await page.mouse.up()
      await page.waitForTimeout(300)
    }
  } catch {
    await list.dragTo(list, { targetPosition: { x: -300, y: 0 }, timeout: 1000 }).catch(() => {
      // Fallback si no funciona drag
    })
  }

  expect(consoleErrors).toEqual([])
})
