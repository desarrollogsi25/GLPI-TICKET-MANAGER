import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertDisposableFixture, verifyFixtureResources, runFixtureSql, runFixtureCommand, resetFixtures, resetTicket, main } from './guard.mjs'

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
  const dataNetworkId = 'f'.repeat(64)
  const edgeNetworkId = 'e'.repeat(64)
  const labels = { 'com.docker.compose.project': m.project, 'io.glpi.e2e.run-id': m.runId }
  const portNames = { frontend: '5173/tcp', glpi: '80/tcp', api: '8080/tcp' }
  // Databases live only on the internal data network; the browser/API/GLPI
  // surface lives on the published edge network. GLPI and the API join both.
  const memberships = {
    'glpi-db': ['e2e_data'], 'app-db': ['e2e_data'], glpi: ['e2e_data', 'e2e_edge'],
    api: ['e2e_data', 'e2e_edge'], frontend: ['e2e_edge'],
  }
  const networkIdByName = { e2e_data: dataNetworkId, e2e_edge: edgeNetworkId }
  const containers = services.map(service => {
    const port = portNames[service]
    const bindings = port ? { [port]: [{ HostIp: '127.0.0.1', HostPort: new URL(m[`${service}Url`]).port }] } : {}
    return {
      Id: m.containers[service], State: { Running: true },
      Config: { Labels: { ...labels, 'com.docker.compose.service': service } },
      HostConfig: { NetworkMode: `${m.project}_${memberships[service][0]}`, Privileged: false, PortBindings: structuredClone(bindings) },
      NetworkSettings: {
        Networks: Object.fromEntries(memberships[service].map((name, i) =>
          [`${m.project}_${name}`, { NetworkID: networkIdByName[name], IPAddress: `172.2${i}.0.${services.indexOf(service) + 2}` }])),
        Ports: structuredClone(bindings),
      },
      Mounts: service === 'glpi-db' ? [{ Type: 'tmpfs', Destination: '/var/lib/mysql', RW: true }] :
        service === 'app-db' ? [{ Type: 'tmpfs', Destination: '/var/lib/postgresql/data', RW: true }] : [],
    }
  })
  const networkMembers = name => Object.fromEntries(services
    .filter(service => memberships[service].includes(name))
    .map(service => [m.containers[service], {}]))
  const dataNetwork = {
    Id: dataNetworkId, Name: `${m.project}_e2e_data`, Labels: labels, Driver: 'bridge', Scope: 'local',
    Internal: true, Containers: networkMembers('e2e_data'),
  }
  const edgeNetwork = {
    Id: edgeNetworkId, Name: `${m.project}_e2e_edge`, Labels: labels, Driver: 'bridge', Scope: 'local',
    Internal: false, Containers: networkMembers('e2e_edge'),
  }
  const contexts = [{ Name: m.context, Endpoints: { docker: { Host: 'npipe:////./pipe/dockerDesktopLinuxEngine' } } }]
  const calls = []
  const state = { manifest: m, containers, dataNetwork, edgeNetwork, contexts, sentinel: runId, database: null, failCommand: false }
  const env = { E2E_FIXTURE_MANIFEST: resolve(ROOT, 'test-manifest.json'), E2E_CONFIRM_DESTRUCTIVE: runId }
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
      if (args[2] === 'network') return JSON.stringify([state.dataNetwork, state.edgeNetwork])
      if (args[2] === 'exec') {
        if (!options.input.includes('e2e_fixture_identity')) return ''
        const database = args.includes('--dbname=glpi_ticket_manager')
          ? (state.database ?? 'glpi_ticket_manager') : (state.database ?? 'glpi')
        return `${database}:${state.sentinel}\n`
      }
      throw new Error('unexpected command')
    },
  }
  return { m, state, env, deps, calls }
}

