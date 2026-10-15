import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 375, height: 667 } })

test('kanban mobile: segmented tabs + assign flow', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('http://localhost:5173/kanban')
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

  // 3. Ticket en cola (#61 o #11 si está disponible en cola o primer ticket de la cola)
  const mobileList = page.locator('[data-testid="kanban-mobile-list"]')
  const hasTicket61 = await mobileList.getByText('#61').first().isVisible()
  const hasTicket11 = await mobileList.getByText('#11').first().isVisible()
  const ticketToClaim = hasTicket61
    ? '#61'
    : hasTicket11
      ? '#11'
      : (await mobileList.locator('span:text-matches("^#\\\\d+$")').first().innerText()).trim()

  await expect(mobileList.getByText(ticketToClaim).first()).toBeVisible()

  // 4. Tap en "Asignarme" inline (no botón full-width)
  const claimBtn = page.getByRole('button', { name: /Asignarme/i }).first()
  await expect(claimBtn).toBeVisible()
  await claimBtn.click()

  // 5. Cambiar a tab "Mis tickets" (tap)
  await page.getByTestId('kanban-tab-mine').click()
  await page.waitForTimeout(800)

  // 6. Verificar que el ticket está en "Mis tickets"
  await expect(page.locator('[data-testid="kanban-mobile-list"]').getByText(ticketToClaim).first()).toBeVisible({ timeout: 5000 })

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
