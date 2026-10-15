import { test, expect } from '@playwright/test'

test('preferences UI: toggle, save, reload persists', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Ir a /preferences
  await page.goto('http://localhost:5173/preferences')
  await page.waitForLoadState('networkidle')

  // 2. Verificar toggles
  const themeSelect = page.locator('select[name="theme"], input[name="theme"]').first()
  const densitySelect = page.locator('select[name="density"], input[name="density"]').first()
  await expect(themeSelect).toBeVisible({ timeout: 10000 })
  await expect(densitySelect).toBeVisible()

  // 3. Cambiar a dark
  await themeSelect.selectOption('dark').catch(async () => {
    await themeSelect.check()
  })

  // 4. Guardar
  const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first()
  await saveBtn.click()

  // 5. Verificar mensaje de confirmación
  await expect(page.getByText(/guardado|saved/i)).toBeVisible({ timeout: 8000 })

  // 6. Recargar y verificar persistencia
  await page.reload()
  await page.waitForLoadState('networkidle')
  const valueAfter = await themeSelect.inputValue().catch(async () => {
    return (await themeSelect.isChecked()) ? 'dark' : 'light'
  })
  expect(valueAfter).toBe('dark')

  // 7. Verificar data-theme en <html>
  const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  expect(dataTheme).toBe('dark')

  expect(consoleErrors).toEqual([])
})
