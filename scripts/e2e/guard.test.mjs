import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertDisposableFixture, verifyFixtureResources, runFixtureSql, resetFixtures, resetTicket, main } from './guard.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const NOW = Date.UTC(2026, 9, 29)
const services = ['glpi-db', 'app-db', 'glpi', 'api', 'frontend']

function fixture() {
  const runId = 'ab'.repeat(16)
  const m = {
    version: 1, runId, context: 'desktop-linux', project: `glpi-e2e-${runId}`,
    composeFile: resolve(ROOT, 'docker-compose.e2e.yml'),
    frontendUrl: 'http://127.0.0.1:49151', glpiUrl: 'http://127.0.0.1:49152', apiUrl: 'http://127.0.0.1:49153',
    containers: Object.fromEntries(services.map((s, i) => [s, String(i + 1).repeat(64)])),
    credentials: { mariaUser: 'e2e', mariaPassword: 'synthetic-maria-'.repeat(3), appUser: 'e2e', appPassword: 'synthetic-postgres-'.repeat(3) },
    expiresAt: new Date(NOW + 60_000).toISOString(),
  }
  const networkId = 'f'.repeat(64)
  const labels = { 'com.docker.compose.project': m.project, 'io.glpi.e2e.run-id': m.runId }
  const portNames = { frontend: '5173/tcp', glpi: '80/tcp', api: '8080/tcp' }
  const containers = services.map(service => {
    const port = portNames[service]
    const bindings = port ? { [port]: [{ HostIp: '127.0.0.1', HostPort: new URL(m[`${service}Url`]).port }] } : {}
    return {
      Id: m.containers[service], State: { Running: true },
      Config: { Labels: { ...labels, 'com.docker.compose.service': service } },
      HostConfig: { NetworkMode: `${m.project}_default`, Privileged: false, PortBindings: structuredClone(bindings) },
      NetworkSettings: { Networks: { [`${m.project}_default`]: { NetworkID: networkId } }, Ports: structuredClone(bindings) },
      Mounts: service === 'glpi-db' ? [{ Type: 'tmpfs', Destination: '/var/lib/mysql', RW: true }] :
        service === 'app-db' ? [{ Type: 'tmpfs', Destination: '/var/lib/postgresql/data', RW: true }] : [],
    }
  })
  const network = { Id: networkId, Labels: labels, Driver: 'bridge', Scope: 'local', Containers: Object.fromEntries(Object.values(m.containers).map(id => [id, {}])) }
  const contexts = [{ Name: m.context, Endpoints: { docker: { Host: 'npipe:////./pipe/dockerDesktopLinuxEngine' } } }]
  const calls = []
  const state = { manifest: m, containers, network, contexts, sentinel: runId, failCommand: false }
  const env = { E2E_FIXTURE_MANIFEST: resolve(ROOT, 'test-manifest.json') }
  const deps = {
    now: () => NOW,
    readFileSync(path) {
      if (path === env.E2E_FIXTURE_MANIFEST) return JSON.stringify(state.manifest)
      if (path === resolve(ROOT, 'scripts/seed-e2e.sql')) return 'DELETE FROM synthetic_fixture;'
      throw new Error('unexpected read')
    },
    execFileSync(command, args, options) {
      calls.push({ command, args, options })
      if (state.failCommand) throw new Error('private credentials from child must never escape')
      assert.equal(command, 'docker')
      assert.deepEqual(args.slice(0, 2), ['--context', m.context])
      if (args[2] === 'context') return JSON.stringify(state.contexts)
      if (args[2] === 'inspect') return JSON.stringify(state.containers)
      if (args[2] === 'network') return JSON.stringify([state.network])
      if (args[2] === 'exec') return options.input.startsWith('SELECT run_id') ? `${state.sentinel}\n` : ''
      throw new Error('unexpected command')
    },
  }
  return { m, state, env, deps, calls }
}

function writes(calls) {
  return calls.filter(c => c.args[2] === 'exec' && !c.options.input.startsWith('SELECT run_id'))
}

test('absent manifest fails before Docker or mutation even in CI', () => {
  const f = fixture()
  assert.throws(() => assertDisposableFixture({ CI: 'true' }, f.deps), /E2E blocked/)
  assert.equal(f.calls.length, 0)
})

