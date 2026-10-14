import { test, expect } from '@playwright/test'

test('crear ticket sin asignar y aparece en la cola del grupo', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'tech1')
  await page.fill('input[name="password"]', 'Tech1Pass!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue)/, { timeout: 10000 })

  await page.goto('http://localhost:5173/tickets')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Nuevo ticket/i }).click()
  await page.waitForTimeout(400)
  await page.fill('input#title', 'TEST sin asignar')

  // Desmarcar auto-asignacion
  await page.uncheck('input#selfAssign')

  await page.getByRole('button', { name: /Crear ticket/i }).click()
  await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 })
  const url = page.url()
  const newId = Number((url.match(/\/tickets\/(\d+)/) || [])[1])
  console.log('Created unassigned ticket id:', newId)
  expect(Number.isInteger(newId) && newId > 0).toBeTruthy()

  await page.goto('http://localhost:5173/queue')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  await expect(page.getByText('TEST sin asignar')).toBeVisible({ timeout: 10000 })

  expect(consoleErrors).toEqual([])
})
