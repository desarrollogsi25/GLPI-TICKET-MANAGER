import { test, expect } from '@playwright/test'

// Usar storageState vacío para este test: hacemos login fresco
test.use({ storageState: { cookies: [], origins: [] } })

test('logout UI: click button, redirects to login, token revoked', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('401')) {
      consoleErrors.push(msg.text())
    }
  })

  // 1. Login fresco vía UI
  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'tech1')
  await page.fill('input[name="password"]', 'Tech1Pass!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue|services)/, { timeout: 10000 })

  // Capturar el token del localStorage
  const token = await page.evaluate(() => {
    const raw = localStorage.getItem('glpi-ticket-manager.auth')
    if (!raw) return null
    return JSON.parse(raw).state?.accessToken ?? null
  })
  expect(token).toBeTruthy()

  // 2. Click en logout
  const logoutBtn = page.locator('button[aria-label="Cerrar sesión"], button:has-text("Cerrar sesión"), [data-testid="logout-btn"]').first()
  await expect(logoutBtn).toBeVisible({ timeout: 5000 })
  await logoutBtn.click()

  // 3. Verificar redirección a /login
  await page.waitForURL(/\/login/, { timeout: 10000 })

  // 4. Verificar que el token fue revocado (401)
  const resp = await page.request.get('http://localhost:5173/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  })
  expect(resp.status()).toBe(401)

  // 5. Verificar que localStorage está limpio
  const tokenAfter = await page.evaluate(() => {
    const raw = localStorage.getItem('glpi-ticket-manager.auth')
    if (!raw) return null
    try { return JSON.parse(raw).state?.accessToken ?? null } catch { return null }
  })
  expect(tokenAfter).toBeFalsy()

  expect(consoleErrors).toEqual([])
})
