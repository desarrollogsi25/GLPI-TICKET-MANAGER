import { test, expect } from '@playwright/test'

const DESK = process.env.E2E_DESK_URL ?? 'http://localhost:5173'
const TECH_USERNAME = process.env.E2E_TECH_USERNAME ?? 'tech_dev'
const TECH_PASSWORD = process.env.E2E_TECH_PASSWORD ?? 'Password123!'
const REQUESTER_USERNAME = process.env.E2E_REQUESTER_USERNAME ?? 'user_test'
const REQUESTER_PASSWORD = process.env.E2E_REQUESTER_PASSWORD ?? 'Password123!'

test('realtime: connection indicator connects and maintains real-time link across contexts', async ({ browser }) => {
  test.setTimeout(90000)
  const contextA = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const pageA = await contextA.newPage()
  await pageA.goto(`${DESK}/login`)
  await pageA.locator('input[name="username"]').fill(TECH_USERNAME)
  await pageA.locator('input[name="password"]').fill(TECH_PASSWORD)
  await pageA.locator('button[type="submit"]').click()
  await pageA.waitForURL(/kanban|dashboard|tickets|queue/)
  await pageA.goto(`${DESK}/kanban?groupId=1`)
  const kanbanGroup = pageA.getByLabel('Seleccionar grupo de soporte')
  if (await kanbanGroup.isVisible().catch(() => false)) {
    await kanbanGroup.selectOption({ label: 'Desarrollo' })
    await expect(kanbanGroup.locator('option:checked')).toHaveText('Desarrollo')
  }

  const contextB = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const pageB = await contextB.newPage()
  await pageB.goto(`${DESK}/login`)
  await pageB.locator('input[name="username"]').fill(REQUESTER_USERNAME)
  await pageB.locator('input[name="password"]').fill(REQUESTER_PASSWORD)
  await pageB.locator('button[type="submit"]').click()
  await pageB.waitForURL(/\/kanban|\/dashboard|\/tickets|\/queue/, { timeout: 15000 })
  await pageB.goto(`${DESK}/tickets`)

  // El técnico está conectado en SignalR mientras el solicitante usa otro contexto.
  await expect(pageA.getByTestId('connection-indicator').first()).toHaveAttribute(
    'data-state',
    'connected',
    { timeout: 60000 },
  )
  let pageNavigations = 0
  pageA.on('framenavigated', frame => {
    if (frame === pageA.mainFrame()) pageNavigations++
  })

  // Requester routes must not expose the technician board or queue.
  await pageB.goto(`${DESK}/tickets`)
  await pageB.waitForLoadState('networkidle')
  if (await kanbanGroup.isVisible().catch(() => false)) {
    await kanbanGroup.selectOption({ label: 'Desarrollo' })
    await expect(kanbanGroup.locator('option:checked')).toHaveText('Desarrollo')
  }
  const title = `E2E SignalR requester ${Date.now()}`
  const created = await pageB.evaluate(async (ticketTitle) => {
    const stored = JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}')
    const token = stored.state?.accessToken
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: ticketTitle,
        description: 'Ticket de prueba automatizada del evento SignalR.',
        urgency: 3,
        categoryId: 11,
      }),
    })
    return { status: response.status, body: await response.json() }
  }, title)

  expect(created.status).toBe(201)
  const ticketId = created.body.ticketId as number
  const selectedGroupId = await kanbanGroup.isVisible().catch(() => false)
    ? Number(await kanbanGroup.locator('option:checked').getAttribute('value'))
    : 1
  // GLPI can persist the assignment link shortly after the API returns; poll the
  // queue until the fixture reaches the assigned group, without a blind sleep.
  await expect.poll(async () => pageA.evaluate(async ({ groupId, id }) => {
    const stored = JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}')
    const response = await fetch(`/api/tickets/by-group?groupId=${groupId}&unassigned=true&limit=20&offset=0`, {
      headers: { Authorization: `Bearer ${stored.state?.accessToken}` },
    })
    const payload = await response.json()
    return payload.items?.some((ticket: { id: number }) => ticket.id === id) ?? false
  }, { groupId: selectedGroupId, id: ticketId }), { timeout: 60000, intervals: [500, 1000, 2000] }).toBe(true)
  // Bring the technician tab back to the foreground so React Query's normal
  // visibility-aware polling can render the now-assigned ticket.
  await pageA.bringToFront()
  await expect(pageA.locator('[data-column-id="queue"]').getByText(`#${ticketId}`)).toBeVisible({
    timeout: 15000,
  })
  expect(pageNavigations).toBe(0)

  await contextA.close()
  await contextB.close()
})
