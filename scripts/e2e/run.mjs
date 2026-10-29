#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { verifyFixtureResources, assertDisposableFixture, runFixtureSql } from './guard.mjs'
import { cleanupFixture, removeTemporaryFixtureDirectory } from './runner-cleanup.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const composeFile = resolve(root, 'docker-compose.e2e.yml')
const services = ['glpi-db', 'app-db', 'glpi', 'api', 'frontend']
const suppliedArgs = process.argv.slice(2)
const nativeGlpi = suppliedArgs[0] === '--native-glpi'
const args = nativeGlpi ? suppliedArgs.slice(1) : suppliedArgs
if (args.includes('--help')) {
  console.log('node scripts/e2e/run.mjs [--native-glpi] [--check] [-- Playwright arguments]\nCreates a new, memory-backed fixture; never uses the repository .env or local stack.\n--check validates Compose only, without starting containers.\n--native-glpi provisions forms and tests native GLPI submission instead of the API variant.')
  process.exit(0)
}
const checkOnly = args[0] === '--check'
const playwrightArgs = args[0] === '--' ? args.slice(1) : []
if (!checkOnly && args.length && args[0] !== '--') throw new Error('Use --help for supported arguments')
const playwrightCli = resolve(root, 'frontend/node_modules/@playwright/test/cli.js')
if (!checkOnly && !existsSync(playwrightCli)) throw new Error('Install the declared frontend dependencies before starting the isolated fixture')

const secret = () => randomBytes(32).toString('hex')
// StartupConfigurationValidator requires >=16 distinct characters. Hex keys
// occasionally miss a digit; use a wider alphabet and enforce the requirement.
let jwtKey
do { jwtKey = randomBytes(48).toString('base64url') } while (new Set(jwtKey).size < 16)
const runId = randomBytes(16).toString('hex')
const project = `glpi-e2e-${runId}`
const temp = mkdtempSync(resolve(tmpdir(), 'glpi-e2e-'))
const envFile = resolve(temp, 'fixture.env')
const manifestFile = resolve(temp, 'manifest.json')
const secrets = {
  E2E_RUN_ID: runId,
  E2E_MARIA_ROOT_PASSWORD: secret(), E2E_MARIA_PASSWORD: secret(), E2E_APP_PASSWORD: secret(),
  E2E_GLPI_APP_TOKEN: secret(), E2E_GLPI_USER_TOKEN: secret(), E2E_JWT_KEY: jwtKey, E2E_WEBHOOK_SECRET: secret(),
}
// Do not inherit targeting overrides, Compose configuration, or DB credentials.
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  !/^(COMPOSE_|DOCKER_HOST$|DOCKER_CONTEXT$|DOCKER_TLS|DOCKER_CERT|E2E_|MARIADB_|APP_DB_|GLPI_|JWT_)/.test(key)))
Object.assign(env, secrets)
writeFileSync(envFile, Object.entries(secrets).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 })

