import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // Keep local runs fast; shared CI runners need retries and longer web-first waits.
  retries: process.env.CI ? 2 : 0,
  timeout: process.env.CI ? 90000 : 30000,
  expect: { timeout: process.env.CI ? 15000 : 5000 },
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'retain-on-failure',
    storageState: 'tests/e2e/.auth/tech1.json',
  },
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
