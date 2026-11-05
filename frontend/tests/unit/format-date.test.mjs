import assert from 'node:assert/strict'
import test from 'node:test'

import { formatDateTime, formatRelative } from '../../src/lib/format.ts'

test('GLPI zero dates render an em dash instead of year 1', () => {
  assert.equal(formatDateTime('0000-00-00 00:00:00'), '—')
  assert.equal(formatDateTime('0001-01-01T00:00:00Z'), '—')
})

test('unknown or missing dates render an em dash', () => {
  assert.equal(formatDateTime(null), '—')
  assert.equal(formatDateTime(undefined), '—')
  assert.equal(formatDateTime('   '), '—')
  assert.equal(formatRelative('0000-00-00 00:00:00'), '—')
})

test('valid GLPI timestamps still render in Spanish format', () => {
  const formatted = formatDateTime('2026-11-05T10:00:00Z')
  assert.match(formatted, /^\d{2}\/11\/2026 \d{2}:\d{2}$/)
  assert.notEqual(formatRelative('2026-11-05T10:00:00Z'), '—')
})
