import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { resetFixtureTicket } from './support/ticket-fixtures'
import { runFixtureSql } from '../../../scripts/e2e/guard.mjs'

test.use({ timezoneId: 'Europe/Paris', viewport: { width: 1366, height: 900 } })

async function auth(page: Page) {
  return page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}').state
    return { headers: { Authorization: `Bearer ${state.token}` }, userId: state.user.userId }
  })
}

function nextPlanningDay(days = 1) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(Date.now() + days * 86_400_000))
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-')
}

// Native fetch avoids Playwright's failure call log copying bearer headers into reports.
async function api(page: Page, route: string, headers: Record<string, string>, payload?: unknown) {
  const method = payload === undefined ? 'GET' : 'POST'
  const started = Date.now()
  try {
    const response = await fetch(new URL(route, page.url()), { method,
      headers: { ...headers, 'Content-Type': 'application/json', 'User-Agent': await page.evaluate(() => navigator.userAgent) },
      body: payload === undefined ? undefined : JSON.stringify(payload), signal: AbortSignal.timeout(60_000) })
    console.log(`[fixture-api] ${method} ${route.split('?')[0]} ${response.status} ${Date.now() - started}ms`)
    return response
  } catch {
    throw new Error(`Fixture API ${method} ${route.split('?')[0]} failed after ${Date.now() - started}ms; headers omitted`)
  }
}

