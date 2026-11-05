import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyWebhookMigration, verifyWebhookReplicas } from './integration-smoke.mjs'

test('SQL007 smoke rejects an absent fixture before creating its child database', async () => {
  await assert.rejects(verifyWebhookMigration({}), /E2E blocked/)
})

test('replica smoke rejects an absent fixture before starting processes or HTTP', () => {
  assert.throws(() => verifyWebhookReplicas({}, 'unused-synthetic-secret'), /E2E blocked/)
})
