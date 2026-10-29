import { test, expect } from '@playwright/test'

test('logout: revokes token, subsequent calls return 401', async ({ request }) => {
  // Login FRESCO (no usar storageState para no invalidar tech1)
  const login = await request.post('/api/auth/login', {
    data: { username: 'tech1', password: 'Tech1Pass!' }
  })
  expect(login.status()).toBe(200)
  const { accessToken } = await login.json()
  expect(accessToken).toBeTruthy()

  const authHeader = { Authorization: `Bearer ${accessToken}` }

  // 1. Verificar que el token funciona
  const before = await request.get('/api/auth/me', {
    headers: authHeader
  })
  expect(before.status()).toBe(200)

  // 2. Logout
  const logout = await request.post('/api/auth/logout', {
    headers: authHeader
  })
  expect(logout.status()).toBe(204)

  // 3. Verificar que el token fue revocado
  const after = await request.get('/api/auth/me', {
    headers: authHeader
  })
  expect(after.status()).toBe(401)

  // 4. Idempotencia: logout otra vez con el mismo token → 401 (ya no pasa 
  //    el OnTokenValidated)
  const logout2 = await request.post('/api/auth/logout', {
    headers: authHeader
  })
  expect(logout2.status()).toBe(401)
})