test('P1-01/P2-05: admin plans for technician, proactive conflict, adjacent slot, completion and resolution', async ({ page, browser, baseURL }, testInfo) => {
  test.setTimeout(180_000)
  const day = nextPlanningDay()
  for (const id of [9310, 9311]) resetFixtureTicket(id, `QA planning regression ${id}`)
  runFixtureSql('mariadb', `INSERT INTO glpi_tickets_users (tickets_id, users_id, type)
    SELECT 9310, id, 1 FROM glpi_users WHERE name='user1';`)
  await page.goto('/kanban')
  const tech = await auth(page)
  for (const id of [9310, 9311]) {
    const claimed = await api(page, `/api/tickets/${id}/claim`, tech.headers, {})
    expect(claimed.ok).toBeTruthy()
  }
  const adminContext = await browser.newContext({ baseURL, timezoneId: 'Europe/Paris', storageState: { cookies: [], origins: [] } })
  try {
    const admin = await adminContext.newPage()
    await admin.goto('/login')
    await admin.getByLabel('Usuario', { exact: true }).fill(process.env.E2E_ADMIN_USERNAME!)
    await admin.getByLabel('Contraseña', { exact: true }).fill(process.env.E2E_ADMIN_PASSWORD!)
    await admin.getByRole('button', { name: 'Iniciar Sesión' }).click()
    await expect(admin).not.toHaveURL(/\/login/)
    await admin.goto('/tickets/9310')
    const adminAuth = await auth(admin)
    const detailResponse = await api(admin, '/api/tickets/9310', adminAuth.headers)
    expect(detailResponse.ok).toBeTruthy()
    const detail = await detailResponse.json()
    expect(detail.requesterIds.length).toBeGreaterThan(0)
    // The detail card renders every requester in a single joined text node, so an
    // exact per-name lookup can never match when a ticket has more than one requester.
    const requestersRow = admin.getByText('Solicitantes', { exact: true }).locator('..')
    for (const id of detail.requesterIds) {
      expect(detail.participantNames[id]).toBeTruthy()
      await expect(requestersRow).toContainText(detail.participantNames[id])
      await expect(admin.getByText(`Usuario no disponible (#${id})`, { exact: true })).toHaveCount(0)
    }
    await admin.getByTestId('start-ticket-btn').click()
    const dialog = admin.getByRole('dialog', { name: /Planificación asistida/ })
    await expect(dialog.getByLabel('Técnico responsable')).toHaveValue(String(tech.userId))
    await dialog.getByTestId('plan-start').fill(`${day}T09:00`)
    await dialog.getByTestId('plan-end').fill(`${day}T10:00`)
    const expectedStart = await admin.evaluate(value => new Date(value).toISOString(), `${day}T09:00`)
    await expect(dialog.getByText('La franja seleccionada está libre.')).toBeVisible()
    await dialog.getByTestId('plan-confirm-btn').click()
    await expect(dialog).not.toBeVisible({ timeout: 30_000 })

    const tasksResponse = await api(page, '/api/tickets/9310/tasks', tech.headers)
    expect(tasksResponse.ok).toBeTruthy()
    const tasks = await tasksResponse.json()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].technicianId).toBe(tech.userId)
    expect(new Date(tasks[0].startAt).toISOString()).toBe(expectedStart)

    await admin.goto('/tickets/9311')
    await admin.getByTestId('start-ticket-btn').click()
    await dialog.getByTestId('plan-start').fill(`${day}T09:00`)
    await dialog.getByTestId('plan-end').fill(`${day}T10:00`)
    await expect(dialog.getByText('La franja seleccionada está ocupada.')).toBeVisible()
    await expect(dialog.getByTestId('plan-confirm-btn')).toBeDisabled()
    await expect(dialog.getByRole('button', { name: /Usar horario libre/ })).toContainText('10:00')
    // Every requested breakpoint must keep the modal and its controls in the viewport.
    for (const width of [360, 390, 768, 1024, 1366]) {
      await admin.setViewportSize({ width, height: 900 })
      const bounds = await dialog.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy()
      expect(await dialog.getByTestId('plan-start').evaluate(el => el.clientWidth)).toBeGreaterThanOrEqual(200)
      await dialog.evaluate(el => { el.scrollTop = 0 })
      await admin.screenshot({ path: testInfo.outputPath(`planner-${width}.png`), fullPage: true })
      await dialog.getByRole('button', { name: 'Cancelar', exact: true }).scrollIntoViewIfNeeded()
      await admin.screenshot({ path: testInfo.outputPath(`planner-footer-${width}.png`), fullPage: true })
    }
    const cancel = dialog.getByRole('button', { name: 'Cancelar', exact: true })
    await cancel.focus()
    await admin.keyboard.press('Tab')
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
    await admin.keyboard.press('Shift+Tab')
    await expect(cancel).toBeFocused()
    const a11y = await new AxeBuilder({ page: admin }).include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect.soft(a11y.violations).toEqual([])
    await dialog.getByRole('button', { name: /Usar horario libre/ }).click()
    await expect(dialog.getByTestId('plan-start')).toHaveValue(`${day}T10:00`)
    await expect(dialog.getByTestId('plan-end')).toHaveValue(`${day}T11:00`)
    await expect(dialog.getByText('La franja seleccionada está libre.')).toBeVisible()
    await dialog.getByTestId('plan-confirm-btn').click()
    await expect(dialog).not.toBeVisible({ timeout: 30_000 })

    const availabilityParams = new URLSearchParams({ technicianId: String(tech.userId),
      startAt: tasks[0].startAt, endAt: tasks[0].endAt, excludeTaskId: String(tasks[0].id) })
    const ownAvailability = await api(page, `/api/tickets/9310/availability?${availabilityParams}`, tech.headers)
    expect(ownAvailability.ok).toBeTruthy()
    const available = await ownAvailability.json()
    expect(available.available).toBe(true)
    expect(JSON.stringify(available)).not.toMatch(/ticketId|taskId|content|isPrivate/i)

    await page.goto('/tickets/9310')
    await page.getByRole('button', { name: 'Completar', exact: true }).click()
    await page.getByRole('button', { name: 'Confirmar en GLPI' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30_000 })
    const completed = await api(page, '/api/tickets/9310/tasks', tech.headers)
    expect((await completed.json())[0].state).toBe(2)
    await page.getByRole('button', { name: 'Resolver', exact: true }).click()
    await page.getByLabel('Solución', { exact: true }).fill('Intervención finalizada y verificada en fixture aislado.')
    await page.getByRole('dialog').getByRole('button', { name: 'Resolver', exact: true }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30_000 })
    const resolved = await api(page, '/api/tickets/9310', tech.headers)
    expect([5, 6]).toContain((await resolved.json()).status)
    await page.screenshot({ path: testInfo.outputPath('technician-resolved.png'), fullPage: true })
  } finally {
    await adminContext.close()
  }
})

test('P2-05: concurrent overlapping submissions reserve one executor calendar atomically', async ({ page }) => {
  test.setTimeout(90_000)
  const day = nextPlanningDay(2)
  for (const id of [9312, 9313]) resetFixtureTicket(id, `QA concurrent planning ${id}`)
  await page.goto('/kanban')
  const tech = await auth(page)
  for (const id of [9312, 9313]) {
    expect((await api(page, `/api/tickets/${id}/claim`, tech.headers, {})).ok).toBeTruthy()
  }
  const responses = await Promise.all([9312, 9313].map(id => api(page, `/api/tickets/${id}/plan`, tech.headers,
    { requestId: crypto.randomUUID(), technicianId: tech.userId,
      content: 'Atomic calendar regression', startAt: `${day}T08:00:00Z`, endAt: `${day}T09:00:00Z`, createNewTask: true })))
  expect(responses.map(response => response.status).sort()).toEqual([200, 409])
  const rejected = responses.find(response => response.status === 409)!
  expect((await rejected.json()).code).toBe('schedule_conflict')
})

