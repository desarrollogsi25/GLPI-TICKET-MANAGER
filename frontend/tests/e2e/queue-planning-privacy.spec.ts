import { test, expect } from '@playwright/test'
import { runFixtureSql } from '../../../scripts/e2e/guard.mjs'
import { resetFixtureTicket } from './support/ticket-fixtures'

test('group queue never exposes private planning metadata', async ({ page }) => {
  resetFixtureTicket(906, 'Private planning regression')
  runFixtureSql('mariadb', `INSERT INTO glpi_tickettasks
    (tickets_id, users_id, users_id_tech, content, is_private, state, \`begin\`, \`end\`, actiontime)
    VALUES (906, 7, 7, 'PRIVATE-PLANNING-MARKER', 1, 1,
      '2030-01-01 10:00:00', '2030-01-01 11:00:00', 3600);`)
  await page.goto('/queue')
  const token = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}').state?.token)
  expect(token).toBeTruthy()
  const response = await page.request.get('/api/tickets/by-group?groupId=1&limit=100', {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(response.status()).toBe(200)
  const body = await response.json()
  const ticket = body.items.find((item: { id: number }) => item.id === 906)
  expect(ticket).toBeTruthy()
  expect(ticket.nextPlannedAt).toBeNull()
  expect(ticket.nextPlannedTechnicianId).toBeNull()
  expect(ticket.nextPlannedDuration).toBeNull()
  expect(ticket.nextPlannedComment).toBeNull()
  expect(JSON.stringify(body)).not.toContain('PRIVATE-PLANNING-MARKER')
})

test('Ticket Manager rejects direct ticket creation', async ({ page }) => {
  await page.goto('/kanban')
  const token = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('glpi-ticket-manager.auth') ?? '{}').state?.token)
  expect(token).toBeTruthy()
  const response = await page.request.post('/api/tickets', {
    headers: { Authorization: `Bearer ${token}` },
    data: { title: 'Must not be created', description: 'Forbidden entry point', urgency: 3, categoryId: 1 },
  })
  expect(response.status()).toBe(405)
  await expect(page.getByRole('link', { name: /crear ticket|nuevo ticket/i })).toHaveCount(0)
})