let context
let started = false
let manifest
let failed = false
let cleaning = false
let phase = 'preflight'
const progress = (next) => { phase = next; console.log(`[e2e] ${phase}`) }
const docker = (argv, options = {}) => {
  try {
    return execFileSync('docker', [...(context ? ['--context', context] : []), ...argv], {
      cwd: root, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 300_000,
      maxBuffer: 64 * 1024 * 1024, ...options,
    })
  } catch (error) {
    // Never print stderr/stdout: even failed builds can contain interpolated credentials.
    // Exit status/signal and a small OS-code allowlist diagnose failure without payloads.
    const status = Number.isInteger(error?.status) ? `exit ${error.status}` : 'no exit status'
    const code = ['ENOENT', 'ETIMEDOUT', 'ENOBUFS', 'EACCES', 'EPERM'].includes(error?.code) ? `, ${error.code}` : ''
    // Build/start diagnostics contain no runtime payloads. Redact generated values
    // and omit credential/configuration lines before reporting bounded errors.
    if (/^(build images|configure clean|install clean|provision synthetic)/.test(phase)) {
      let diagnostic = String(error?.stderr ?? '') + '\n' + String(error?.stdout ?? '')
      for (const value of Object.values(secrets)) diagnostic = diagnostic.split(value).join('[redacted]')
      diagnostic = diagnostic.split(/\r?\n/).filter(line =>
        (phase.startsWith('build images') || /error|failed|invalid|denied|conflict|unhealthy|not found|no such|cannot|could not|chown|chmod/i.test(line)) &&
        !/token|password|secret|authorization|config_db|connectionstring/i.test(line)).slice(-12).join('\n')
      if (diagnostic) console.error(diagnostic.slice(0, 2000))
    }
    const operation = argv.find(value => ['mkdir', 'chown', 'chmod', 'cp', 'php'].includes(value)) ?? argv[0]
    throw new Error(`Isolated fixture Docker operation failed during ${phase} (${operation}, ${status}${code})`)
  }
}
const compose = (argv, options) => docker(['compose', '--project-name', project, '--file', composeFile, '--env-file', envFile, ...argv], options)
const parse = (value) => {
  try { return JSON.parse(value) } catch { throw new Error('Docker returned invalid JSON for fixture metadata') }
}
const inspect = (id) => parse(docker(['inspect', id]))[0]
const portUrl = (resource, port) => {
  const bindings = resource.NetworkSettings.Ports[`${port}/tcp`]
  if (bindings?.length !== 1 || bindings[0].HostIp !== '127.0.0.1') {
    const service = resource.Config?.Labels?.['com.docker.compose.service']
    throw new Error(`Fixture port must bind exclusively to loopback (${services.includes(service) ? service : 'unknown'}:${port}, bindings=${JSON.stringify(bindings ?? [])})`)
  }
  return `http://127.0.0.1:${bindings[0].HostPort}`
}
const sqlRaw = (engine, sql) => {
  verifyFixtureResources(env)
  const maria = engine === 'mariadb'
  return docker(['exec', '-i', '-e', maria ? 'MYSQL_PWD' : 'PGPASSWORD', manifest.containers[maria ? 'glpi-db' : 'app-db'],
    ...(maria ? ['mariadb', '-ue2e', '--batch', '--skip-column-names', 'glpi']
      : ['psql', '-U', 'e2e', '-d', 'glpi_ticket_manager', '-v', 'ON_ERROR_STOP=1', '-tA'])],
  { input: sql, env: { ...env, MYSQL_PWD: secrets.E2E_MARIA_PASSWORD, PGPASSWORD: secrets.E2E_APP_PASSWORD } })
}
async function ready(url, predicate = response => response.ok) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    try { if (predicate(await fetch(url, { signal: AbortSignal.timeout(3000) }))) return } catch { /* retry startup only */ }
    await delay(1000)
  }
  throw new Error('Isolated fixture did not become ready before the deadline')
}
function cleanup() {
  if (cleaning) return
  cleaning = true
  try {
    if (started) {
      progress('verify and remove exclusive fixture resources')
      cleanupFixture({ docker, compose, project, runId, manifest })
      console.log('[e2e] Exclusive fixture removed; no project containers, volumes or networks remain')
    }
  } finally {
    // Path originates from mkdtemp, never from an environment variable/manifest.
    removeTemporaryFixtureDirectory(temp)
  }
}
process.once('SIGINT', () => { try { cleanup() } finally { process.exit(130) } })
process.once('SIGTERM', () => { try { cleanup() } finally { process.exit(143) } })

