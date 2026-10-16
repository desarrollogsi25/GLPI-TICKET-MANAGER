import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  baseURL: 'http://localhost:5173',
  globalSetup: './tests/e2e/global-setup.ts',
  workers: 1,
  use: {
    headless: true,
    trace: 'on-first-retry',
    storageState: 'tests/e2e/.auth/tech1.json',
  },
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})