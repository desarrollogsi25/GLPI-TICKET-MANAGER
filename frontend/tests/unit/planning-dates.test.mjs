import assert from 'node:assert/strict'
import test from 'node:test'

// The planning dialog works in browser-local wall-clock time. The backend and the
// GLPI service session store UTC. These tests pin that conversion for a DST zone.
process.env.TZ = 'Europe/Paris'
const { localDateTime, parseUnambiguousLocal } = await import('../../src/features/tickets/planningDates.ts')

test('winter local 13:00 is the 12:00 UTC instant (no fixed offset)', () => {
  assert.equal(parseUnambiguousLocal('2026-11-09T13:00').toISOString(), '2026-11-09T12:00:00.000Z')
})

test('summer local 13:00 is the 11:00 UTC instant', () => {
  assert.equal(parseUnambiguousLocal('2026-07-09T13:00').toISOString(), '2026-07-09T11:00:00.000Z')
})

test('spring-forward gap time does not exist and is rejected', () => {
  assert.equal(parseUnambiguousLocal('2026-03-29T02:30'), null)
})

test('fall-back overlap time is ambiguous and is rejected', () => {
  assert.equal(parseUnambiguousLocal('2026-10-25T02:30'), null)
})

test('round trip across midnight keeps the same instant', () => {
  const start = parseUnambiguousLocal('2026-11-09T23:30')
  const end = new Date(start.getTime() + 90 * 60_000)
  assert.equal(localDateTime(end), '2026-11-10T01:00')
  assert.equal(end.toISOString(), '2026-11-10T00:00:00.000Z')
})
