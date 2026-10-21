import { test, expect } from '@playwright/test'

test('realtime: connection indicator connects and maintains real-time link across contexts', async ({ browser }) => {
  const contextA = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const pageA = await contextA.newPage()
  await pageA.goto('http://localhost:5173/login')
  await pageA.locator('input[name="username"]').fill('tecnico_test1')
  await pageA.locator('input[name="password"]').fill('Tec123!')
  await pageA.locator('button[type="submit"]').click()
  await pageA.waitForURL(/kanban|dashboard|tickets|queue/)
  await pageA.goto('http://localhost:5173/kanban')
  const kanbanGroup = pageA.getByLabel('Seleccionar grupo de soporte')
  await expect(kanbanGroup).toBeVisible()
  await kanbanGroup.selectOption({ label: 'Hardware' })
  await expect(kanbanGroup.locator('option:checked')).toHaveText('Hardware')

  const contextB = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const pageB = await contextB.newPage()
  await pageB.goto('http://localhost:5173/login')
  await pageB.locator('input[name="username"]').fill('solicitante_test')
  await pageB.locator('input[name="password"]').fill('Soli123!')
  await pageB.locator('button[type="submit"]').click()
  await pageB.waitForURL(/\/tickets/, { timeout: 15000 })

  // El técnico está conectado en SignalR mientras el solicitante usa otro contexto.
  await expect(pageA.getByTestId('connection-indicator').first()).toHaveAttribute(
    'data-state',
    'connected',
    { timeout: 10000 },
  )
  let pageNavigations = 0
  pageA.on('framenavigated', frame => {
    if (frame === pageA.mainFrame()) pageNavigations++
  })

  // Requester routes must not expose the technician board or queue.
  await pageB.goto('http://localhost:5173/kanban')
  await expect(pageB).toHaveURL(/\/tickets$/)
  await pageB.goto('http://localhost:5173/queue')
  await expect(pageB).toHaveURL(/\/tickets$/)

  // Create a ticket from the requester's authenticated browser context. The
  // technician Kanban must receive TicketCreated and render it without reload.
  await pageB.goto('http://localhost:5173/tickets')
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
  const queuePayload = await pageA.evaluate(async (groupId) => {
    const stored = JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}')
    const response = await fetch(`/api/tickets/by-group?groupId=${groupId}&unassigned=true&limit=20&offset=0`, {
      headers: { Authorization: `Bearer ${stored.state?.accessToken}` },
    })
    return response.json()
  }, Number(await kanbanGroup.locator('option:checked').getAttribute('value').catch(() => '7')))
  expect(queuePayload.items?.some((ticket: { id: number }) => ticket.id === ticketId), JSON.stringify(queuePayload)).toBeTruthy()
  await expect(pageA.locator('[data-column-id="queue"]').getByText(`#${ticketId}`)).toBeVisible({
    timeout: 3000,
  })
  expect(pageNavigations).toBe(0)

  await contextA.close()
  await contextB.close()
})
