import { test, expect } from '@playwright/test'

test('preferences UI: toggle, save, reload persists', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Ir a /preferences
  await page.goto('http://localhost:5173/preferences')
  await page.waitForLoadState('networkidle')

  // 2. Verificar selector de tema
  const themeSelect = page.locator('select[name="theme"], input[name="theme"]').first()
  await expect(themeSelect).toBeAttached({ timeout: 10000 })

  // 3. Cambiar a dark (autoguardado con debounce H-61)
  await themeSelect.selectOption('dark').catch(async () => {
    await themeSelect.check()
  })

  // 4. Verificar mensaje de confirmación o toast de autoguardado
  await expect(page.getByText(/guardado|saved|actualizado/i).first()).toBeVisible({ timeout: 8000 })

  // 5. Recargar y verificar persistencia
  await page.reload()
  await page.waitForLoadState('networkidle')
  const valueAfter = await themeSelect.inputValue().catch(async () => {
    return (await themeSelect.isChecked()) ? 'dark' : 'light'
  })
  expect(valueAfter).toBe('dark')

  // 6. Verificar data-theme en <html>
  const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  expect(dataTheme).toBe('dark')

  // Restaurar a light para no alterar otras pruebas
  await themeSelect.selectOption('light').catch(async () => {
    await themeSelect.check()
  })
  await page.waitForTimeout(600)

  expect(consoleErrors).toEqual([])
})
