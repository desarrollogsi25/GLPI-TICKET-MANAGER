import { test, expect } from '@playwright/test'

test('crear ticket interno (requester = usuario autenticado)', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })


  await page.goto('http://localhost:5173/tickets')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Nuevo ticket/i }).click()
  await page.waitForTimeout(300)

  await page.fill('input#title', 'Paso E ticket interno Playwright')

  // internal is default
  await page.fill('textarea#content', 'Solicitud de acceso interno')

  await page.getByRole('button', { name: /Crear ticket/i }).click()

  await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 })
  expect(consoleErrors).toEqual([])
})