try {
  progress('validate local Docker context and standalone Compose configuration')
  context = docker(['context', 'show']).trim()
  const contextInfo = parse(docker(['context', 'inspect', context]))[0]
  if (!/^(unix:\/\/|npipe:\/\/)/.test(contextInfo?.Endpoints?.docker?.Host ?? '')) throw new Error('Fixture runner requires a local Docker context')
  compose(['config', '--quiet'])
  if (checkOnly) {
    console.log('[e2e] Standalone Compose configuration valid; no containers started')
  } else {
    if (docker(['ps', '-aq', '--filter', `label=com.docker.compose.project=${project}`]).trim()
      || docker(['network', 'ls', '-q', '--filter', `label=com.docker.compose.project=${project}`]).trim()
      || docker(['volume', 'ls', '-q', '--filter', `label=com.docker.compose.project=${project}`]).trim()) {
      throw new Error('Fixture project already exists; refusing reuse')
    }
    started = true
    progress('build images and start the new memory-backed fixture (this may take several minutes)')
    compose(['up', '-d', '--build', '--wait', '--wait-timeout', '180'])
    progress('resolve and verify exclusive container identities and loopback ports')
    const containers = Object.fromEntries(services.map(service => {
      const id = compose(['ps', '--quiet', service]).trim()
      if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Fixture service identity could not be resolved')
      return [service, id]
    }))
    manifest = {
      version: 1, runId, context, project, composeFile, containers,
      frontendUrl: portUrl(inspect(containers.frontend), 5173),
      glpiUrl: portUrl(inspect(containers.glpi), 80), apiUrl: portUrl(inspect(containers.api), 8080),
      credentials: { mariaUser: 'e2e', mariaPassword: secrets.E2E_MARIA_PASSWORD, appUser: 'e2e', appPassword: secrets.E2E_APP_PASSWORD },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    writeFileSync(manifestFile, JSON.stringify(manifest), { mode: 0o600 })
    env.E2E_FIXTURE_MANIFEST = manifestFile
    // Consent is scoped to this random run; stale manifests cannot authorize a reset.
    env.E2E_CONFIRM_DESTRUCTIVE = runId
    verifyFixtureResources(env)

    // Install clean GLPI reference data; never import the tracked legacy DB dump.
    // Bootstrap is the only path without a DB sentinel, after checking new resource IDs.
    progress('configure clean GLPI database connection')
    const config = `<?php\nclass DB extends DBmysql { public $dbhost='glpi-db'; public $dbuser='e2e'; public $dbpassword='${secrets.E2E_MARIA_PASSWORD}'; public $dbdefault='glpi'; public $use_timezones=false; public $use_utf8mb4=true; public $allow_datetime=false; public $allow_signed_keys=false; }\n`
    verifyFixtureResources(env)
    // docker cp archives the container filesystem and cannot reliably address
    // tmpfs contents. Write through exec stdin, keeping secrets out of argv.
    docker(['exec', '-i', '-u', '0', containers.glpi, 'sh', '-c',
      'mkdir -p /var/glpi/config && cat > /var/glpi/config/config_db.php'], { input: config })
    docker(['exec', '-u', '0', containers.glpi, 'chown', '-R', 'www-data:www-data', '/var/glpi'])
    docker(['exec', '-u', '0', containers.glpi, 'chmod', '640', '/var/glpi/config/config_db.php'])
    verifyFixtureResources(env)
    progress('install clean GLPI schema and reference data')
    docker(['exec', '-u', 'www-data', '-w', '/var/www/glpi', containers.glpi,
      'php', 'bin/console', 'database:install', '--no-interaction', '--no-telemetry', '--default-language=es_ES'])
    for (const name of ['001_init.sql', '002_add_updated_by_to_app_settings.sql', '003_roles.sql', '004_schema_migrations.sql', '005_add_solicitante_role.sql', '006_notifications.sql']) {
      progress(`apply disposable PostgreSQL migration ${name}`)
      sqlRaw('postgres', readFileSync(resolve(root, 'db/migrations', name), 'utf8'))
    }
    progress('create and verify both database identity sentinels')
    for (const engine of ['mariadb', 'postgres']) {
      sqlRaw(engine, `CREATE TABLE e2e_fixture_identity (run_id VARCHAR(32) PRIMARY KEY); INSERT INTO e2e_fixture_identity(run_id) VALUES ('${runId}');`)
    }
    assertDisposableFixture(env)
    progress('seed synthetic GLPI users, groups and tickets')
    runFixtureSql('mariadb', readFileSync(resolve(root, 'scripts/seed-e2e.sql'), 'utf8'), env)

    // The installer generates the encryption key; provision only synthetic API credentials.
    progress('provision synthetic GLPI API credentials')
    const php = `<?php
require '/var/www/glpi/vendor/autoload.php';
$kernel = new \\Glpi\\Kernel\\Kernel();
$kernel->boot();
global $DB;
$key = new GLPIKey();
if (!$DB->insert('glpi_apiclients', ['id'=>2,'name'=>'Disposable E2E','entities_id'=>0,'is_recursive'=>1,'app_token'=>$key->encrypt('${secrets.E2E_GLPI_APP_TOKEN}'),'is_active'=>1])) exit(1);
if (!$DB->update('glpi_users', ['api_token'=>$key->encrypt('${secrets.E2E_GLPI_USER_TOKEN}'),'api_token_date'=>date('Y-m-d H:i:s')], ['id'=>10])) exit(1);
foreach (['enable_api','enable_api_login_external_token'] as $name) { if (!$DB->update('glpi_configs', ['value'=>'1'], ['context'=>'core','name'=>$name])) exit(1); }
$hash = password_hash('User1Pass!', PASSWORD_BCRYPT);
if (!$DB->insert('glpi_users', ['id'=>19,'name'=>'user1','password'=>$hash,'authtype'=>1,'auths_id'=>0,'is_active'=>1,'is_deleted'=>0,'profiles_id'=>1,'entities_id'=>0])) exit(1);
if (!$DB->insert('glpi_profiles_users', ['users_id'=>19,'profiles_id'=>1,'entities_id'=>0,'is_recursive'=>0,'is_default_profile'=>1])) exit(1);
`
    assertDisposableFixture(env)
    docker(['exec', '-i', '-u', 'www-data', containers.glpi, 'php'], { input: php })
    progress('wait for frontend and API readiness')
    await ready(`${manifest.frontendUrl}/login`)
    await ready(`${manifest.apiUrl}/health/ready`)
    Object.assign(env, { E2E_DESK_URL: manifest.frontendUrl, E2E_GLPI_URL: manifest.glpiUrl,
      E2E_API_URL: manifest.apiUrl, E2E_TECH_USERNAME: 'tech1', E2E_TECH_PASSWORD: 'Tech1Pass!',
      E2E_REQUESTER_USERNAME: 'user1', E2E_REQUESTER_PASSWORD: 'User1Pass!', E2E_ADMIN_USERNAME: 'admin_test',
      E2E_ADMIN_PASSWORD: 'Password123!', E2E_GLPI_NATIVE: nativeGlpi ? 'true' : 'false' })
    assertDisposableFixture(env)
    progress('verify GLPI API authentication using synthetic credentials')
    const sessionResponse = await fetch(`${manifest.glpiUrl}/apirest.php/initSession`, {
      headers: { 'App-Token': secrets.E2E_GLPI_APP_TOKEN, Authorization: `user_token ${secrets.E2E_GLPI_USER_TOKEN}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!sessionResponse.ok) throw new Error('Synthetic GLPI API credentials failed the fixture readiness check')
    let session
    try { session = await sessionResponse.json() } catch { throw new Error('GLPI fixture returned invalid session JSON') }
    if (typeof session.session_token !== 'string' || !session.session_token) throw new Error('GLPI fixture did not return a session')
    await fetch(`${manifest.glpiUrl}/apirest.php/killSession`, {
      headers: { 'App-Token': secrets.E2E_GLPI_APP_TOKEN, 'Session-Token': session.session_token },
      signal: AbortSignal.timeout(10_000),
    })
    if (nativeGlpi) {
      progress('provision guarded synthetic visual forms for native GLPI submission')
      const visualSeed = spawnSync(process.execPath, [resolve(root, 'scripts/seed-visual-forms.js')], { cwd: root, env, stdio: 'inherit' })
      if (visualSeed.error || visualSeed.status !== 0) throw new Error('Synthetic visual fixture provisioning failed')
    }
    progress('run Playwright against the exclusive memory-backed fixture')
    const result = spawnSync(process.execPath, [playwrightCli, 'test', ...playwrightArgs], { cwd: resolve(root, 'frontend'), env, stdio: 'inherit' })
    if (result.error || result.status !== 0) throw new Error('Playwright did not pass in the isolated fixture')
  }
} catch (error) {
  failed = true
  console.error(`[e2e] Failed phase: ${phase}. ${error instanceof Error ? error.message : 'Fixture failed'}`)
} finally {
  try { cleanup() } catch (error) { failed = true; console.error(`[e2e] ${error instanceof Error ? error.message : 'Cleanup failed'}`) }
}
process.exitCode = failed ? 1 : 0