const manifestCases = {
  'wrong project': m => { m.project = 'local' },
  'wrong compose file': m => { m.composeFile = resolve(ROOT, 'docker-compose.yml') },
  'invalid run ID': m => { m.runId = 'run' },
  'expired manifest': m => { m.expiresAt = new Date(NOW - 1).toISOString() },
  'invalid expiry': m => { m.expiresAt = 'invalid' },
  'remote frontend': m => { m.frontendUrl = 'https://example.org' },
  'localhost ambiguity': m => { m.apiUrl = 'http://localhost:49153' },
  'credential in URL': m => { m.glpiUrl = 'http://u:p@127.0.0.1:49152' },
  'production user': m => { m.credentials.mariaUser = 'root' },
  'missing credential': m => { delete m.credentials.appPassword },
  'short password': m => { m.credentials.mariaPassword = 'short' },
  'container name rather than ID': m => { m.containers.api = 'glpi-api' },
  'duplicate ID': m => { m.containers.api = m.containers.glpi },
  'shell context injection': m => { m.context = '--host=remote' },
}
for (const [name, mutate] of Object.entries(manifestCases)) {
  test(`manifest rejects ${name} without Docker or writes`, () => {
    const f = fixture()
    mutate(f.m)
    assert.throws(() => runFixtureSql('mariadb', 'DELETE FROM real_data;', f.env, f.deps), /E2E blocked/)
    assert.equal(f.calls.length, 0)
  })
}

const resourceCases = {
  'remote Docker context': f => { f.state.contexts[0].Endpoints.docker.Host = 'tcp://remote:2375' },
  'wrong context identity': f => { f.state.contexts[0].Name = 'other' },
  'missing run label': f => { delete f.state.containers[0].Config.Labels['io.glpi.e2e.run-id'] },
  'wrong service label': f => { f.state.containers[0].Config.Labels['com.docker.compose.service'] = 'api' },
  'stopped container': f => { f.state.containers[0].State.Running = false },
  'wrong container ID': f => { f.state.containers[0].Id = 'e'.repeat(64) },
  'persistent data volume': f => { f.state.containers[0].Mounts[0].Type = 'volume' },
  'writable data bind': f => { f.state.containers[0].Mounts[0].Type = 'bind' },
  'readonly host data bind': f => { f.state.containers[4].Mounts = [{ Type: 'bind', RW: false, Destination: '/app' }] },
  'missing data tmpfs': f => { f.state.containers[0].Mounts = [] },
  'Docker socket bind': f => { f.state.containers[4].Mounts = [{ Type: 'bind', RW: false, Destination: '/var/run/docker.sock' }] },
  'renamed Docker socket bind': f => { f.state.containers[4].Mounts = [{ Type: 'bind', RW: false, Source: '/var/run/docker.sock', Destination: '/tmp/socket' }] },
  'privileged container': f => { f.state.containers[0].HostConfig.Privileged = true },
  'host network': f => { f.state.containers[0].HostConfig.NetworkMode = 'host' },
  'second network': f => { f.state.containers[0].NetworkSettings.Networks.other = { NetworkID: 'e'.repeat(64) } },
  'foreign network label': f => { f.state.network.Labels = {} },
  'foreign network member': f => { f.state.network.Containers['e'.repeat(64)] = {} },
  'published database': f => { f.state.containers[0].HostConfig.PortBindings = { '3306/tcp': [{ HostIp: '127.0.0.1', HostPort: '3306' }] } },
  'public frontend': f => { f.state.containers[4].HostConfig.PortBindings['5173/tcp'][0].HostIp = '0.0.0.0' },
  'wrong effective port': f => { f.state.containers[4].NetworkSettings.Ports['5173/tcp'][0].HostPort = '5173' },
}
for (const [name, mutate] of Object.entries(resourceCases)) {
  test(`resources reject ${name} with zero writes`, () => {
    const f = fixture()
    mutate(f)
    assert.throws(() => runFixtureSql('mariadb', 'DELETE FROM real_data;', f.env, f.deps), /E2E blocked/)
    assert.equal(writes(f.calls).length, 0)
  })
}

test('missing/wrong sentinel blocks every write', () => {
  const f = fixture()
  f.state.sentinel = 'other-run'
  assert.throws(() => resetFixtures(f.env, f.deps), /E2E blocked/)
  assert.equal(writes(f.calls).length, 0)
})

test('child process failure is fatal and does not disclose child output or credentials', () => {
  const f = fixture()
  f.state.failCommand = true
  assert.throws(() => assertDisposableFixture(f.env, f.deps), error =>
    error.message === 'E2E blocked: a verified disposable fixture is required. Check: Docker context.' && !error.cause)
  assert.equal(writes(f.calls).length, 0)
})

test('valid resources allow bootstrap verification without sentinel or writes', () => {
  const f = fixture()
  assert.equal(verifyFixtureResources(f.env, f.deps).runId, f.m.runId)
  assert.equal(f.calls.filter(c => c.args[2] === 'exec').length, 0)
})