function writes(calls) {
  return calls.filter(c => c.args[2] === 'exec' && !c.options.input.includes('e2e_fixture_identity'))
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
  'development frontend port': m => { m.frontendUrl = 'http://127.0.0.1:5173' },
  'development API port': m => { m.apiUrl = 'http://127.0.0.1:8080' },
  'development GLPI port': m => { m.glpiUrl = 'http://127.0.0.1:8081' },
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
  'third network': f => { f.state.containers[0].NetworkSettings.Networks.third = { NetworkID: 'd'.repeat(64), IPAddress: '172.29.0.9' } },
  'foreign network label': f => { f.state.dataNetwork.Labels = {} },
  'network with non-bridge driver': f => { f.state.edgeNetwork.Driver = 'overlay' },
  'network with non-local scope': f => { f.state.dataNetwork.Scope = 'swarm' },
  'foreign network member': f => { f.state.edgeNetwork.Containers['d'.repeat(64)] = {} },
  'published database': f => { f.state.containers[0].HostConfig.PortBindings = { '3306/tcp': [{ HostIp: '127.0.0.1', HostPort: '3306' }] } },
  'database effective host binding': f => { f.state.containers[0].NetworkSettings.Ports = { '3306/tcp': [{ HostIp: '127.0.0.1', HostPort: '3306' }] } },
  'public frontend': f => { f.state.containers[4].HostConfig.PortBindings['5173/tcp'][0].HostIp = '0.0.0.0' },
  'wrong effective port': f => { f.state.containers[4].NetworkSettings.Ports['5173/tcp'][0].HostPort = '5173' },
  'database on the edge network': f => {
    f.state.containers[0].NetworkSettings.Networks[`${f.m.project}_e2e_edge`] = { NetworkID: f.state.edgeNetwork.Id, IPAddress: '172.21.0.9' }
    f.state.edgeNetwork.Containers[f.m.containers['glpi-db']] = {}
  },
  'frontend on the data network': f => {
    f.state.containers[4].NetworkSettings.Networks[`${f.m.project}_e2e_data`] = { NetworkID: f.state.dataNetwork.Id, IPAddress: '172.20.0.9' }
    f.state.dataNetwork.Containers[f.m.containers.frontend] = {}
  },
  'edge network marked internal': f => { f.state.edgeNetwork.Internal = true },
  'data network left public': f => { f.state.dataNetwork.Internal = false },
  'single shared network': f => {
    for (const c of f.state.containers) {
      c.NetworkSettings.Networks = { [`${f.m.project}_e2e_edge`]: { NetworkID: f.state.edgeNetwork.Id, IPAddress: '172.21.0.2' } }
    }
    f.state.edgeNetwork.Containers = Object.fromEntries(Object.values(f.m.containers).map(id => [id, {}]))
    f.state.dataNetwork = undefined
  },
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

const optInCases = {
  'missing confirmation': env => { delete env.E2E_CONFIRM_DESTRUCTIVE },
  'confirmation for another run': env => { env.E2E_CONFIRM_DESTRUCTIVE = 'cd'.repeat(16) },
  'CI flag without confirmation': env => { delete env.E2E_CONFIRM_DESTRUCTIVE; env.CI = 'true' },
  'empty confirmation': env => { env.E2E_CONFIRM_DESTRUCTIVE = '' },
}
for (const [name, mutate] of Object.entries(optInCases)) {
  test(`${name} blocks destructive SQL with zero writes`, () => {
    const f = fixture()
    const env = { ...f.env }
    mutate(env)
    assert.throws(() => runFixtureSql('mariadb', 'DELETE FROM real_data;', env, f.deps), /E2E blocked/)
    assert.throws(() => resetFixtures(env, f.deps), /E2E blocked/)
    assert.equal(writes(f.calls).length, 0)
  })
}

test('wrong database name blocks every write even with a matching sentinel', () => {
  const f = fixture()
  f.state.database = 'glpi_prod'
  assert.throws(() => resetFixtures(f.env, f.deps), /E2E blocked/)
  assert.equal(writes(f.calls).length, 0)
})

test('fixture command runs only inside the exact verified container', () => {
  const f = fixture()
  runFixtureCommand('glpi', ['php', '-v'], f.env, f.deps, '')
  const call = f.calls.at(-1)
  assert.equal(call.args[2], 'exec')
  assert.ok(call.args.includes(f.m.containers.glpi))
  assert.ok(call.args.includes('php') && call.args.includes('-v'))
  assert.equal(writes(f.calls).length, 1)
  assert.equal(f.calls.filter(c => c.args[2] === 'exec' && c.options.input.includes('e2e_fixture_identity')).length, 2)
})

test('fixture command rejects unknown services and empty argv before Docker', () => {
  const f = fixture()
  assert.throws(() => runFixtureCommand('glpi-prod', ['php'], f.env, f.deps), /E2E blocked/)
  assert.throws(() => runFixtureCommand('glpi', [], f.env, f.deps), /E2E blocked/)
  assert.equal(f.calls.length, 0)
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

test('valid fixture inspects both networks and keeps databases off the edge', () => {
  const f = fixture()
  assert.equal(assertDisposableFixture(f.env, f.deps).runId, f.m.runId)
  const networkCalls = f.calls.filter(c => c.args[2] === 'network')
  assert.equal(networkCalls.length, 1)
  // --context <ctx> network inspect <data-id> <edge-id>
  assert.equal(networkCalls[0].args.length, 6)
  assert.equal(f.state.dataNetwork.Internal, true)
  assert.equal(f.state.edgeNetwork.Internal, false)
  assert.ok(!(f.m.containers['glpi-db'] in f.state.edgeNetwork.Containers))
  assert.ok(!(f.m.containers['app-db'] in f.state.edgeNetwork.Containers))
  assert.equal(writes(f.calls).length, 0)
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

test('CLI destructive modes require run-scoped confirmation before stdin or writes', () => {
  const f = fixture()
  const output = []
  const io = { write: x => output.push(x), error: x => output.push(x) }
  const unconfirmed = { ...f.env }
  delete unconfirmed.E2E_CONFIRM_DESTRUCTIVE
  assert.equal(main(['verify', '--destructive'], unconfirmed, f.deps, io), 1)
  assert.equal(main(['reset'], unconfirmed, f.deps, io), 1)
  assert.equal(writes(f.calls).length, 0)
  assert.equal(main(['verify', '--destructive'], f.env, f.deps, io), 0)
  assert.equal(writes(f.calls).length, 0)
})

test('Compose declares an internal data network and a non-internal bridge edge', async () => {
  const { readFileSync } = await import('node:fs')
  const compose = readFileSync(resolve(ROOT, 'docker-compose.e2e.yml'), 'utf8')
  // Allow indented comment lines between the network key and its flags.
  const block = key => new RegExp(`${key}:\\s*\\n(?:[ \\t]*#[^\\n]*\\n)*[ \\t]*(\\w+):\\s*([\\w]+)`)
  assert.match(compose, block('e2e_data'))
  assert.match(compose, /e2e_data:\s*\n(?:[ \t]*#[^\n]*\n)*[ \t]*internal:\s*true/)
  assert.match(compose, /e2e_edge:\s*\n(?:[ \t]*#[^\n]*\n)*[ \t]*driver:\s*bridge/)
  assert.doesNotMatch(compose, /e2e_edge:\s*\n(?:[ \t]*#[^\n]*\n)*[ \t]*internal:\s*true/)
  // Databases are attached to the data network and never to the edge network.
  const serviceBlock = name => compose.split(/\n  (?=[a-z-]+:)/).find(part => part.startsWith(`${name}:`)) ?? ''
  assert.match(serviceBlock('glpi-db'), /networks:\s*\n\s*-\s*e2e_data/)
  assert.doesNotMatch(serviceBlock('glpi-db'), /e2e_edge/)
  assert.match(serviceBlock('app-db'), /networks:\s*\n\s*-\s*e2e_data/)
  assert.doesNotMatch(serviceBlock('app-db'), /e2e_edge/)
  assert.match(serviceBlock('frontend'), /networks:\s*\n\s*-\s*e2e_edge/)
})

test('fixture keeps both rate limiters enforced with a finite, bounded budget', async () => {
  const { readFileSync } = await import('node:fs')
  const compose = readFileSync(resolve(ROOT, 'docker-compose.e2e.yml'), 'utf8')
  const value = name => Number(compose.match(new RegExp(`${name}:\\s*"?(\\d+)"?`))?.[1])
  const perUser = value('RateLimiting__PerUserRequestLimit')
  const tokens = value('RateLimiting__ExpensiveTokenLimit')
  const refill = value('RateLimiting__ExpensiveReplenishmentSeconds')
  for (const limit of [perUser, tokens, refill]) assert.ok(Number.isSafeInteger(limit) && limit > 0)
  // Fixture-only headroom for a whole suite as one user, still finite.
  assert.ok(perUser >= 100 && perUser <= 1000)
  assert.ok(tokens >= 20 && tokens <= 500)
  assert.ok(refill >= 1 && refill <= 5)
  // A disabled or unbounded limiter must never reach the fixture.
  assert.doesNotMatch(compose, /DisableRateLimiting|RateLimiting__(Enabled|PerUserRequestLimit)\s*:\s*"?(0|false)/i)
})
