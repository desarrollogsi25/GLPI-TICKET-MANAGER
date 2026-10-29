import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import { fileURLToPath } from 'node:url'
import childProcess from 'node:child_process'
import * as guard from './guard.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const requireFrontend = createRequire(resolve(ROOT, 'frontend/package.json'))
const ts = requireFrontend('typescript')

// Load the real entrypoint bodies, while making every process/browser launch fail
// the test. This exercises no Playwright CLI, live server, browser, or Docker daemon.
function harness(fixture) {
  let processes = 0
  let browsers = 0
  const cache = new Map()
  const originalExec = childProcess.execFileSync
  const originalManifest = process.env.E2E_FIXTURE_MANIFEST
  const originalDeskUrl = process.env.E2E_DESK_URL
  const originalGlpiUrl = process.env.E2E_GLPI_URL
  delete process.env.E2E_FIXTURE_MANIFEST
  if (fixture) {
    process.env.E2E_DESK_URL = fixture.frontendUrl
    process.env.E2E_GLPI_URL = fixture.glpiUrl
  }
  childProcess.execFileSync = () => {
    processes++
    throw new Error('Unexpected child process before isolation guard')
  }
  syncBuiltinESMExports()

  function load(relativePath) {
    const filename = resolve(ROOT, relativePath)
    if (cache.has(filename)) return cache.get(filename)
    const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const exports = {}
    const module = { exports }
    cache.set(filename, exports)
    const require = specifier => {
      if (specifier === '@playwright/test') return {
        defineConfig: value => value,
        devices: { 'Desktop Chrome': {} },
        chromium: { launch: () => { browsers++; throw new Error('Unexpected browser launch') } },
      }
      if (specifier.endsWith('/guard.mjs')) return fixture
        ? { ...guard, assertDisposableFixture: () => fixture }
        : guard
      if (specifier.startsWith('.')) {
        return load(resolve(dirname(filename), `${specifier}.ts`))
      }
      return requireFrontend(specifier)
    }
    new Function('require', 'module', 'exports', output)(require, module, exports)
    return module.exports
  }

  return {
    load,
    assertNoEffects() {
      assert.equal(processes, 0, 'entrypoint must reject before any child process')
      assert.equal(browsers, 0, 'entrypoint must reject before launching a browser')
    },
    restore() {
      childProcess.execFileSync = originalExec
      syncBuiltinESMExports()
      if (originalManifest === undefined) delete process.env.E2E_FIXTURE_MANIFEST
      else process.env.E2E_FIXTURE_MANIFEST = originalManifest
      if (originalDeskUrl === undefined) delete process.env.E2E_DESK_URL
      else process.env.E2E_DESK_URL = originalDeskUrl
      if (originalGlpiUrl === undefined) delete process.env.E2E_GLPI_URL
      else process.env.E2E_GLPI_URL = originalGlpiUrl
    },
  }
}

test('config rejects absent fixture before tests, even when global setup would be disabled', () => {
  const h = harness()
  try {
    assert.throws(() => h.load('frontend/playwright.config.ts'), /E2E blocked/)
    h.assertNoEffects()
  } finally { h.restore() }
})

test('global setup rejects absent fixture before resetting SQL or launching browser', async () => {
  const h = harness()
  try {
    const setup = h.load('frontend/tests/e2e/global-setup.ts').default
    await assert.rejects(setup({}), /E2E blocked/)
    h.assertNoEffects()
  } finally { h.restore() }
})

test('verified runs keep reports, outputs, and auth state in separate run namespaces', () => {
  const outputs = []
  for (const runId of ['ab'.repeat(16), 'cd'.repeat(16)]) {
    const fixture = {
      runId,
      frontendUrl: 'http://127.0.0.1:49151',
      glpiUrl: 'http://127.0.0.1:49152',
    }
    const h = harness(fixture)
    try {
      const config = h.load('frontend/playwright.config.ts').default
      const runRoot = resolve('e2e-artifacts', runId)
      const reports = new Map(config.reporter)
      assert.equal(config.outputDir, resolve(runRoot, 'test-results'))
      assert.equal(config.use.storageState, resolve(runRoot, 'auth/tech1.json'))
      assert.equal(reports.get('html').outputFolder, resolve(runRoot, 'playwright-report'))
      assert.equal(reports.get('json').outputFile, resolve(runRoot, 'test-results/results.json'))
      assert.equal(reports.get('junit').outputFile, resolve(runRoot, 'test-results/junit.xml'))
      outputs.push([
        config.outputDir,
        config.use.storageState,
        reports.get('html').outputFolder,
        reports.get('json').outputFile,
        reports.get('junit').outputFile,
      ])
      h.assertNoEffects()
    } finally { h.restore() }
  }
  assert.equal(outputs[0].filter(path => outputs[1].includes(path)).length, 0,
    'a later run must never reuse earlier outputs or stored authentication')
})

for (const ci of [undefined, 'true']) {
  test(`ticket reset rejects absent fixture with CI=${ci ?? 'unset'}`, () => {
    const h = harness()
    const originalCI = process.env.CI
    if (ci === undefined) delete process.env.CI
    else process.env.CI = ci
    try {
      const { resetFixtureTicket } = h.load('frontend/tests/e2e/support/ticket-fixtures.ts')
      assert.throws(() => resetFixtureTicket(901, 'Synthetic regression fixture'), /E2E blocked/)
      h.assertNoEffects()
    } finally {
      if (originalCI === undefined) delete process.env.CI
      else process.env.CI = originalCI
      h.restore()
    }
  })
}
