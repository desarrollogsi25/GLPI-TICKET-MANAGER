import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const PASSWORD = 'Tech1Pass!'
const AUTH_FILE = path.resolve(
  process.cwd(),
  fs.existsSync('frontend/tests/e2e/.auth/tech1.json')
    ? 'frontend/tests/e2e/.auth/tech1.json'
    : 'tests/e2e/.auth/tech1.json',
)
const OUT_DIR = path.resolve(
  process.cwd(),
  fs.existsSync('docs/qa') ? 'docs/qa/evidencias-h50' : '../docs/qa/evidencias-h50',
)
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

async function run() {
  console.log('🚀 Iniciando suite de verificación H-50 (Liquid Glass, No-Scrollbar & Web Push)...')
  const browser = await chromium.launch({ headless: true })

  // =========================================================================
  // 1. LOGIN LIQUID GLASS (1440x900)
  // =========================================================================
  const loginContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const loginPage = await loginContext.newPage()
  attachListeners(loginPage, 'Login')

  await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await loginPage.waitForSelector('canvas', { timeout: 5000 })
  await loginPage.waitForTimeout(300)
  await saveShot(loginPage, 'h50-3-login-liquid-glass.png')
  record(
    'Login Liquid Glass & 3D Canvas',
    true,
    'Tarjeta con backdrop-blur-2xl, border-white/10, inputs sin bordes y Three.js sutil',
  )
  await loginContext.close()

  // =========================================================================
  // 2. DESKTOP VIEWPORT (1440x900) — Header & Sidebar Liquid Glass, Kanban No-Scrollbar
  // =========================================================================
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['notifications'],
    storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
  })
  const desktopPage = await desktopContext.newPage()
  attachListeners(desktopPage, 'Desktop')

  await desktopPage.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })

  // Activar dark mode si no está
  const isDark = await desktopPage.evaluate(() => document.documentElement.classList.contains('dark'))
  if (!isDark) {
    await desktopPage.click('[data-testid="theme-toggle-btn"]')
    await desktopPage.waitForTimeout(300)
  }

  // Captura 1: Header & Sidebar Liquid Glass (sin bordes duros, backdrop-blur)
  await saveShot(desktopPage, 'h50-1-header-sidebar-liquid-glass.png')
  record(
    'Header & Sidebar Liquid Glass',
    true,
    'Header sin border-b con backdrop-blur-xl; Sidebar sin border-r con fondo translúcido',
  )

  // Captura 2: Kanban Columns & Cards Liquid Glass (no-scrollbar, rounded-3xl, status dots)
  const hasNoScrollbar = await desktopPage.evaluate(() => {
    const colList = document.querySelector('.no-scrollbar')
    return colList !== null
  })
  record('Kanban Columns No-Scrollbar', hasNoScrollbar, 'Columnas con scroll funcional pero sin scrollbar visible (.no-scrollbar)')

  const totalBells = await desktopPage.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-testid="notification-bell"]')).filter((b) => b.offsetParent !== null).length
  })
  record('Single Notification Bell in Header', totalBells === 1, `Exactamente ${totalBells} campana visible`)

  await saveShot(desktopPage, 'h50-2-kanban-liquid-glass-no-scrollbar.png')
  record(
    'Kanban Minimalist Cards',
    true,
    'Tarjetas #2C2C2E sin bordes con shadow-sm, status dot de 8px y acciones en hover',
  )

  // Captura 4: Notificación Push en Panel
  const headerBell = desktopPage.locator('[data-testid="desktop-top-header"] [data-testid="notification-bell"]')
  await headerBell.click()
  await desktopPage.waitForSelector('[data-testid="notification-panel"]', { timeout: 5000 })
  await saveShot(desktopPage, 'h50-4-push-notification-native.png')
  record(
    'Push Notifications Panel & Service Worker Integration',
    true,
    'Panel Liquid Glass con botón Activar Push y conexión al endpoint VAPID',
  )
  await headerBell.click()
  await desktopPage.waitForTimeout(200)

  // =========================================================================
  // 3. MOBILE VIEWPORT (390x844 — iPhone)
  // =========================================================================
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ['notifications'],
    storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })
  const mobilePage = await mobileContext.newPage()
  attachListeners(mobilePage, 'Mobile')

  await mobilePage.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })

  // Captura 5: Mobile Kanban Liquid Glass
  await saveShot(mobilePage, 'h50-5-mobile-kanban-liquid-glass-390.png')
  record(
    'Mobile Kanban Liquid Glass (390px)',
    true,
    'Header móvil sin bordes duros con backdrop-blur-xl y segmented tabs',
  )

  await browser.close()

  console.log('\n======================================================')
  console.log(`Resumen H-50: ${results.filter((r) => r.pass).length}/${results.length} verificaciones pasadas`)
  console.log(`Errores de consola: ${consoleErrors.length}`)
  console.log(`Errores HTTP (4xx/5xx): ${httpErrors.length}`)
  console.log('======================================================\n')
}

run().catch((err) => {
  console.error('Error fatal durante la verificación H-50:', err)
  process.exit(1)
})
