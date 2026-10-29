import { test, expect } from '@playwright/test'
import { fixtureUrl } from './support/fixture-url'

const DESK = fixtureUrl('desk')

/**
 * BUG-032 / H-32 — regression guard for the Kanban polling.
 *
 * `GET /api/tickets/by-group` is protected by the `Expensive` rate-limit policy,
 * whose production bucket allows 20 requests/minute per user (20 tokens, one
 * token every 3 s). Before the fix the board asked for the group queue every
 * 1.5 s (40 requests/minute) *and* ran its own 30 s timer on top of it, so the
 * client asked for twice the sustainable rate and the API answered 429 — a
 * correct answer to an incorrect client.
 *
 * After the fix the board is fed by the SignalR hub and the polling only exists
 * as a fallback for when the realtime connection is down. This test proves the
 * first half: while the hub is connected, the board must not ask for the queue
 * periodically.
 */
test('kanban: the group queue is not polled while the realtime connection is up', async ({ page }) => {
  test.setTimeout(120_000)

  const queueResponses: { status: number }[] = []
  page.on('response', (response) => {
    if (!response.url().includes('/api/tickets/by-group')) return
    queueResponses.push({ status: response.status() })
  })

  await page.goto(`${DESK}/kanban`)

  // The realtime link has to be up: while it is, the board is refreshed by hub
  // events and the queue query must stay idle.
  await expect(page.getByTestId('connection-indicator').first()).toHaveAttribute(
    'data-state',
    'connected',
    { timeout: 60_000 },
  )

  // Observation window. The degraded fallback polls every 30 s and the original
  // bug polled every 1.5 s, so a 20 s window is long enough to catch either of
  // them (about 13 polls with the old cadence) while keeping the test short.
  const observationMs = 20_000
  const observationStartedAt = Date.now()

  await expect
    .poll(() => Date.now() - observationStartedAt >= observationMs, {
      timeout: observationMs + 30_000,
      intervals: [500],
    })
    .toBe(true)

  // At most the initial load plus the invalidations triggered by hub events.
  // The old behaviour produced ~13 requests in this very window.
  expect(queueResponses.length).toBeLessThanOrEqual(3)

  // And the symptom the users saw must be gone: no rate-limit rejection.
  expect(queueResponses.filter((response) => response.status === 429)).toHaveLength(0)
})
