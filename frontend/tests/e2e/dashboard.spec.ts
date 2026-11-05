import { test, expect } from '@playwright/test'

test('Dashboard arranca y permite ir a la cola del grupo', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })


  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')

  await expect(page.getByText('Tickets en la cola')).toBeVisible({ timeout: 10000 })
  await page.getByText('Tickets en la cola').click()
  await page.waitForURL('**/queue', { timeout: 10000 })

  expect(consoleErrors).toEqual([])
})

test('Dashboard muestra selector de grupo y no usa sólo el primero', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')

  // tech1 pertenece a Desarrollo y Service Desk: el selector debe existir y
  // arrancar en el primer grupo, dejando explícito el alcance de la cola.
  const groupSelect = page.getByTestId('dashboard-group-select')
  await expect(groupSelect).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/Cola: Desarrollo/)).toBeVisible()

  await groupSelect.click()
  await page.getByRole('option', { name: 'Service Desk', exact: true }).click()

  await expect(page.getByText(/Cola: Service Desk/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Próximos en la cola de Service Desk')).toBeVisible()

  // GLPI 2 se llama «Asignado», no «En Ejecución».
  await expect(page.getByText('2. Asignado', { exact: true })).toBeVisible()
  await expect(page.getByText('En Ejecución')).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})
