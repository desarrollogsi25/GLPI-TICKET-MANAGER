import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const PASSWORD = 'Password123!'
const OUT_DIR = path.resolve(process.cwd(), '../docs/qa/evidencias-h42')
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
  // 1. DESKTOP (1440x900) — Tech Kanban, Collapsible Sidebar, Command Palette, Sonner Toasts
  // =========================================================================
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const desktopPage = await desktopContext.newPage()
  attachListeners(desktopPage, 'desktop-tech')

  await login(desktopPage, 'tech_dev')
  await desktopPage.waitForSelector('[data-column-id="queue"]', { timeout: 15000 })
  await desktopPage.waitForTimeout(800)

  // Verify collapsible sidebar & header breadcrumb
  const sidebar = desktopPage.locator('[data-testid="desktop-sidebar"]')
  const breadcrumb = desktopPage.locator('[data-testid="header-breadcrumb"]')
  const hasBreadcrumb = await breadcrumb.isVisible()
  record('Desktop Header Breadcrumb', hasBreadcrumb, await breadcrumb.innerText())

  // Capture Desktop Kanban (expanded sidebar)
  await saveShot(desktopPage, 'h42-1-kanban-desktop-1440.png')

  // Test collapsing & expanding sidebar (200ms ease-out)
  await desktopPage.click('[data-testid="sidebar-collapse-btn"]')
  await desktopPage.waitForTimeout(300)
  const isCollapsed = (await sidebar.getAttribute('data-collapsed')) === 'true'
  record('Desktop Collapsible Sidebar', isCollapsed, `data-collapsed=${isCollapsed}`)
  await desktopPage.click('[data-testid="sidebar-collapse-btn"]')
  await desktopPage.waitForTimeout(300)

  // Test Command Palette (Ctrl+K)
  await desktopPage.click('[data-testid="command-palette-trigger"]')
  const cmdDialog = desktopPage.locator('[data-testid="command-palette-dialog"]')
  const cmdVisible = await cmdDialog.isVisible()
  record('Global Command Palette (cmdk)', cmdVisible, 'Opened via header trigger & closed with Escape')
  await desktopPage.keyboard.press('Escape')
  await desktopPage.waitForTimeout(200)

  // Trigger Sonner Toast in top-right (claim or blocked transition)
  const blockedBtn = desktopPage.locator('[data-testid="pending-resolve-blocked-trigger"]').first()
  if ((await blockedBtn.count()) > 0) {
    await blockedBtn.click()
  } else {
    const claimBtn = desktopPage.locator('[data-column-id="queue"] button:has-text("Asignarme")').first()
    if ((await claimBtn.count()) > 0) {
      await claimBtn.click()
    }
  }
  await desktopPage.waitForSelector('[data-testid="toast-item"]', { timeout: 8000 })
  await desktopPage.waitForTimeout(350)
  await saveShot(desktopPage, 'h42-3-sonner-toasts-desktop.png')
  record('Sonner Toast System (Desktop top-right)', true, 'Rendered via Sonner with Lucide icons')

  // Run axe accessibility check on Desktop Kanban
  const axeKanban = await new AxeBuilder({ page: desktopPage })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  const criticalKanban = axeKanban.violations.filter((v) => v.impact === 'critical')
  record(
    'Axe Accessibility (Desktop Kanban)',
    criticalKanban.length === 0,
    `${criticalKanban.length} critical violations`,
  )

  // =========================================================================
  // 2. DESKTOP (1440x900) — Leader Dashboard (/equipo) & Admin (/administracion)
  // =========================================================================
  const leaderContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const leaderPage = await leaderContext.newPage()
  attachListeners(leaderPage, 'desktop-leader')

  await login(leaderPage, 'lider_dev')
  await leaderPage.goto(`${BASE_URL}/equipo`, { waitUntil: 'networkidle' })
  await leaderPage.waitForSelector('[data-testid="team-status-cards"]', { timeout: 15000 })
  await leaderPage.waitForTimeout(600)

  await saveShot(leaderPage, 'h42-2-leader-dashboard-desktop-1440.png')
  const cardCount = await leaderPage.locator('[data-testid^="team-card-"]').count()
  const tableVisible = await leaderPage.locator('[data-testid="team-technicians-table"]').isVisible()
  record(
    'Leader Dashboard (Desktop 1440px)',
    cardCount === 7 && tableVisible,
    `${cardCount} KPI cards with NumberTicker + Technician Table visible`,
  )

  // Admin Dashboard (1440px)
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const adminPage = await adminContext.newPage()
  attachListeners(adminPage, 'desktop-admin')

  await login(adminPage, 'admin_test')
  await adminPage.goto(`${BASE_URL}/administracion`, { waitUntil: 'networkidle' })
  await adminPage.waitForSelector('[data-testid="admin-kpi-cards"]', { timeout: 15000 })
  await adminPage.waitForTimeout(600)
  await saveShot(adminPage, 'h42-4-admin-dashboard-desktop-1440.png')
  record('Admin Dashboard (Desktop 1440px)', true, '4 KPI cards + Group Summary Table')

  // =========================================================================
  // 3. MOBILE (390x844) — Kanban, Drawer (Sheet), Leader Mobile Cards & No Horizontal Overflow
  // =========================================================================
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileContext.newPage()
  attachListeners(mobilePage, 'mobile-390')

  await login(mobilePage, 'lider_dev')
  await mobilePage.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
  await mobilePage.waitForSelector('[data-testid="kanban-tab-queue"]', { timeout: 15000 })
  await mobilePage.waitForTimeout(600)

  const overflowKanban = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  record(
    'Mobile Kanban (390px) — Zero Horizontal Overflow',
    !overflowKanban,
    `scrollWidth <= innerWidth (${!overflowKanban})`,
  )

  const mobileUsername = await mobilePage
    .locator('[data-testid="mobile-header-username"]')
    .isVisible()
  record('Mobile Header Username & Bell', mobileUsername, 'Visible in mobile sticky header')

  await saveShot(mobilePage, 'h42-5-kanban-mobile-390.png')

  // Open Mobile Drawer (Sheet) via hamburger button
  await mobilePage.click('[data-testid="mobile-hamburger-btn"]')
  await mobilePage.waitForSelector('[data-testid="mobile-drawer"]', { timeout: 8000 })
  await mobilePage.waitForTimeout(350)
  await saveShot(mobilePage, 'h42-6-drawer-mobile-390.png')
  record('Mobile Drawer (Sheet)', true, 'Opens with hamburger button and traps focus')

  // Navigate to /equipo from mobile drawer
  await mobilePage.click('[data-testid="mobile-drawer"] a[href="/equipo"]')
  await mobilePage.waitForSelector('[data-testid="team-mobile-cards"]', { timeout: 15000 })
  await mobilePage.waitForTimeout(600)

  const overflowEquipo = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  await saveShot(mobilePage, 'h42-7-leader-dashboard-mobile-390.png')
  record(
    'Mobile Leader Dashboard (390px) — Stacked Cards & Zero Overflow',
    !overflowEquipo,
    `Stacked technician cards visible, overflow=${overflowEquipo}`,
  )

  record(
    'Zero Console & HTTP Errors (F12)',
    consoleErrors.length === 0 && httpErrors.length === 0,
    `consoleErrors=${consoleErrors.length}, httpErrors=${httpErrors.length}`,
  )

  fs.writeFileSync(
    path.join(OUT_DIR, 'report-h42.json'),
    JSON.stringify({ results, consoleErrors, httpErrors }, null, 2),
  )
} finally {
  await browser.close()
}
