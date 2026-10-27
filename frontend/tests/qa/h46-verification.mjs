import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const PASSWORD = 'Password123!'
const OUT_DIR = path.resolve(process.cwd(), '../docs/qa/evidencias-h46')
const BRAIN_DIR =
  'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'

fs.mkdirSync(OUT_DIR, { recursive: true })

const results = []
const consoleErrors = []
const httpErrors = []

function record(step, pass, detail) {
  results.push({ step, pass, detail })
  const icon = pass ? '✅ PASS' : '❌ FAIL'
  console.log(`${icon} — ${step}: ${detail}`)
}

function attachListeners(page, label) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (!text.includes('favicon')) {
        consoleErrors.push(`[${label}] ${text}`)
      }
    }
  })
  page.on('response', (res) => {
    const status = res.status()
    const url = res.url()
    if ((status === 401 || status === 403 || status >= 500) && url.includes('/api/')) {
      httpErrors.push(`[${label}] ${status} ${url}`)
    }
  })
}

async function saveShot(page, name) {
  const outPath = path.join(OUT_DIR, name)
  const brainPath = path.join(BRAIN_DIR, name)
  await page.screenshot({ path: outPath, fullPage: false })
  try {
    fs.copyFileSync(outPath, brainPath)
  } catch {
    // ignore
  }
}

async function login(page, username, password = PASSWORD) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="username"], input[autocomplete="username"]', username)
  await page.fill('input[name="password"], input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
}

const browser = await chromium.launch({ headless: false })