test('QA-07/P2-03: filtered header and pagination both show zero matches', async ({ page }) => {
  await page.goto('/tickets?priority=6&q=QA-ZERO-MATCH-SENTINEL')
  await expect(page.getByText(/0 ticket\(s\) asignados a vos/)).toBeVisible()
  await expect(page.getByText('Página 1 de 1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeDisabled()
})

test('P3-07: another identity does not inherit filters from an expired session return URL', async ({ page }) => {
  await page.goto('/tickets?status=5')
  await expect(page).toHaveURL(/status=5/)
  // Simulate a lost local session while preserving the route the auth guard returns to.
  await page.evaluate(() => localStorage.removeItem('glpi-ticket-manager.auth'))
  await page.reload()
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('Usuario', { exact: true }).fill(process.env.E2E_ADMIN_USERNAME!)
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page).toHaveURL(/\/tickets$/)
  await expect(page.locator('#status-filter')).toContainText('Todos')
})

test('P1-02/QA-01/QA-02: Kanban columns are exclusive, group-scoped and retain closed unassigned tickets', async ({ page }) => {
  test.setTimeout(90_000)
  for (const id of [9320, 9321, 9322, 9323]) resetFixtureTicket(id, `QA exclusive columns ${id}`)
  runFixtureSql('mariadb', `UPDATE glpi_tickets SET status=2 WHERE id=9321;
    UPDATE glpi_tickets SET status=6, solvedate=NOW(), closedate=NOW() WHERE id=9322;
    UPDATE glpi_groups_tickets SET groups_id=3 WHERE tickets_id=9323 AND type=2;`)
  await page.goto('/kanban')
  // Use a fresh identity instead of the default synthetic technician session.
  await page.evaluate(() => localStorage.removeItem('glpi-ticket-manager.auth'))
  await page.reload()
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('Usuario', { exact: true }).fill(process.env.E2E_ADMIN_USERNAME!)
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page).not.toHaveURL(/\/login/)
  await page.goto('/kanban?groupId=1')
  await page.getByLabel('Seleccionar grupo de soporte').selectOption('1')
  for (const id of [9320, 9321]) {
    await expect(page.locator('[data-column-id="queue"]').getByText(`#${id}`, { exact: true })).toHaveCount(1)
    await expect(page.locator('[data-column-id="mine"]').getByText(`#${id}`, { exact: true })).toHaveCount(0)
  }
  await expect(page.locator('[data-column-id="resolved"]').getByText('#9322', { exact: true })).toHaveCount(1)
  await expect(page.getByText('#9323', { exact: true })).toHaveCount(0)
  const admin = await auth(page)
  const groupListResponse = await api(page, '/api/tickets?groupId=1&limit=1000&offset=0', admin.headers)
  expect(groupListResponse.ok).toBeTruthy()
  const groupList = await groupListResponse.json()
  expect(groupList.items).toHaveLength(groupList.total)
  await expect(page.locator('[data-column-id]').getByText(/^#\d+$/, { exact: true })).toHaveCount(groupList.total)
  const groupStatsResponse = await api(page, '/api/groups/1/dashboard', admin.headers)
  expect(groupStatsResponse.ok).toBeTruthy()
  const groupStats = await groupStatsResponse.json()
  expect(groupStats.summary.total).toBe(groupList.total)
  expect(groupStats.summary.queued).toBe(groupList.items.filter((ticket: { status: number; assigneeIds: number[] }) =>
    [1, 2].includes(ticket.status) && !ticket.assigneeIds.length).length)
  expect(groupStats.summary.assigned).toBe(groupList.items.filter((ticket: { status: number; assigneeIds: number[] }) =>
    [1, 2].includes(ticket.status) && ticket.assigneeIds.length).length)
  for (const [status, field] of [[3, 'inProgress'], [4, 'pending'], [5, 'resolved'], [6, 'closed']] as const) {
    expect(groupStats.summary[field]).toBe(groupList.items.filter((ticket: { status: number }) => ticket.status === status).length)
  }
  // The administrator's main dashboard and list both have the global scope.
  const allResponse = await api(page, '/api/tickets?limit=1000&offset=0', admin.headers)
  expect(allResponse.ok).toBeTruthy()
  const all = await allResponse.json()
  const dashboardResponse = await api(page, '/api/dashboard/stats', admin.headers)
  expect(dashboardResponse.ok).toBeTruthy()
  expect((await dashboardResponse.json()).totalTickets).toBe(all.total)
  await page.goto('/tickets')
  await expect(page.getByText(`${all.total} ticket(s) de todos los técnicos.`, { exact: true })).toBeVisible()
})
