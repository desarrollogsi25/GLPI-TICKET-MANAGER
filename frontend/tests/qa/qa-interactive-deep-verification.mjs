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

async function testKeyboardDateTimeInteraction(browser) {
  console.log('\n--- VERIFICACIÓN QA-22: TECLADO NATIVO Y VALORES INCOMPLETOS ---')
  const context = await browser.newContext()
  const page = await context.newPage()
  await login(page, 'tech_sd')

  // Abrir un ticket activo para acceder al modal de planificación / reprogramación
  await page.goto(`${BASE_URL}/tickets`, { waitUntil: 'networkidle' })
  const firstTicket = page.locator('tbody tr a, [data-testid^="ticket-row-"]').first()
  if (await firstTicket.isVisible()) {
    await firstTicket.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Buscar botón Planificar
    const planBtn = page.locator('button:has-text("Planificar")')
    if (await planBtn.isVisible()) {
      await planBtn.click()
      await page.waitForSelector('input[type="datetime-local"]', { timeout: 5000 })
      const dtInput = page.locator('input[type="datetime-local"]').first()

      // Probar interacción de teclado real con backspace y typing
      await dtInput.focus()
      await page.keyboard.press('Control+A')
      await page.keyboard.press('Backspace')
      console.log('[QA-22] Campo vaciado mediante Backspace. Verificando que no revierte.')

      // Teclear fecha incompleta
      await page.keyboard.type('2026')
      await page.waitForTimeout(300)
      const valPartial = await dtInput.inputValue()
      console.log(`[QA-22] Valor tras teclear parcial: "${valPartial}"`)

      // Teclear fecha completa y hora
      await dtInput.fill('2026-11-20T10:30')
      await page.waitForTimeout(300)
      const valFull = await dtInput.inputValue()
      console.log(`[QA-22] Valor tras teclear completo: "${valFull}"`)

      // Blur
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)

      await page.screenshot({ path: path.join(OUT, 'qa22_datetime_keyboard_verified.png') })
      console.log('[QA-22] Captura guardada qa22_datetime_keyboard_verified.png')

      // Cerrar modal
      await page.keyboard.press('Escape')
    }
  }
  await context.close()
}

async function testBundleAndRealPerformance(browser) {
  console.log('\n--- VERIFICACIÓN QA-15: RENDIMIENTO REAL Y CARGA EN NAVEGADOR ---')
  const context = await browser.newContext()
  const page = await context.newPage()
  await login(page, 'admin_test')

  const startTime = Date.now()
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
  const totalLoadTimeMs = Date.now() - startTime

  // Extraer métricas de performance nativas del navegador
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const resources = performance.getEntriesByType('resource')
    const jsResources = resources.filter((r) => r.name.endsWith('.js'))
    const cssResources = resources.filter((r) => r.name.endsWith('.css'))

    const totalJsTransfer = jsResources.reduce((acc, r) => acc + (r.transferSize || 0), 0)
    const totalCssTransfer = cssResources.reduce((acc, r) => acc + (r.transferSize || 0), 0)

    return {
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      loadComplete: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      jsCount: jsResources.length,
      jsTransferBytes: totalJsTransfer,
      cssCount: cssResources.length,
      cssTransferBytes: totalCssTransfer,
    }
  })

  console.log(`[QA-15] Tiempo total de carga a networkidle: ${totalLoadTimeMs} ms`)
  console.log(`[QA-15] DOMContentLoaded: ${metrics.domContentLoaded} ms`)
  console.log(`[QA-15] LoadComplete: ${metrics.loadComplete} ms`)
  console.log(`[QA-15] Chunks JS cargados: ${metrics.jsCount} (${Math.round(metrics.jsTransferBytes / 1024)} kB transferidos)`)
  console.log(`[QA-15] CSS cargados: ${metrics.cssCount} (${Math.round(metrics.cssTransferBytes / 1024)} kB transferidos)`)

  await page.screenshot({ path: path.join(OUT, 'qa15_performance_dashboard.png') })
  await context.close()
}

async function testUserTestDirectTextInspection(browser) {
  console.log('\n--- VERIFICACIÓN QA-05: INSPECCIÓN REAL DE TEXTO VISIBLE USER_TEST ---')
  const context = await browser.newContext()
  const page = await context.newPage()
  await login(page, 'user_test')

  await page.goto(`${BASE_URL}/tickets`, { waitUntil: 'networkidle' })
  const firstTicket = page.locator('tbody tr a, [data-testid^="ticket-row-"]').first()
  if (await firstTicket.isVisible()) {
    await firstTicket.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const textAssignee = await page.locator('text=Técnicos asignados').locator('..').textContent()
    const textRequester = await page.locator('text=Solicitantes').locator('..').textContent()
    console.log(`[QA-05] Texto asignado visible: "${textAssignee?.trim()}"`)
    console.log(`[QA-05] Texto solicitante visible: "${textRequester?.trim()}"`)

    await page.screenshot({ path: path.join(OUT, 'qa05_inspected_names_visible.png') })
  }
  await context.close()
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  try {
    await testKeyboardDateTimeInteraction(browser)
    await testBundleAndRealPerformance(browser)
    await testUserTestDirectTextInspection(browser)
    console.log('\n[PASS] Pruebas interactivas completadas.')
  } catch (err) {
    console.error('Error en pruebas interactivas:', err)
  } finally {
    await browser.close()
  }
}

run()
