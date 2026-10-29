import { execFileSync as nativeExec } from 'node:child_process'
import { readFileSync as nativeRead } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const COMPOSE = resolve(ROOT, 'docker-compose.e2e.yml')
const SERVICES = ['glpi-db', 'app-db', 'glpi', 'api', 'frontend']
const PORTS = { frontend: '5173/tcp', glpi: '80/tcp', api: '8080/tcp' }
const MESSAGE = 'E2E blocked: a verified disposable fixture is required.'
const fail = () => { throw new Error(MESSAGE) }

function dependencies(deps = {}) {
  return { execFileSync: nativeExec, readFileSync: nativeRead, now: Date.now, ...deps }
}

function manifestFrom(env, deps) {
  try {
    if (!env.E2E_FIXTURE_MANIFEST || !isAbsolute(env.E2E_FIXTURE_MANIFEST)) fail()
    const m = JSON.parse(deps.readFileSync(env.E2E_FIXTURE_MANIFEST, 'utf8'))
    if (m.version !== 1 || !/^[a-f0-9]{32}$/.test(m.runId) ||
        m.project !== `glpi-e2e-${m.runId}` ||
        typeof m.context !== 'string' || !/^[a-zA-Z0-9_.-]+$/.test(m.context) ||
        !isAbsolute(m.composeFile ?? '') || resolve(m.composeFile) !== COMPOSE) fail()
    const expiry = Date.parse(m.expiresAt)
    if (!Number.isFinite(expiry) || expiry <= deps.now() || expiry > deps.now() + 24 * 60 * 60 * 1000) fail()
    for (const service of SERVICES) {
      if (!/^[a-f0-9]{64}$/.test(m.containers?.[service] ?? '')) fail()
    }
    if (new Set(Object.values(m.containers)).size !== SERVICES.length ||
        Object.keys(m.containers).length !== SERVICES.length) fail()
    for (const service of ['frontend', 'glpi', 'api']) {
      const url = new URL(m[`${service}Url`])
      if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' ||
          !url.port || Number(url.port) < 1024 || url.username || url.password ||
          url.pathname !== '/' || url.search || url.hash) fail()
    }
    if (new Set([m.frontendUrl, m.glpiUrl, m.apiUrl].map(u => new URL(u).port)).size !== 3) fail()
    if (m.credentials?.mariaUser !== 'e2e' || m.credentials?.appUser !== 'e2e') fail()
    for (const key of ['mariaPassword', 'appPassword']) {
      if (typeof m.credentials[key] !== 'string' || m.credentials[key].length < 32 ||
          !/^[a-zA-Z0-9_-]+$/.test(m.credentials[key])) fail()
    }
    return m
  } catch { fail() }
}

function docker(m, args, deps, input, extraEnv) {
  try {
    return deps.execFileSync('docker', ['--context', m.context, ...args], {
      encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'],
      ...(extraEnv ? { env: { ...process.env, ...extraEnv } } : {}),
      windowsHide: true, timeout: 60_000, maxBuffer: 8 * 1024 * 1024,
    }).toString()
  } catch { fail() }
}

function labelsMatch(labels, m, service) {
  return labels?.['com.docker.compose.project'] === m.project &&
    labels?.['io.glpi.e2e.run-id'] === m.runId &&
    (!service || labels?.['com.docker.compose.service'] === service)
}

