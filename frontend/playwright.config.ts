import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // Keep local runs fast; shared CI runners need retries and longer web-first waits.
  retries: process.env.CI ? 2 : 0,
  timeout: process.env.CI ? 90000 : 30000,
  expect: { timeout: process.env.CI ? 15000 : 5000 },
  workers: 1,
  // In CI a test that only passes after a retry is reported as a failure.
  failOnFlakyTests: !!process.env.CI,
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: 'tests/e2e/.auth/tech1.json',
  },
  // Fixed paths so CI can collect them as artifacts.
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
