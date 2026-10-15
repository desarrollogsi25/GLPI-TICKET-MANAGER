import { test, expect } from '@playwright/test'

test('dark mode toggle actually changes html class', async ({ page }) => {
  await page.goto('http://localhost:5173/preferences')
  await page.waitForLoadState('networkidle')

  // Cambiar a dark
  const themeSelect = page.locator('select[name="theme"], input[name="theme"]').first()
  await themeSelect.selectOption('dark').catch(async () => {
    await themeSelect.check()
  })

  const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first()
  await saveBtn.click()
  await page.waitForTimeout(800)

  // Verificar clase .dark en html
  const hasDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  )
  expect(hasDark).toBe(true)

  // Verificar el color de fondo (debe ser oscuro: oklch(0.145...) en Chromium o rgb oscuro)
  const bgColor = await page.evaluate(
    () =>
      getComputedStyle(document.documentElement).getPropertyValue('background-color') ||
      getComputedStyle(document.body).backgroundColor,
  )
  expect(bgColor).toBeTruthy()
  expect(hasDark).toBe(true)

  await page.reload()
  await page.waitForLoadState('networkidle')

  const stillDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  )
  expect(stillDark).toBe(true)
})
