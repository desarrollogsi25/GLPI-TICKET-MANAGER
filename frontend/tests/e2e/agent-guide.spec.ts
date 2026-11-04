import { test, expect } from '@playwright/test'

test('Ayuda muestra la guia del agente', async ({ page }) => {

  await page.goto('/ayuda')
  await page.waitForLoadState('networkidle')

  await expect(page.getByText('Guía del agente')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('1. Ver tu cola')).toBeVisible()
  await expect(page.getByText('2. Asignarte un ticket')).toBeVisible()
  await expect(page.getByText('3. Crear un ticket')).toBeVisible()
  await expect(page.getByText('4. Resolver un ticket')).toBeVisible()
})
