import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { cleanupFixture, removeTemporaryFixtureDirectory } from './runner-cleanup.mjs'

function fixture() {
  const runId = 'a'.repeat(32)
  const project = `glpi-e2e-${runId}`
  const id = 'b'.repeat(64)
  const networkId = 'c'.repeat(64)
  const labels = { 'com.docker.compose.project': project, 'io.glpi.e2e.run-id': runId }
  const container = { Id: id, Config: { Labels: { ...labels, 'com.docker.compose.service': 'glpi-db' } }, Mounts: [{ Type: 'tmpfs' }] }
  const network = { Id: networkId, Labels: { ...labels }, Containers: { [id]: {} } }
  let removed = false
  const removals = []
  const state = { container, network, volume: '', leftover: false }
  return {
    project, runId, state, removals,
    docker(args) {
      if (args[0] === 'inspect') return JSON.stringify([state.container])
      if (args[0] === 'ps') return removed && !state.leftover ? '' : id
      if (args[0] === 'network' && args[1] === 'inspect') return JSON.stringify([state.network])
      if (args[0] === 'network' && args[1] === 'ls') return removed && !state.leftover ? '' : networkId
      if (args[0] === 'volume') return state.volume
      throw new Error('Unexpected Docker operation')
    },
    compose(args) { removals.push(args); removed = true },
  }
}

test('partial startup: remove only inspected resources with explicit down and no orphan removal', () => {
  const f = fixture()
  cleanupFixture(f)
  assert.deepEqual(f.removals, [['down', '--volumes', '--timeout', '10']])
})

for (const [name, mutate] of [
  ['foreign container label', f => { f.state.container.Config.Labels['io.glpi.e2e.run-id'] = 'foreign' }],
  ['unknown service', f => { f.state.container.Config.Labels['com.docker.compose.service'] = 'unrelated' }],
  ['foreign network membership', f => { f.state.network.Containers['d'.repeat(64)] = {} }],
  ['foreign network label', f => { f.state.network.Labels['io.glpi.e2e.run-id'] = 'foreign' }],
  ['persistent mounted data', f => { f.state.container.Mounts = [{ Type: 'volume' }] }],
  ['persistent project volume', f => { f.state.volume = 'unexpected-volume' }],
  ['changed container identity', f => { f.manifest = { containers: { 'glpi-db': 'e'.repeat(64) } } }],
]) {
  test(`refuses ${name} before any removal`, () => {
    const f = fixture()
    mutate(f)
    assert.throws(() => cleanupFixture(f), /Refusing cleanup/)
    assert.equal(f.removals.length, 0)
  })
}

test('cleanup fails if resource verification fails, with no removal', () => {
  const f = fixture()
  f.docker = () => { throw new Error('Docker unavailable') }
  assert.throws(() => cleanupFixture(f), /Docker unavailable/)
  assert.equal(f.removals.length, 0)
})

test('reports resources remaining after cleanup', () => {
  const f = fixture()
  f.state.leftover = true
  assert.throws(() => cleanupFixture(f), /left resources behind/)
})

test('temporary removal is limited to direct allocated fixture directory', () => {
  const calls = []
  const temp = resolve(tmpdir(), 'glpi-e2e-Ab1234')
  removeTemporaryFixtureDirectory(temp, { remove: (...args) => calls.push(args) })
  assert.deepEqual(calls, [[temp, { recursive: true, force: true }]])
  for (const invalid of [resolve(tmpdir()), resolve(tmpdir(), 'unrelated'), resolve(tmpdir(), 'glpi-e2e-Ab1234', 'child'), 'glpi-e2e-Ab1234']) {
    assert.throws(() => removeTemporaryFixtureDirectory(invalid, { remove: () => assert.fail('must not remove') }), /Refusing cleanup/)
  }
})