test('Docker reports Compose tmpfs in HostConfig without a Mounts entry', () => {
  const f = fixture()
  for (const [service, target] of [['glpi-db', '/var/lib/mysql'], ['app-db', '/var/lib/postgresql/data']]) {
    const container = f.state.containers.find(c => c.Id === f.m.containers[service])
    container.Mounts = []
    container.HostConfig.Tmpfs = { [target]: '' }
  }
  assert.equal(assertDisposableFixture(f.env, f.deps).runId, f.m.runId)
  assert.equal(writes(f.calls).length, 0)
})

test('valid fixture checks both sentinels before targeting exact container ID', () => {
  const f = fixture()
  runFixtureSql('postgres', 'DELETE FROM synthetic_fixture;', f.env, f.deps)
  assert.equal(writes(f.calls).length, 1)
  const sentinels = f.calls.filter(c => c.args[2] === 'exec' && c.options.input.startsWith('SELECT'))
  assert.equal(sentinels.length, 2)
  const last = f.calls.at(-1)
  assert.ok(last.args.includes(f.m.containers['app-db']))
  assert.ok(last.args.includes('--set=ON_ERROR_STOP=1'))
  assert.ok(last.args.includes('PGPASSWORD'))
  assert.equal(last.options.env.PGPASSWORD, f.m.credentials.appPassword)
  assert.ok(!last.args.some(arg => arg.includes(f.m.credentials.appPassword)))
  assert.ok(!last.args.some(arg => arg.startsWith('-p')))
  assert.equal(last.options.input, 'DELETE FROM synthetic_fixture;')
})

test('Docker allocated host port is checked through effective bindings', () => {
  const f = fixture()
  f.state.containers[4].HostConfig.PortBindings['5173/tcp'][0].HostPort = '0'
  assert.equal(assertDisposableFixture(f.env, f.deps).runId, f.m.runId)
})

test('ticket reset uses hex UTF8 name and validates numeric ID', () => {
  const f = fixture()
  assert.throws(() => resetTicket('1;DROP TABLE x', 'name', f.env, f.deps), /E2E blocked/)
  assert.equal(f.calls.length, 0)
  resetTicket(70, "Name'; DROP TABLE x; --", f.env, f.deps)
  const write = writes(f.calls)[0]
  assert.ok(!write.options.input.includes('DROP TABLE'))
  assert.match(write.options.input, /CONVERT\(0x[0-9a-f]+ USING utf8mb4\)/)
})

test('reset validates again before every engine write and propagates errors', () => {
  const f = fixture()
  resetFixtures(f.env, f.deps)
  assert.equal(writes(f.calls).length, 2)
  assert.equal(f.calls.filter(c => c.args[2] === 'inspect').length, 3)
})

test('CLI SQL consumes stdin only after validation and never puts SQL on argv', () => {
  const f = fixture()
  const priorRead = f.deps.readFileSync
  f.deps.readFileSync = path => path === 0 ? 'DELETE FROM synthetic_fixture;' : priorRead(path)
  const output = []
  assert.equal(main(['sql', 'postgres'], f.env, f.deps, { write: x => output.push(x), error: x => output.push(x) }), 0)
  assert.equal(writes(f.calls).length, 1)
  assert.ok(!f.calls.at(-1).args.includes('DELETE FROM synthetic_fixture;'))
  assert.equal(f.calls.at(-1).options.input, 'DELETE FROM synthetic_fixture;')
})

test('CLI without fixture blocks before stdin, Docker or SQL', () => {
  const f = fixture()
  let stdinRead = false
  const priorRead = f.deps.readFileSync
  f.deps.readFileSync = path => { if (path === 0) stdinRead = true; return priorRead(path) }
  const output = []
  assert.equal(main(['sql', 'mariadb'], {}, f.deps, { write: x => output.push(x), error: x => output.push(x) }), 1)
  assert.equal(stdinRead, false)
  assert.equal(f.calls.length, 0)
  assert.deepEqual(output, ['E2E blocked: a verified disposable fixture is required.\n'])
})

test('CLI URL emits only the verified origin and rejects unknown commands', () => {
  const f = fixture()
  const output = []
  const io = { write: x => output.push(x), error: x => output.push(x) }
  assert.equal(main(['url', 'desk'], f.env, f.deps, io), 0)
  assert.deepEqual(output, [`${f.m.frontendUrl}\n`])
  assert.equal(main(['url', 'other'], f.env, f.deps, io), 1)
  assert.equal(main(['sql', 'other'], f.env, f.deps, io), 1)
  assert.equal(writes(f.calls).length, 0)
})
