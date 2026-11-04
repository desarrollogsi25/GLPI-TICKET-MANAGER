import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const ARTIFACT_DIR = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\2a3d5283-d05b-4bc9-8a2b-393b9ff33c83\\screenshots\\kanban'
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
}

function getCred(user) {
  const key = `CRED_${user.toUpperCase()}`
  if (process.env[key]) return process.env[key]
  for (const candidate of ['.env.local', '../.env.local', '../../.env.local']) {
    try {
      if (fs.existsSync(candidate)) {
        const text = fs.readFileSync(candidate, 'utf8')
        const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
        if (match) return match[1].trim()
      }
    } catch {}
  }
  return ''
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  })
  const page = await context.newPage()

  console.log('[1] Logging in as tech_dev...')
  const password = getCred('tech_dev')
  await page.goto('https://10.10.40.31/login', { waitUntil: 'networkidle' })
  await page.waitForSelector('input[name="username"]', { timeout: 10000 })
  await page.fill('input[name="username"]', 'tech_dev')
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  console.log(`[AUTH TM] Logged in successfully: ${page.url()}`)

  console.log('[2] Navigating to Kanban board...')
  await page.goto('https://10.10.40.31/kanban', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  console.log('[3] Capturing full Kanban board screenshot...')
  const fullBoardPath = path.join(ARTIFACT_DIR, '01_kanban_unified_in_process_desktop.png')
  await page.screenshot({ path: fullBoardPath, fullPage: false })
  console.log(`Saved screenshot: ${fullBoardPath}`)

  console.log('[4] Capturing focused single "En proceso" column...')
  const inProcessCol = page.locator('[data-testid="kanban-column-in-process"]')
  if (await inProcessCol.isVisible()) {
    const colShotPath = path.join(ARTIFACT_DIR, '02_kanban_column_in_process_detail.png')
    await inProcessCol.screenshot({ path: colShotPath })
    console.log(`Saved screenshot: ${colShotPath}`)
  }

  // Also capture mobile viewport view
  console.log('[5] Capturing mobile viewport view...')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(1500)
  const mobileShotPath = path.join(ARTIFACT_DIR, '03_kanban_mobile_tabs.png')
  await page.screenshot({ path: mobileShotPath })
  console.log(`Saved screenshot: ${mobileShotPath}`)

  await browser.close()
  console.log('[SUCCESS] All Kanban screenshots captured successfully.')
}

run().catch((err) => {
  console.error('[ERROR]', err)
  process.exit(1)
})
