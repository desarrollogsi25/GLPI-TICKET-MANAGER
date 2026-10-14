import { test, expect } from '@playwright/test'

test('Ayuda muestra la guia del agente', async ({ page }) => {
  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'tech1')
  await page.fill('input[name="password"]', 'Tech1Pass!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue)/, { timeout: 10000 })

  await page.goto('http://localhost:5173/ayuda')
  await page.waitForLoadState('networkidle')

  await expect(page.getByText('Guía del agente')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('1. Ver tu cola')).toBeVisible()
  await expect(page.getByText('2. Asignarte un ticket')).toBeVisible()
  await expect(page.getByText('3. Crear un ticket')).toBeVisible()
  await expect(page.getByText('4. Resolver un ticket')).toBeVisible()
})
