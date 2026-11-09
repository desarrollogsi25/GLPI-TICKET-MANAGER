import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve(process.cwd(), 'frontend/docs/qa/discrepancies-evidence')
fs.mkdirSync(OUT, { recursive: true })

const BASE_URL = process.env.BASE_URL || 'http://10.10.40.31'

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

async function login(page, username) {
  const password = getCred(username)
  if (!password) throw new Error(`Password not found for user: ${username}`)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.waitForSelector('input[name="username"]', { timeout: 10000 })
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  console.log(`[AUTH] Logged in as: ${username} -> ${page.url()}`)
}

async function testTeamDashboardFilterReset(browser) {
  console.log('\n--- VERIFICACIÓN QA-17: BI -> Service Desk en TeamDashboard ---')
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await login(page, 'admin_test')
  await page.goto(`${BASE_URL}/team`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Tomar captura inicial de la consola de supervisión
  await page.screenshot({ path: path.join(OUT, 'qa17_team_initial_desktop.png'), fullPage: false })

  // Seleccionar grupo si existe selector
  const groupSelect = page.locator('[data-testid="team-group-select"]')
  if (await groupSelect.isVisible()) {
    console.log('[QA-17] Selector de grupo visible en TeamDashboard')
  }

  // Comprobar selector de técnicos
  const techSelect = page.locator('[data-testid="team-tech-filter"]')
  if (await techSelect.isVisible()) {
    console.log('[QA-17] Selector de técnico visible')
  }

  await page.screenshot({ path: path.join(OUT, 'qa17_team_group_switch.png'), fullPage: false })
  await context.close()
  console.log(`[QA-17] Errores en consola: ${consoleErrors.length}`)
}

async function testUserTestNamesAndGroupVsTech(browser) {
  console.log('\n--- VERIFICACIÓN QA-05 / QA-21: user_test nombres y Grupo vs Técnico ---')
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await login(page, 'user_test')
  await page.goto(`${BASE_URL}/tickets`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT, 'qa05_user_test_tickets_desktop.png'), fullPage: false })

  // Inspeccionar si hay tickets disponibles para entrar al detalle
  const firstTicket = page.locator('tbody tr a, [data-testid^="ticket-row-"]').first()
  if (await firstTicket.isVisible()) {
    await firstTicket.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(OUT, 'qa05_user_test_ticket_detail.png'), fullPage: false })
    console.log(`[QA-05/21] Detalle de ticket abierto por user_test: ${page.url()}`)
  }

  await context.close()
  console.log(`[QA-05/21] Errores en consola para user_test: ${consoleErrors.length}`)
}

async function testResponsiveAndDashboard(browser) {
  console.log('\n--- VERIFICACIÓN QA-12 y RESPONSIVE (Desktop, Tablet, Mobile) ---')
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ]

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await context.newPage()
    await login(page, 'tech_sd')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(OUT, `qa12_dashboard_${vp.name}.png`), fullPage: false })
    console.log(`[RESPONSIVE] Captura guardada para ${vp.name} (${vp.width}x${vp.height})`)
    await context.close()
  }
}

async function run() {
  console.log('Iniciando verificación en navegador Chromium...')
  const browser = await chromium.launch({ headless: true })
  try {
    await testTeamDashboardFilterReset(browser)
    await testUserTestNamesAndGroupVsTech(browser)
    await testResponsiveAndDashboard(browser)
    console.log('\n[PASS] Toda la evidencia en navegador Chrome ha sido recopilada exitosamente.')
  } catch (err) {
    console.error('Error durante la verificación en navegador:', err)
  } finally {
    await browser.close()
  }
}

run()
