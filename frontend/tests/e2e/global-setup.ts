import { chromium, type FullConfig } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const AUTH_FILE = 'tests/e2e/.auth/tech1.json'

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'tech1')
  await page.fill('input[name="password"]', 'Tech1Pass!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue)/, { timeout: 60000 })

  // Ensure storage is persisted.
  mkdirSync(dirname(AUTH_FILE), { recursive: true })
  await context.storageState({ path: AUTH_FILE })
  await context.close()
  await browser.close()
}