/** Bootstrap-only: validates resources before schema/sentinel creation. Never authorizes reset. */
export function verifyFixtureResources(env = process.env, suppliedDeps) {
  const deps = dependencies(suppliedDeps)
  const m = manifestFrom(env, deps)
  let check = 'Docker context'
  try {
    const contexts = JSON.parse(docker(m, ['context', 'inspect', m.context], deps))
    const host = contexts[0]?.Endpoints?.docker?.Host
    if (contexts.length !== 1 || contexts[0].Name !== m.context ||
        typeof host !== 'string' || !/^(unix:\/\/\/|npipe:\/\/\/)/.test(host)) fail()
    const containers = JSON.parse(docker(m, ['inspect', ...SERVICES.map(s => m.containers[s])], deps))
    if (!Array.isArray(containers) || containers.length !== SERVICES.length) fail()
    let networkId
    for (const service of SERVICES) {
      check = `${service} identity`
      const c = containers.find(c => c.Id === m.containers[service])
      if (!c || c.State?.Running !== true || !labelsMatch(c.Config?.Labels, m, service)) fail()
      const h = c.HostConfig
      check = `${service} isolation`
      if (!h || h.Privileged || h.PidMode === 'host' || h.IpcMode === 'host' ||
          ['host', 'none', 'bridge'].includes(h.NetworkMode) || h.PublishAllPorts ||
          (h.VolumesFrom?.length ?? 0) > 0 || (h.Devices?.length ?? 0) > 0 ||
          (h.CapAdd?.length ?? 0) > 0) fail()
      const networks = Object.values(c.NetworkSettings?.Networks ?? {})
      check = `${service} network`
      if (networks.length !== 1 || !/^[a-f0-9]{64}$/.test(networks[0].NetworkID ?? '')) fail()
      if (networkId && networkId !== networks[0].NetworkID) fail()
      networkId = networks[0].NetworkID
      const mounts = c.Mounts ?? []
      check = `${service} storage`
      if (mounts.some(x => x.Type !== 'tmpfs' || x.Destination === '/var/run/docker.sock')) fail()
      for (const target of service === 'glpi-db' ? ['/var/lib/mysql'] :
        service === 'app-db' ? ['/var/lib/postgresql/data'] : []) {
        // Docker's --tmpfs/Compose tmpfs is reported in HostConfig.Tmpfs;
        // unlike --mount type=tmpfs it need not appear in Mounts.
        if (!Object.hasOwn(h.Tmpfs ?? {}, target) &&
            !mounts.some(x => x.Type === 'tmpfs' && x.Destination === target)) fail()
      }
      const bindings = Object.entries(h.PortBindings ?? {}).filter(([, value]) => value?.length)
      check = `${service} ports`
      if (PORTS[service]) {
        const url = new URL(m[`${service}Url`])
        if (bindings.length !== 1 || bindings[0][0] !== PORTS[service] ||
            bindings[0][1].length !== 1 || bindings[0][1][0].HostIp !== '127.0.0.1' ||
            !['', '0', url.port].includes(bindings[0][1][0].HostPort)) fail()
        const effective = c.NetworkSettings.Ports?.[PORTS[service]]
        if (!effective || effective.length !== 1 || effective[0].HostIp !== '127.0.0.1' ||
            effective[0].HostPort !== url.port) fail()
      } else if (bindings.length) fail()
    }
    check = 'exclusive network membership'
    const network = JSON.parse(docker(m, ['network', 'inspect', networkId], deps))
    if (network.length !== 1 || network[0].Id !== networkId || network[0].Driver !== 'bridge' ||
        !labelsMatch(network[0].Labels, m) || network[0].Scope !== 'local') fail()
    const members = Object.keys(network[0].Containers ?? {})
    if (members.length !== SERVICES.length || members.some(id => !Object.values(m.containers).includes(id))) fail()
    return m
  } catch { throw new Error(`${MESSAGE} Check: ${check}.`) }
}

function sqlCommand(m, engine, sql, deps) {
  if (!['mariadb', 'postgres'].includes(engine) || typeof sql !== 'string' || !sql.trim()) fail()
  const maria = engine === 'mariadb'
  const password = maria ? m.credentials.mariaPassword : m.credentials.appPassword
  const args = maria
    ? ['mariadb', '--user=e2e', '--database=glpi', '--batch', '--skip-column-names']
    : ['psql', '-X', '--set=ON_ERROR_STOP=1', '--username=e2e', '--dbname=glpi_ticket_manager', '--tuples-only', '--no-align']
  const passwordVariable = maria ? 'MYSQL_PWD' : 'PGPASSWORD'
  return docker(m, ['exec', '-i', '--env', passwordVariable,
    m.containers[maria ? 'glpi-db' : 'app-db'], ...args], deps, sql, { [passwordVariable]: password })
}

