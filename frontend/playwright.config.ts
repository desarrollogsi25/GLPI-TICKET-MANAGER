import { defineConfig, devices } from '@playwright/test'
import { assertDisposableFixture } from '../scripts/e2e/guard.mjs'
import { fixtureUrl } from './tests/e2e/support/fixture-url'
import { resolve } from 'node:path'

// Validate even if the caller disables globalSetup: mutating specs require isolation.
const fixture = assertDisposableFixture()
const artifacts = resolve('e2e-artifacts', fixture.runId)
if (fixtureUrl('desk') !== new URL(fixture.frontendUrl).origin ||
    fixtureUrl('glpi') !== new URL(fixture.glpiUrl).origin) {
  throw new Error('E2E blocked: runner URLs do not match the disposable fixture.')
}

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // Keep local runs fast; shared CI runners need retries and longer web-first waits.
  retries: process.env.CI ? 2 : 0,
  timeout: process.env.CI ? 90000 : 60000,
  expect: { timeout: process.env.CI ? 15000 : 10000 },
  workers: 1,
  // In CI a test that only passes after a retry is reported as a failure.
  failOnFlakyTests: !!process.env.CI,
  outputDir: resolve(artifacts, 'test-results'),
  use: {
    baseURL: fixture.frontendUrl,
    headless: true,
    // Traces embed authorization headers; retain screenshots/video instead.
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: resolve(artifacts, 'auth/tech1.json'),
  },
  // Per-run paths preserve reports and credentials from previous executions.
  reporter: [
    ['list'],
    ['html', { outputFolder: resolve(artifacts, 'playwright-report'), open: 'never' }],
    ['json', { outputFile: resolve(artifacts, 'test-results/results.json') }],
    ['junit', { outputFile: resolve(artifacts, 'test-results/junit.xml') }],
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
