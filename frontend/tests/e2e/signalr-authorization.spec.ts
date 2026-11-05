import { test, expect } from '@playwright/test'
import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr'
import { runFixtureSql } from '../../../scripts/e2e/guard.mjs'
import { fixtureUrl } from './support/fixture-url'
import { resetFixtureTicket } from './support/ticket-fixtures'

test('requester technical membership cannot receive queue events through automatic or explicit hub groups', async ({ request }) => {
  test.setTimeout(60000)
  const api = fixtureUrl('api')
  const requesterPassword = process.env.E2E_REQUESTER_PASSWORD
  const technicianPassword = process.env.E2E_TECH_PASSWORD
  if (!requesterPassword || !technicianPassword || process.env.E2E_REQUESTER_USERNAME !== 'user1')
    throw new Error('The synthetic user1 fixture is required')

  resetFixtureTicket(979, 'Synthetic requester audience regression')
  const membershipId = Number(runFixtureSql('mariadb', `
    INSERT INTO glpi_groups_users (groups_id, users_id) VALUES (1, 19);
    SELECT LAST_INSERT_ID();`).trim())
  if (!Number.isSafeInteger(membershipId) || membershipId <= 0) throw new Error('Synthetic membership was not created')
  const connections: ReturnType<HubConnectionBuilder['build']>[] = []
  try {
    async function connect(username: string, password: string) {
      const response = await request.post(`${api}/api/auth/login`, { data: { username, password } })
      expect(response.status()).toBe(200)
      const session = await response.json()
      const connection = new HubConnectionBuilder().withUrl(`${api}/hubs/tickets`, {
        accessTokenFactory: () => session.accessToken,
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
      }).configureLogging(LogLevel.None).build()
      connections.push(connection)
      return { connection, token: session.accessToken as string }
    }
    const requester = await connect('user1', requesterPassword)
    const technician = await connect(process.env.E2E_TECH_USERNAME ?? 'tech1', technicianPassword)
    let observedByTechnician = false
    let reportLeak: (value: boolean) => void = () => {}
    const leak = new Promise<boolean>(resolve => { reportLeak = resolve })
    requester.connection.on('TicketClaimed', event => { if (event.ticketId === 979) reportLeak(true) })
    technician.connection.on('TicketClaimed', event => { if (event.ticketId === 979) observedByTechnician = true })
    await requester.connection.start()
    await technician.connection.start()
    await requester.connection.invoke('SubscribeToGroup', 1)

    const claim = await request.post(`${api}/api/tickets/979/claim`, {
      headers: { Authorization: `Bearer ${technician.token}` },
    })
    expect(claim.status()).toBe(200)
    await expect.poll(() => observedByTechnician, { timeout: 10000 }).toBe(true)
    // A positive control proves the event was emitted. Observe a bounded window
    // for a forbidden copy without navigating or polling the requester's UI.
    let deadline: ReturnType<typeof setTimeout> | undefined
    try {
      const leaked = await Promise.race([leak, new Promise<boolean>(resolve => {
        deadline = setTimeout(() => resolve(false), 1500)
      })])
      expect(leaked).toBe(false)
    } finally {
      if (deadline) clearTimeout(deadline)
    }
  } finally {
    await Promise.all(connections.map(connection => connection.stop()))
    runFixtureSql('mariadb', `DELETE FROM glpi_groups_users WHERE id=${membershipId} AND groups_id=1 AND users_id=19;`)
  }
})
