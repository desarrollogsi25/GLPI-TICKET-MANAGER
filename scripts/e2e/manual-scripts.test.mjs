import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

// Every mutating helper must delegate to the same guard. A helper that opens
// its own Docker/DB route is an E2E isolation bypass even if it looks harmless.
const HELPERS = [
  'scripts/seed-glpi-users.js',
  'scripts/seed-tickets.js',
  'scripts/seed-glpi-categories.js',
  'scripts/verify-glpi-categories-flow.js',
  'scripts/seed-visual-forms.js',
  'scripts/seed-e2e.sh',
  'scripts/test-audit.sh',
  'scripts/provision-glpi-test-users.sh',
]

const SQL_SEEDS = ['scripts/seed-e2e.sql', 'scripts/seed-h38.sql', 'scripts/clean-glpi.sql']

function cleanEnv() {
  return { ...process.env, E2E_FIXTURE_MANIFEST: '', E2E_CONFIRM_DESTRUCTIVE: '' }
}

for (const relative of HELPERS) {
  test(`${relative} delegates to the fixture guard only`, () => {
    const body = readFileSync(resolve(ROOT, relative), 'utf8')
    assert.match(body, /e2e\/guard\.mjs/, 'must call the shared guard')
    assert.doesNotMatch(body, /docker\s+(compose\s+)?exec/, 'must not open its own Docker route')
    assert.doesNotMatch(body, /MARIADB_PASSWORD|PGPASSWORD/, 'must not read database credentials')
    assert.doesNotMatch(body, /['"][^'"]*\.env['"]/, 'must not read the repository .env')
    assert.doesNotMatch(body, /=\s*['"]secret['"]/, 'must not carry a credential fallback')
  })

  test(`${relative} exits non-zero before side effects without a fixture`, () => {
    const isShell = relative.endsWith('.sh')
    const result = spawnSync(isShell ? 'bash' : process.execPath, [relative], {
      cwd: ROOT, env: cleanEnv(), encoding: 'utf8', timeout: 15_000,
    })
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    assert.equal(result.status, 1, `${relative} must fail closed (status ${result.status})`)
    assert.match(output, /blocked/i)
  })
}

for (const relative of SQL_SEEDS) {
  test(`${relative} aborts before DML without the disposable sentinel`, () => {
    const body = readFileSync(resolve(ROOT, relative), 'utf8')
    assert.match(body, /e2e_fixture_identity/, 'must check the fixture sentinel in-database')
    assert.match(body, /SIGNAL SQLSTATE '45000'/, 'must abort, not warn')
    const sql = body.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    const sentinel = sql.indexOf('CALL e2e_assert_fixture();')
    const firstDml = sql.search(/\b(INSERT|UPDATE|DELETE)\b/)
    assert.ok(sentinel > 0 && sentinel < firstDml, 'sentinel check must precede the first DML')
  })
}