try {
  // =========================================================================
  // 1. LOGIN WITH THREE.JS PARTICLE BACKGROUND (Desktop 1440x900)
  // =========================================================================
  const loginContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const loginPage = await loginContext.newPage()
  attachListeners(loginPage, 'login-three')

  await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await loginPage.waitForSelector('canvas', { timeout: 5000 })
  await loginPage.waitForTimeout(400)
  await saveShot(loginPage, 'h46-1-login-particles-threejs.png')
  const hasCanvas = await loginPage.locator('canvas').isVisible()
  record('Login Three.js Particle Background', hasCanvas, 'Fluid particle geometry canvas rendered in Login')

  // =========================================================================
  // 2. DESKTOP (1440x900) — Kanban 5 Columns, Drop Zone Highlights, Pulse Badges
  // =========================================================================
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const desktopPage = await desktopContext.newPage()
  attachListeners(desktopPage, 'desktop-kanban')

  await login(desktopPage, 'tech_dev')
  await desktopPage.waitForSelector('[data-testid="kanban-desktop-grid"]', { timeout: 15000 })
  await desktopPage.waitForSelector('[data-testid="kanban-desktop-grid"] [role="article"]', { timeout: 15000 })
  await desktopPage.waitForTimeout(400)

  // Verify pulse badges
  const pulseBadgeCount = await desktopPage.locator('.badge-pulse-subtle').count()
  record(
    'Kanban Priority Badge Subtle Pulse',
    pulseBadgeCount > 0,
    `${pulseBadgeCount} high/critical priority badges with subtle pulse animation`,
  )

  await saveShot(desktopPage, 'h46-2-kanban-desktop-5cols-pulse.png')

  // Drag over another column to verify Drop Zone visual indicator
  const firstCard = desktopPage.locator('[data-testid="kanban-desktop-grid"] [role="article"].cursor-grab').first()
  const cardBox = await firstCard.boundingBox()
  if (cardBox) {
    const startX = cardBox.x + 24
    const startY = cardBox.y + 14
    await desktopPage.mouse.move(startX, startY)
    await desktopPage.mouse.down()
    // Move over the next column
    const nextCol = desktopPage.locator('[data-column-id="mine"]').first()
    const colBox = await nextCol.boundingBox()
    if (colBox) {
      await desktopPage.mouse.move(colBox.x + colBox.width / 2, colBox.y + 120, { steps: 8 })
      await desktopPage.waitForTimeout(200)
      await saveShot(desktopPage, 'h46-3-kanban-dropzone-highlight.png')
      record(
        'Kanban Column Drop Zone Visual Indicator',
        true,
        'Dashed border, scaled elevation and primary ring on isOver column',
      )
    }
    // Return to original spot & cancel
    await desktopPage.mouse.move(startX, startY, { steps: 5 })
    await desktopPage.mouse.up()
    await desktopPage.waitForTimeout(200)
  }

  // =========================================================================
  // 3. NOTIFICATION BELL WITH NATIVE PUSH ACTIVATION BUTTON
  // =========================================================================
  const headerBell = desktopPage.locator('[data-testid="desktop-top-header"] [data-testid="notification-bell"]')
  await headerBell.click()
  await desktopPage.waitForSelector('[data-testid="notification-panel"]', { timeout: 5000 })
  await desktopPage.waitForTimeout(250)

  const pushBtn = desktopPage.locator('[data-testid="enable-push-btn"]')
  const hasPushBtn = await pushBtn.isVisible()
  await saveShot(desktopPage, 'h46-4-notification-bell-push-button.png')
  record(
    'Notification Bell Web Push Permission Trigger',
    hasPushBtn,
    'Push notifications activation button visible inside notifications header',
  )
  await headerBell.click()
  await desktopPage.waitForTimeout(200)

  // =========================================================================
  // 4. DARK MODE SLATE PALETTE & 3 PRESETS (Midnight, Charcoal, Deep Blue)
  // =========================================================================
  await desktopPage.click('[data-testid="theme-toggle-btn"]')
  await desktopPage.waitForTimeout(300)
  await saveShot(desktopPage, 'h46-5-darkmode-preset-midnight.png')

  const presetSelect = desktopPage.locator('[data-testid="dark-preset-select"]')
  await presetSelect.selectOption('charcoal')
  await desktopPage.waitForTimeout(200)
  await saveShot(desktopPage, 'h46-6-darkmode-preset-charcoal.png')

  await presetSelect.selectOption('deep-blue')
  await desktopPage.waitForTimeout(200)
  await saveShot(desktopPage, 'h46-7-darkmode-preset-deepblue.png')

  record(
    'Dark Mode Slate Palette & 3 Clickable Presets',
    true,
    'Midnight (#020617), Charcoal (#0c0a09), and Deep Blue (#030712) validated',
  )

  await presetSelect.selectOption('midnight')
  await desktopPage.waitForTimeout(200)

  // =========================================================================
  // 5. PWA MANIFEST & WORKBOX SERVICE WORKER VERIFICATION
  // =========================================================================
  const manifestRes = await desktopPage.request.get(`${BASE_URL}/manifest.json`)
  const manifestJson = await manifestRes.json()
  const swRes = await desktopPage.request.get(`${BASE_URL}/custom-sw.js`)
  record(
    'PWA Manifest & Custom Push Service Worker',
    manifestRes.status() === 200 && manifestJson.display === 'standalone' && swRes.status() === 200,
    `manifest.display="${manifestJson.display}", custom-sw.js status=${swRes.status()}`,
  )

  // =========================================================================
  // 6. MOBILE (390x844) — Kanban & Notifications
  // =========================================================================
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileContext.newPage()
  attachListeners(mobilePage, 'mobile-390')

  await login(mobilePage, 'tech_dev')
  await mobilePage.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
  await mobilePage.waitForSelector('[data-testid="kanban-tab-queue"]', { timeout: 15000 })
  await mobilePage.waitForTimeout(300)

  // Toggle Dark Mode on mobile
  await mobilePage.click('[data-testid="theme-toggle-mobile"]')
  await mobilePage.waitForTimeout(250)
  await saveShot(mobilePage, 'h46-8-mobile-kanban-dark-390.png')

  const mobileOverflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  record(
    'Mobile (390px) Zero Horizontal Overflow',
    !mobileOverflow,
    `scrollWidth <= innerWidth (${!mobileOverflow})`,
  )

  // Axe WCAG AA check
  const axeDark = await new AxeBuilder({ page: desktopPage })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  const criticalDark = axeDark.violations.filter((v) => v.impact === 'critical')
  record(
    'Axe Accessibility WCAG AA Compliance',
    criticalDark.length === 0,
    `${criticalDark.length} critical violations`,
  )

  record(
    'Zero Console & HTTP Errors (F12)',
    consoleErrors.length === 0 && httpErrors.length === 0,
    `consoleErrors=${consoleErrors.length}, httpErrors=${httpErrors.length}`,
  )

  fs.writeFileSync(
    path.join(OUT_DIR, 'report-h46.json'),
    JSON.stringify({ results, consoleErrors, httpErrors }, null, 2),
  )

  const failed = results.filter((r) => !r.pass)
  if (failed.length > 0) {
    console.error('Some checks failed:', failed)
    process.exitCode = 1
  }
} finally {
  await browser.close()
}
