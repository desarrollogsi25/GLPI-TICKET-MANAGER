import assert from 'node:assert/strict'
import test from 'node:test'
import { collectPages } from '../../src/lib/api/pagination.ts'

const rows = Array.from({ length: 237 }, (_, id) => ({ id: id + 1 }))

test('loads tickets beyond both former queue and assignee limits', async () => {
  const offsets = []
  const result = await collectPages(async (limit, offset) => {
    offsets.push(offset)
    return { items: rows.slice(offset, offset + limit), total: rows.length, limit, offset }
  })
  assert.deepEqual(offsets, [0, 100, 200])
  assert.deepEqual(result.items, rows)
  assert.equal(result.total, 237)
})

test('respects a smaller server page size', async () => {
  const result = await collectPages(async (_, offset) => ({
    items: rows.slice(offset, offset + 20), total: rows.length, limit: 20, offset,
  }))
  assert.deepEqual(result.items, rows)
})

test('empty authorized list is valid', async () => {
  assert.equal((await collectPages(async () => ({ items: [], total: 0, limit: 100, offset: 0 }))).total, 0)
})

test('missing rows fail instead of publishing a truncated list', async () => {
  await assert.rejects(collectPages(async (_, offset) => ({ items: [], total: 4, limit: 100, offset })))
})

test('overlapping pages fail instead of showing duplicate tickets', async () => {
  await assert.rejects(collectPages(async (_, offset) => ({
    items: [{ id: 1 }], total: 2, limit: 1, offset,
  })), /cambió/)
})

test('concurrent additions fail instead of publishing mismatched counts', async () => {
  await assert.rejects(collectPages(async (_, offset) => ({
    items: [{ id: offset + 1 }], total: offset === 0 ? 2 : 3, limit: 1, offset,
  })), /cambió/)
})

test('cancellation prevents further page requests', async () => {
  const controller = new AbortController()
  let calls = 0
  await assert.rejects(collectPages(async (_, offset) => {
    calls++
    controller.abort()
    return { items: [{ id: 1 }], total: 2, limit: 1, offset }
  }, controller.signal), { name: 'AbortError' })
  assert.equal(calls, 1)
})

test('a failure on a later page propagates without publishing partial data', async () => {
  await assert.rejects(collectPages(async (_, offset) => {
    if (offset) throw new Error('API unavailable')
    return { items: [{ id: 1 }], total: 2, limit: 1, offset }
  }), /API unavailable/)
})
