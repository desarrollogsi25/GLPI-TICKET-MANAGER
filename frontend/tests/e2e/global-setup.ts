import { chromium, type FullConfig } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { assertDisposableFixture, resetFixtures } from '../../../scripts/e2e/guard.mjs'

export default async function globalSetup(_config: FullConfig) {
  // No browser or reset may target a stack that the disposable runner did not create.
  const fixture = assertDisposableFixture()
  const techPassword = process.env.E2E_TECH_PASSWORD
  if (!techPassword) throw new Error('E2E blocked: the fixture runner must provide E2E_TECH_PASSWORD.')
  const authFile = resolve('e2e-artifacts', fixture.runId, 'auth/tech1.json')
  resetFixtures()

  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ baseURL: fixture.frontendUrl })
    const page = await context.newPage()
    await page.goto('/login')
    await page.fill('input[name="username"]', 'tech1')
    await page.fill('input[name="password"]', techPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(kanban|dashboard|tickets|queue)/, { timeout: 60000 })

    mkdirSync(dirname(authFile), { recursive: true })
    await context.storageState({ path: authFile })
    await context.close()
  } finally {
    await browser.close()
  }
}
