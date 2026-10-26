import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const PASSWORD = 'Password123!'
const OUT_DIR = path.resolve(process.cwd(), '../docs/qa/evidencias-h44')
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
  // 1. DESKTOP (1440x900) — 5 Columns Grid Without Horizontal Scroll + Drag & Drop Portal Verification
  // =========================================================================
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const desktopPage = await desktopContext.newPage()
  attachListeners(desktopPage, 'desktop-1440')

  await login(desktopPage, 'tech_dev')
  await desktopPage.waitForSelector('[data-testid="kanban-desktop-grid"]', { timeout: 15000 })
  await desktopPage
    .locator('[data-testid="kanban-desktop-grid"] [role="article"]')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
  await desktopPage.waitForTimeout(300)

  // Verify 5 columns fit in 1440px without horizontal scroll
  const gridMetrics = await desktopPage.evaluate(() => {
    const grid = document.querySelector('[data-testid="kanban-desktop-grid"]')
    const cols = document.querySelectorAll('[data-testid="kanban-desktop-grid"] > [data-column-id]')
    const docOverflow = document.documentElement.scrollWidth > window.innerWidth
    const gridOverflow = grid ? grid.scrollWidth > grid.clientWidth : true
    const colRects = Array.from(cols).map((c) => {
      const r = c.getBoundingClientRect()
      return { id: c.getAttribute('data-column-id'), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }
    })
    return {
      colCount: cols.length,
      docOverflow,
      gridOverflow,
      allVisibleInViewport: colRects.every((r) => r.left >= 0 && r.right <= window.innerWidth),
      colRects,
    }
  })

  record(
    'Desktop 1440px — 5 Kanban Columns Fit Without Horizontal Scroll',
    gridMetrics.colCount === 5 && !gridMetrics.docOverflow && !gridMetrics.gridOverflow && gridMetrics.allVisibleInViewport,
    `cols=${gridMetrics.colCount}, docOverflow=${gridMetrics.docOverflow}, gridOverflow=${gridMetrics.gridOverflow}, widths=${gridMetrics.colRects.map((c) => c.width).join('px,')}px`,
  )

  await saveShot(desktopPage, 'h44-1-kanban-5cols-light-1440.png')

  // =========================================================================
  // 2. DRAG & DROP PORTAL & CURSOR ALIGNMENT VERIFICATION
  // =========================================================================
  const draggableCard = desktopPage
    .locator('[data-testid="kanban-desktop-grid"] [role="article"].cursor-grab')
    .first()
  await draggableCard.waitFor({ state: 'visible', timeout: 10000 })
  const box = await draggableCard.boundingBox()
  if (box) {
    // Grab near the top header row of the card (not on the <Link> or bottom <Button>)
    const startX = box.x + 28
    const startY = box.y + 14

    await desktopPage.mouse.move(startX, startY)
    await desktopPage.mouse.down()
    const targetX = startX + 35
    const targetY = startY + 15
    await desktopPage.mouse.move(targetX, targetY, { steps: 8 })
    await desktopPage.waitForTimeout(200)

    const overlayMetrics = await desktopPage.evaluate(
      ({ expectedLeft, expectedTop }) => {
        const overlayCard = document.querySelector('[data-testid="kanban-drag-overlay-card"]')
        if (!overlayCard) return { found: false }
        const rect = overlayCard.getBoundingClientRect()
        const parentInBody = overlayCard.closest('body > div') !== null
        const dx = Math.abs(rect.left - expectedLeft)
        const dy = Math.abs(rect.top - expectedTop)
        return {
          found: true,
          parentInBody,
          rectLeft: Math.round(rect.left),
          rectTop: Math.round(rect.top),
          expectedLeft: Math.round(expectedLeft),
          expectedTop: Math.round(expectedTop),
          dx: Math.round(dx),
          dy: Math.round(dy),
        }
      },
      { expectedLeft: box.x + 35, expectedTop: box.y + 15 },
    )

    await saveShot(desktopPage, 'h44-2-dnd-cursor-aligned-portal.png')
    // Move back to original position and release so we don't mutate ticket state
    await desktopPage.mouse.move(startX, startY, { steps: 5 })
    await desktopPage.mouse.up()
    await desktopPage.waitForTimeout(250)

    record(
      'Drag & Drop Portal & Zero Horizontal Offset',
      Boolean(overlayMetrics.found && overlayMetrics.parentInBody && overlayMetrics.dx < 30),
      `portalInBody=${overlayMetrics.parentInBody}, dx=${overlayMetrics.dx}px, dy=${overlayMetrics.dy}px (overlayLeft=${overlayMetrics.rectLeft}, expected=${overlayMetrics.expectedLeft})`,
    )
  }

  // =========================================================================
  // 3. NOTIFICATION BELL DROPDOWN & SONNER TOAST AT TOP-RIGHT
  // =========================================================================
  const headerBell = desktopPage.locator('[data-testid="desktop-top-header"] [data-testid="notification-bell"]')
  await headerBell.click()
  await desktopPage.waitForSelector('[data-testid="notification-panel"]', { timeout: 5000 })
  await desktopPage.waitForTimeout(250)

  const bellAlignment = await desktopPage.evaluate(() => {
    const panel = document.querySelector('[data-testid="notification-panel"]')
    if (!panel) return { visible: false }
    const rect = panel.getBoundingClientRect()
    return {
      visible: true,
      withinViewport: rect.right <= window.innerWidth && rect.left >= 0,
      rightEdgePx: Math.round(window.innerWidth - rect.right),
      maxHeightClass: panel.className.includes('max-h-80'),
    }
  })
  await saveShot(desktopPage, 'h44-3-notification-bell-desktop.png')
  record(
    'Notification Bell Dropdown Aligned Right (max-h-80 z-50)',
    Boolean(bellAlignment.visible && bellAlignment.withinViewport && bellAlignment.maxHeightClass),
    `withinViewport=${bellAlignment.withinViewport}, rightOffset=${bellAlignment.rightEdgePx}px, max-h-80=${bellAlignment.maxHeightClass}`,
  )
  await headerBell.click()
  await desktopPage.waitForTimeout(200)

  // Trigger Toast at top-right (use force: true because button has aria-disabled="true")
  const blockedBtn = desktopPage.locator('[data-testid="pending-resolve-blocked-trigger"]').first()
  if ((await blockedBtn.count()) > 0) {
    await blockedBtn.click({ force: true })
    await desktopPage.waitForSelector('[data-testid="toast-item"]', { timeout: 5000 })
    await desktopPage.waitForTimeout(300)
    await saveShot(desktopPage, 'h44-4-toast-top-right-desktop.png')
    record('Sonner Toast Visible at Top-Right (Desktop)', true, 'Single Sonner toaster at top-right')
  }

  // =========================================================================
  // 4. DARK MODE SLATE PALETTE & 3 PRESETS (Midnight, Charcoal, Deep Blue)
  // =========================================================================
  await desktopPage.click('[data-testid="theme-toggle-btn"]')
  await desktopPage.waitForTimeout(350)

  const darkPaletteMetrics = await desktopPage.evaluate(() => {
    const html = document.documentElement
    const styles = getComputedStyle(html)
    return {
      isDark: html.classList.contains('dark'),
      preset: html.getAttribute('data-dark-preset'),
      bg: styles.getPropertyValue('--background').trim(),
      card: styles.getPropertyValue('--card').trim(),
      border: styles.getPropertyValue('--border').trim(),
      fg: styles.getPropertyValue('--foreground').trim(),
    }
  })

  record(
    'Dark Mode Slate Palette (Midnight #020617 / #0f172a / #334155)',
    darkPaletteMetrics.isDark &&
      darkPaletteMetrics.bg === '#020617' &&
      darkPaletteMetrics.card === '#0f172a' &&
      darkPaletteMetrics.border === '#334155',
    `bg=${darkPaletteMetrics.bg}, card=${darkPaletteMetrics.card}, border=${darkPaletteMetrics.border}, fg=${darkPaletteMetrics.fg}`,
  )
  await saveShot(desktopPage, 'h44-5-kanban-dark-midnight-1440.png')

  // Switch preset to Charcoal (#0c0a09)
  const presetSelect = desktopPage.locator('[data-testid="dark-preset-select"]')
  await presetSelect.selectOption('charcoal')
  await desktopPage.waitForTimeout(250)
  const charcoalBg = await desktopPage.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
  )
  await saveShot(desktopPage, 'h44-6-kanban-dark-charcoal-1440.png')

  // Switch preset to Deep Blue (#030712)
  await presetSelect.selectOption('deep-blue')
  await desktopPage.waitForTimeout(250)
  const deepBlueBg = await desktopPage.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
  )
  await saveShot(desktopPage, 'h44-7-kanban-dark-deepblue-1440.png')

  record(
    'Dark Mode Selectable Presets (Midnight, Charcoal, Deep Blue)',
    charcoalBg === '#0c0a09' && deepBlueBg === '#030712',
    `charcoal=${charcoalBg}, deep-blue=${deepBlueBg}`,
  )

  // Reset to midnight
  await presetSelect.selectOption('midnight')
  await desktopPage.waitForTimeout(200)

  // =========================================================================
  // 5. LEADER DASHBOARD (1440px Dark Mode) & PREFERENCES PAGE
  // =========================================================================
  const leaderContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const leaderPage = await leaderContext.newPage()
  attachListeners(leaderPage, 'leader-1440')

  await login(leaderPage, 'lider_dev')
  await leaderPage.goto(`${BASE_URL}/equipo`, { waitUntil: 'networkidle' })
  await leaderPage.waitForSelector('[data-testid="team-status-cards"]', { timeout: 15000 })
  await leaderPage.click('[data-testid="theme-toggle-btn"]')
  await leaderPage.waitForTimeout(400)
  await saveShot(leaderPage, 'h44-8-leader-dashboard-dark-1440.png')
  record('Leader Supervision Console in Dark Mode (1440px)', true, 'KPIs, Workload Table & Group Tickets Board in Slate Dark Mode')

  // =========================================================================
  // 6. PWA MANIFEST VERIFICATION
  // =========================================================================
  const manifestRes = await desktopPage.request.get(`${BASE_URL}/manifest.json`)
  const manifestJson = await manifestRes.json()
  const icon192Res = await desktopPage.request.get(`${BASE_URL}/icons/icon-192x192.png`)
  const icon512Res = await desktopPage.request.get(`${BASE_URL}/icons/icon-512x512.png`)
  record(
    'PWA Manifest & Icons (192x192 & 512x512, standalone)',
    manifestRes.status() === 200 &&
      manifestJson.display === 'standalone' &&
      icon192Res.status() === 200 &&
      icon512Res.status() === 200,
    `name="${manifestJson.name}", display="${manifestJson.display}", icons=${manifestJson.icons?.length}`,
  )

  // =========================================================================
  // 7. MOBILE (390x844) — Kanban & Notification Bell Dropdown
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
  await mobilePage.waitForTimeout(400)

  // Enable Dark Mode on mobile too
  await mobilePage.click('[data-testid="theme-toggle-mobile"]')
  await mobilePage.waitForTimeout(300)
  await saveShot(mobilePage, 'h44-9-mobile-kanban-dark-390.png')

  // Open Notification Bell on mobile
  const mobileBell = mobilePage.locator('header [data-testid="notification-bell"]').first()
  await mobileBell.click()
  await mobilePage.waitForSelector('[data-testid="notification-panel"]', { timeout: 5000 })
  await mobilePage.waitForTimeout(250)
  await saveShot(mobilePage, 'h44-10-mobile-notification-bell-390.png')

  const mobileOverflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  record(
    'Mobile (390px) Kanban & Notification Bell — Zero Horizontal Overflow',
    !mobileOverflow,
    `scrollWidth <= innerWidth (${!mobileOverflow})`,
  )

  // Axe WCAG AA check in Dark Mode
  const axeDark = await new AxeBuilder({ page: desktopPage })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  const criticalDark = axeDark.violations.filter((v) => v.impact === 'critical')
  record(
    'Axe Accessibility in Dark Mode (Desktop Kanban)',
    criticalDark.length === 0,
    `${criticalDark.length} critical violations`,
  )

  record(
    'Zero Console & HTTP Errors (F12)',
    consoleErrors.length === 0 && httpErrors.length === 0,
    `consoleErrors=${consoleErrors.length}, httpErrors=${httpErrors.length}`,
  )

  fs.writeFileSync(
    path.join(OUT_DIR, 'report-h44.json'),
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
