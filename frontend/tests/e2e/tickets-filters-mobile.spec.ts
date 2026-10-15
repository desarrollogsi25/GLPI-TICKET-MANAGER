import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 375, height: 667 } })

test('tickets filters mobile: open, apply, update list, escape close', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('http://localhost:5173/tickets')
  await page.waitForLoadState('networkidle')

  // 1. Botón "Filtros" visible en móvil
  const filtersBtn = page.getByTestId('filters-open-btn')
  await expect(filtersBtn).toBeVisible({ timeout: 10000 })

  // 2. Click abre bottom sheet
  await filtersBtn.click()
  const sheet = page.getByTestId('filters-sheet')
  await expect(sheet).toBeVisible({ timeout: 5000 })

  // 3. Seleccionar un filtro de estado dentro del sheet
  const statusSelect = sheet.locator('#sheet-status-filter')
  await expect(statusSelect).toBeVisible()
  await statusSelect.selectOption('1')

  // 4. Click en "Aplicar filtros" cierra el sheet y actualiza la lista
  const applyBtn = sheet.getByRole('button', { name: /Aplicar filtros/i })
  await expect(applyBtn).toBeVisible()
  await applyBtn.click()

  // Sheet debe cerrarse
  await expect(sheet).not.toBeVisible({ timeout: 5000 })

  // La URL debe reflejar el filtro
  await expect(page).toHaveURL(/status=1/)

  // 5. Abrir de nuevo y probar Escape para cerrar
  await filtersBtn.click()
  await expect(sheet).toBeVisible({ timeout: 5000 })
  await page.keyboard.press('Escape')
  await expect(sheet).not.toBeVisible({ timeout: 5000 })

  expect(consoleErrors).toEqual([])
})
