import { test, expect } from '@playwright/test'

test('preferences UI: toggle, save, reload persists', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Ir a /preferences
  await page.goto('/preferences')
  await page.waitForLoadState('networkidle')

  // 2. Verificar que solo existe un selector de tema (tarjetas claro/oscuro)
  const lightOption = page.getByTestId('theme-option-light')
  const darkOption = page.getByTestId('theme-option-dark')
  await expect(lightOption).toBeVisible({ timeout: 10000 })
  await expect(darkOption).toBeVisible()
  await expect(page.locator('select[name="theme"], input[name="theme"]')).toHaveCount(0)

  // 3. Cambiar a dark (autoguardado con debounce H-61)
  await darkOption.click()
  await expect(darkOption).toHaveAttribute('aria-checked', 'true')

  // 4. Verificar mensaje de confirmación o toast de autoguardado
  await expect(page.getByText(/guardado|saved|actualizado/i).first()).toBeVisible({ timeout: 8000 })

  // 5. Recargar y verificar persistencia
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('theme-option-dark')).toHaveAttribute('aria-checked', 'true')

  // 6. Verificar data-theme en <html>
  const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  expect(dataTheme).toBe('dark')

  // Restaurar a light para no alterar otras pruebas
  await page.getByTestId('theme-option-light').click()
  await page.waitForTimeout(600)

  expect(consoleErrors).toEqual([])
})
