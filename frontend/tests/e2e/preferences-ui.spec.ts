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

  // 3. Cambiar a dark
  await themeSelect.selectOption('dark').catch(async () => {
    await themeSelect.check()
  })

  // 4. Guardar o verificar autoguardado
  const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first()
  if (await saveBtn.isVisible()) {
    await saveBtn.click()
  }

  // 5. Verificar mensaje de confirmación
  await expect(page.getByText(/guardado|saved|actualizado/i).first()).toBeVisible({ timeout: 8000 })

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

  // Restaurar a light para no alterar otras pruebas
  await themeSelect.selectOption('light').catch(async () => {
    await themeSelect.check()
  })
  if (await saveBtn.isVisible()) {
    await saveBtn.click()
  }

  expect(consoleErrors).toEqual([])
})
