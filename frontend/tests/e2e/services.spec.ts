import { test, expect } from '@playwright/test'

test('services: shows hierarchical catalog', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/services')
  await page.waitForLoadState('networkidle')

  // Verificar categorías raíz
  await expect(page.getByText('Requerimiento', { exact: true })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Aplicaciones', { exact: true })).toBeVisible()
  await expect(page.getByText('Sistema', { exact: true })).toBeVisible()

  // Verificar subcategorías (hijos de Requerimiento)
  await expect(page.getByText('Acceso a sistema', { exact: true })).toBeVisible()
  await expect(page.getByText('Software', { exact: true })).toBeVisible()

  expect(consoleErrors).toEqual([])
})
