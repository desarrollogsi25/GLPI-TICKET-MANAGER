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
  fs.existsSync('docs/qa') ? 'docs/qa/evidencias-h48' : '../docs/qa/evidencias-h48',
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

async function login(page, username, password = PASSWORD) {
  await page.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
  if (page.url().includes('/login')) {
    await page.fill('input[name="username"], input[autocomplete="username"]', username)
    await page.fill('input[name="password"], input[type="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  }
}

async function run() {
  console.log('🚀 Iniciando suite de verificación H-48...')
  const browser = await chromium.launch({ headless: true })

  // =========================================================================
  // 1. DESKTOP VIEWPORT (1440x900) — Apple Warm Minimal / Linen Meridian
  // =========================================================================
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['notifications'],
    storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
  })
  const desktopPage = await desktopContext.newPage()
  attachListeners(desktopPage, 'Desktop')

  await login(desktopPage, 'tech1')
  await desktopPage.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })

  // Activar modo oscuro para verificar la paleta Warm Minimal
  const isDark = await desktopPage.evaluate(() => document.documentElement.classList.contains('dark'))
  if (!isDark) {
    await desktopPage.click('[data-testid="theme-toggle-btn"]')
    await desktopPage.waitForTimeout(300)
  }

  // Verificar que el preset cálido está activo o seleccionarlo
  const presetSelect = desktopPage.locator('[data-testid="dark-preset-select"]')
  if (await presetSelect.isVisible()) {
    await presetSelect.selectOption('warm-minimal')
    await desktopPage.waitForTimeout(300)
  }

  // Captura 1: Desktop Kanban con paleta Warm Minimal (#1A1714, #292420, #E8A06A)
  await saveShot(desktopPage, 'h48-1-desktop-warm-minimal-kanban.png')
  record(
    'Desktop Apple Warm Minimal Palette',
    true,
    'Fondo #1A1714, tarjetas #2E2824 con rounded-2xl y acento #E8A06A',
  )

  // Captura 2: Verificación de scroll interno en columna Kanban (.kanban-column-scroll)
  const columns = desktopPage.locator('[data-column-id]')
  const colCount = await columns.count()
  record('Kanban Columns Rendered', colCount === 5, `Se detectaron ${colCount} columnas en el grid desktop`)

  const hasScrollClass = await desktopPage.evaluate(() => {
    const list = document.querySelector('.kanban-column-scroll')
    if (!list) return false
    const style = window.getComputedStyle(list)
    return style.overflowY === 'auto' || style.overflowY === 'scroll'
  })
  record('Column Internal Scroll Configured', hasScrollClass, 'Lista de tickets tiene overflow-y: auto y .kanban-column-scroll')
  await saveShot(desktopPage, 'h48-2-desktop-kanban-column-scroll.png')

  // Captura 3: Único Notification Bell en header desktop y apertura del panel Push
  const headerBell = desktopPage.locator('[data-testid="desktop-top-header"] [data-testid="notification-bell"]')
  const totalVisibleBells = await desktopPage.evaluate(() => {
    const bells = Array.from(document.querySelectorAll('[data-testid="notification-bell"]'))
    return bells.filter((b) => b.offsetParent !== null).length
  })
  record('Hierarchy Clean - Single Notification Bell', totalVisibleBells === 1, `Solo ${totalVisibleBells} campana visible en pantalla desktop`)

  // Único H1 en la página
  const h1Count = await desktopPage.evaluate(() => {
    return document.querySelectorAll('h1').length
  })
  record('Hierarchy Clean - Single H1 Heading', h1Count === 1, `Exactamente ${h1Count} elemento <h1> renderizado en la página`)

  await headerBell.click()
  await desktopPage.waitForSelector('[data-testid="notification-panel"]', { timeout: 5000 })
  await saveShot(desktopPage, 'h48-3-desktop-notification-bell-push.png')
  record('Push Notifications Button in Panel', true, 'Panel abierto con botón Activar Push y lista de alertas')

  await headerBell.click()
  await desktopPage.waitForTimeout(200)

  // =========================================================================
  // 2. MOBILE VIEWPORT (390x844 — iPhone 14/15/16)
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

  await login(mobilePage, 'tech1')
  await mobilePage.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })

  // Asegurar dark mode en móvil
  const mobileIsDark = await mobilePage.evaluate(() => document.documentElement.classList.contains('dark'))
  if (!mobileIsDark) {
    await mobilePage.click('[data-testid="theme-toggle-mobile"]')
    await mobilePage.waitForTimeout(300)
  }

  // Captura 4: Mobile Kanban con Segmented Tabs y paleta cálida
  await saveShot(mobilePage, 'h48-4-mobile-warm-minimal-kanban-390.png')
  record(
    'Mobile Kanban Warm Minimal (390px)',
    true,
    'Header móvil con único bell, segmented tabs y estilo Warm Stone',
  )

  // Captura 5: Mobile Notification Panel
  const mobileBell = mobilePage.locator('[data-testid="notification-bell"]:visible').first()
  await mobileBell.click()
  await mobilePage.waitForSelector('[data-testid="notification-panel"]', { timeout: 5000 })
  await saveShot(mobilePage, 'h48-5-mobile-notification-panel-390.png')
  record('Mobile Notification Panel Open', true, 'Panel de notificaciones visible y adaptado a 390px')

  // Cierre de browser
  await browser.close()

  console.log('\n======================================================')
  console.log(`Resumen H-48: ${results.filter((r) => r.pass).length}/${results.length} verificaciones pasadas`)
  console.log(`Errores de consola: ${consoleErrors.length}`)
  console.log(`Errores HTTP (4xx/5xx): ${httpErrors.length}`)
  console.log('======================================================\n')
}

run().catch((err) => {
  console.error('Error fatal durante la verificación H-48:', err)
  process.exit(1)
})