/** Full reset authorization requires both engine identities as well as resource checks. */
export function assertDisposableFixture(env = process.env, suppliedDeps) {
  const deps = dependencies(suppliedDeps)
  const m = verifyFixtureResources(env, deps)
  for (const engine of ['mariadb', 'postgres']) {
    if (sqlCommand(m, engine, 'SELECT run_id FROM e2e_fixture_identity;\n', deps).trim() !== m.runId) fail()
  }
  return m
}

export function runFixtureSql(engine, sql, env = process.env, suppliedDeps) {
  const deps = dependencies(suppliedDeps)
  const m = assertDisposableFixture(env, deps)
  return sqlCommand(m, engine, sql, deps)
}

export function resetFixtures(env = process.env, suppliedDeps) {
  const deps = dependencies(suppliedDeps)
  // Validate before reading/resetting any fixture and again at each SQL boundary.
  assertDisposableFixture(env, deps)
  runFixtureSql('mariadb', deps.readFileSync(resolve(ROOT, 'scripts/seed-e2e.sql'), 'utf8'), env, deps)
  runFixtureSql('postgres', 'DELETE FROM user_preferences WHERE user_id IN (7, 18); DELETE FROM revoked_tokens WHERE user_id IN (7, 18);', env, deps)
}

export function resetTicket(ticketId, name, env = process.env, suppliedDeps) {
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0 || ticketId > 2147483647 ||
      typeof name !== 'string' || !name.length || name.length > 255) fail()
  const nameHex = Buffer.from(name, 'utf8').toString('hex')
  const sql = `INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES (${ticketId}, 0, CONVERT(0x${nameHex} USING utf8mb4), NOW(), NOW(), 1, 3, 'Fixture E2E', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE status=1, solvedate=NULL, closedate=NULL, date_mod=NOW();
INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (${ticketId}, 1, 2) ON DUPLICATE KEY UPDATE groups_id=1, type=2;
DELETE FROM glpi_tickets_users WHERE tickets_id=${ticketId} AND type=2;
DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=${ticketId};
DELETE FROM glpi_itilfollowups WHERE itemtype='Ticket' AND items_id=${ticketId};`
  return runFixtureSql('mariadb', sql, env, suppliedDeps)
}

export function main(argv = process.argv.slice(2), env = process.env, suppliedDeps, io = {
  write: value => process.stdout.write(value), error: value => process.stderr.write(value),
}) {
  try {
    const deps = dependencies(suppliedDeps)
    if (argv.length === 1 && argv[0] === 'verify') assertDisposableFixture(env, deps)
    else if (argv.length === 1 && argv[0] === 'reset') resetFixtures(env, deps)
    else if (argv.length === 2 && argv[0] === 'sql' && ['mariadb', 'postgres'].includes(argv[1])) {
      // Check the target before consuming stdin; SQL and credentials never enter argv.
      assertDisposableFixture(env, deps)
      const sql = deps.readFileSync(0, 'utf8').toString()
      io.write(runFixtureSql(argv[1], sql, env, deps))
    } else if (argv.length === 2 && argv[0] === 'url' && ['desk', 'api', 'glpi'].includes(argv[1])) {
      const m = assertDisposableFixture(env, deps)
      io.write(`${m[`${argv[1] === 'desk' ? 'frontend' : argv[1]}Url`]}\n`)
    }
    else fail()
    return 0
  } catch {
    io.error(`${MESSAGE}\n`)
    return 1
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.exitCode = main()
}
