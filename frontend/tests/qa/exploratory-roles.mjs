import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCred } from './credentials.mjs'

const BASE = process.env.QA_BASE_URL || 'http://localhost:5173'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(HERE, '../../../docs/qa/evidence-20261105')
fs.mkdirSync(OUT, { recursive: true })

const USERS = [
  { user: 'admin_test', role: 'admin', expectLanding: '/kanban', dashboard: 'Dashboard global' },
  { user: 'lider_dev', role: 'supervisor', expectLanding: '/kanban', dashboard: 'Dashboard de supervisión' },
  { user: 'lider_bi', role: 'supervisor', expectLanding: '/kanban', dashboard: 'Dashboard de supervisión' },
  { user: 'lider_sd', role: 'supervisor', expectLanding: '/kanban', dashboard: 'Dashboard de supervisión' },
  { user: 'tech_dev', role: 'technician', expectLanding: '/kanban', dashboard: 'Dashboard del Agente' },
  { user: 'tech_bi', role: 'technician', expectLanding: '/kanban', dashboard: 'Dashboard del Agente' },
  { user: 'tech_sd', role: 'technician', expectLanding: '/kanban', dashboard: 'Dashboard del Agente' },
  { user: 'user_test', role: 'solicitante', expectLanding: '/tickets', dashboard: null },
]

const results = []
const failures = []

function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail })
  if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
}

async function login(page, user, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('input[name="username"], input[type="text"]', user)
  await page.fill('input[name="password"], input[type="password"]', password)
  // Enter must submit, not just the button.
  await page.press('input[name="password"], input[type="password"]', 'Enter')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })
}

async function runUser(browser, spec, viewport, suffix) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push(String(e)))

  const password = getCred(spec.user)
  if (!password) throw new Error(`Falta credencial CRED_${spec.user.toUpperCase()} en .env.local`)

  await login(page, spec.user, password)
  await page.waitForLoadState('networkidle')
  await page.locator('h1').first().waitFor({ timeout: 15000 })
  const landed = new URL(page.url()).pathname
  check(`[${suffix}] ${spec.user} lands on ${spec.expectLanding}`, landed.startsWith(spec.expectLanding), landed)

  const bodyText = await page.locator('body').innerText()
  if (spec.role === 'solicitante') {
    check(`[${suffix}] requester sees "Mis tickets"`, bodyText.includes('Mis tickets'))
    check(`[${suffix}] requester has no Kanban nav`, !bodyText.includes('Kanban') && !bodyText.includes('Cola de'), bodyText.slice(0, 120))
    check(`[${suffix}] requester has no ticket creation UI`, !/Nuevo ticket|Crear ticket|Nueva solicitud/i.test(bodyText))
    check(`[${suffix}] requester list title`, /Mis tickets/i.test(await page.locator('h1').first().innerText().catch(() => '')))
  } else {
    check(`[${suffix}] staff sees Kanban nav`, bodyText.includes('Kanban'))
  }

  if (viewport.width < 768) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    check(`[${suffix}] no horizontal overflow`, overflow <= 1, `overflow=${overflow}`)
    const tabs = await page.locator('[role="tablist"] a, [role="tablist"] button, nav a').allInnerTexts().catch(() => [])
    const joined = tabs.join(' ')
    if (spec.role === 'solicitante') {
      check(`[${suffix}] requester mobile tabs`, /Mis tickets|Ayuda|Ajustes|Más/i.test(joined), joined)
    } else {
      check(`[${suffix}] staff mobile tabs`, /Kanban/.test(joined) && /Cola/.test(joined), joined)
    }
  }

  // Notification bell opens and closes with a click.
  const bells = page.locator('[data-testid="notification-bell"], [data-testid="notification-bell-mobile"]')
  let bell = null
  for (let i = 0; i < (await bells.count()); i += 1) {
    if (await bells.nth(i).isVisible()) { bell = bells.nth(i); break }
  }
  if (bell) {
    await bell.click()
    const panel = page.locator('[data-testid="notification-panel"]:visible')
    await panel.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    const opened = await panel.isVisible().catch(() => false)
    check(`[${suffix}] notification panel opens`, opened)
    if (opened) {
      await page.keyboard.press('Escape')
      await panel.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
      check(`[${suffix}] notification panel closes with Escape`, !(await panel.isVisible().catch(() => false)))
    }
  }

  if (spec.dashboard) {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    const h1 = await page.locator('h1').first().innerText()
    check(`[${suffix}] ${spec.user} dashboard title`, h1.includes(spec.dashboard), h1)
    if (spec.role === 'admin') {
      const select = page.getByTestId('dashboard-group-select')
      check(`[${suffix}] admin sees group selector`, await select.isVisible().catch(() => false))
    }
  }

  check(`[${suffix}] ${spec.user} has no console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))
  const toasts = await page.locator('[data-testid="toast-item"]').allInnerTexts().catch(() => [])
  check(
    `[${suffix}] ${spec.user} has no false network-error toast`,
    !toasts.some((text) => text.includes('No se pudo conectar al servidor')),
    toasts.join(' | '),
  )

  if (spec.user === 'tech_bi') {
    const status = await page.evaluate(async () => {
      const raw = localStorage.getItem('glpi-ticket-manager.auth')
      const token = raw ? JSON.parse(raw)?.state?.token : null
      const res = await fetch('/api/tickets/by-group?groupId=1', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      return res.status
    })
    check(`[${suffix}] tech_bi cannot read Desarrollo queue (403)`, status === 403, `status=${status}`)
  }

  if (spec.role === 'supervisor') {
    const before = page.url()
    await page.goto(`${BASE}/equipo`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    const body = await page.locator('body').innerText()
    check(`[${suffix}] ${spec.user} can open /equipo`, !body.includes('No autorizado') && page.url().includes('/equipo'), page.url())
    await page.goto(before).catch(() => {})
  }

  await page.screenshot({ path: path.join(OUT, `qa-${spec.user}-${suffix}.png`), fullPage: false })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  for (const spec of USERS) {
    await runUser(browser, spec, { width: 1440, height: 900 }, 'desktop')
    await runUser(browser, spec, { width: 390, height: 844 }, 'mobile')
  }
} finally {
  await browser.close()
}

const report = { base: BASE, ranAt: new Date().toISOString(), total: results.length, failed: failures.length, failures, results }
fs.writeFileSync(path.join(OUT, 'exploratory-qa-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ total: report.total, failed: report.failed, failures }, null, 2))
process.exit(failures.length ? 1 : 0)
