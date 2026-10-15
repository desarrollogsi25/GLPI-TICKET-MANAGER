import { test, expect } from '@playwright/test'

test('preferences: GET default, PUT, GET persisted', async ({ page, request }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // Usar el token guardado en localStorage por global-setup
  await page.goto('http://localhost:5173/')
  const token = await page.evaluate(() => {
    const raw = localStorage.getItem('glpi-ticket-manager.auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.state?.token ?? parsed.state?.accessToken ?? null
  })
  expect(token).toBeTruthy()

  const authHeader = { Authorization: `Bearer ${token}` }

  // 1. GET inicial
  const get1 = await request.get('http://localhost:5173/api/preferences', {
    headers: authHeader
  })
  expect(get1.status()).toBe(200)
  const body1 = await get1.json()
  expect(body1.prefs).toBeDefined()

  // 2. PUT
  const newPrefs = JSON.stringify({ theme: 'dark', lang: 'es' })
  const put = await request.put('http://localhost:5173/api/preferences', {
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    data: { prefs: newPrefs }
  })
  expect(put.status()).toBe(204)

  // 3. GET otra vez
  const get2 = await request.get('http://localhost:5173/api/preferences', {
    headers: authHeader
  })
  expect(get2.status()).toBe(200)
  const body2 = await get2.json()
  const parsed = JSON.parse(body2.prefs)
  expect(parsed.theme).toBe('dark')
  expect(parsed.lang).toBe('es')

  expect(consoleErrors).toEqual([])
})
