import { test, expect } from '@playwright/test'

test('service filter: click service, tickets list filtered', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Ir a /services
  await page.goto('/services')
  await page.waitForLoadState('networkidle')

  // 2. Encontrar el nodo "Requerimiento" y su botón "Ver tickets"
  const requerimiento = page.getByText('Requerimiento', { exact: true }).first()
  await expect(requerimiento).toBeVisible({ timeout: 10000 })

  // 3. Buscar el botón "Ver tickets" más cercano al nodo
  const seeTicketsBtn = requerimiento.locator(
    'xpath=ancestor::*[.//button[contains(normalize-space(.), "Ver tickets")]][1]//button[contains(normalize-space(.), "Ver tickets")]',
  )
  await expect(seeTicketsBtn).toBeVisible()
  await seeTicketsBtn.click()

  // 4. Verificar que la URL incluye serviceId
  await page.waitForURL(/\/tickets\?serviceId=\d+/, { timeout: 10000 })

  // 5. Verificar que aparece un badge/chip con el nombre del servicio
  await expect(page.getByText(/Filtrando por.*Requerimiento/i)).toBeVisible({ timeout: 5000 })

  // 6. Verificar que la lista muestra al menos el ticket #11
  await expect(page.locator('text=#11')).toBeVisible({ timeout: 10000 })

  // 7. Quitar el filtro → verificar que el badge desaparece
  const clearBtn = page.getByRole('button', { name: /quitar|clear/i }).first()
  if (await clearBtn.isVisible()) {
    await clearBtn.click()
    await expect(page.getByText(/Filtrando por/i)).not.toBeVisible()
  }

  expect(consoleErrors).toEqual([])
})
