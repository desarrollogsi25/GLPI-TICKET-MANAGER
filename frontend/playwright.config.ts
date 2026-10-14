import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  baseURL: 'http://localhost:5173',
  use: {
    headless: true,
    trace: 'on-first-retry',
  },
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})