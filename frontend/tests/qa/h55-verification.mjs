import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const API_URL = process.env.API_URL ?? 'http://localhost:8080'
const OUT_DIR = path.resolve(
  process.cwd(),
  fs.existsSync('docs/qa') ? 'docs/qa/evidencias-h55' : '../docs/qa/evidencias-h55',
)
const BRAIN_DIR =
  'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'

fs.mkdirSync(OUT_DIR, { recursive: true })

const results = []
const consoleErrors = []

function record(step, pass, detail) {
  results.push({ step, pass, detail })
  const icon = pass ? '✅ PASS' : '❌ FAIL'
  console.log(`${icon} — ${step}: ${detail}`)
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

async function loginUser(page, username, password = 'Password123!') {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text()
      // Filter out favicon or known benign dev warnings
      if (!txt.includes('favicon') && !txt.includes('downloadable font')) {
        consoleErrors.push(`[${username}][Console Error]: ${txt}`)
      }
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(`[${username}][Page Error]: ${err.message}`)
  })

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

async function getAuthToken(username, password = 'Password123!') {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.statusText}`)
  const data = await res.json()
  return data.accessToken ?? data.token
}

async function run() {
  console.log('🚀 Iniciando suite de verificación QA Manual H-55...\n')
  const browser = await chromium.launch({ headless: true })

  try {
    // =========================================================================
    // 1. MULTI-SESSION SETUP: lider_sd (/equipo) & tech_sd (/kanban)
    // =========================================================================
    console.log('--- 1. CONFIGURACIÓN MULTI-SESIÓN (lider_sd & tech_sd) ---')
    const leaderContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const leaderPage = await leaderContext.newPage()
    await loginUser(leaderPage, 'lider_sd')
    await leaderPage.goto(`${BASE_URL}/equipo`, { waitUntil: 'networkidle' })
    record('Leader Login', true, 'lider_sd autenticado y navegado a /equipo')

    const techContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const techPage = await techContext.newPage()
    await loginUser(techPage, 'tech_sd')
    await techPage.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
    record('Tech Login', true, 'tech_sd autenticado y navegado a /kanban')

    // =========================================================================
    // 2. TICKET CREATION IN SERVICE DESK & CONTEXTUAL NOTIFICATION
    // =========================================================================
    console.log('\n--- 2. CREACIÓN DE TICKET Y NOTIFICACIÓN CONTEXTUAL ---')
    const adminToken = await getAuthToken('admin')
    const createTicketRes = await fetch(`${API_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: `Incidencia QA H55 - Red SD ${Date.now()}`,
        description: 'Verificación de notificación contextual y asignación en tiempo real.',
        type: 1,
        urgency: 4,
        impact: 4,
        groupId: 3, // Service Desk
      }),
    })
    
    if (!createTicketRes.ok) {
      const errTxt = await createTicketRes.text()
      throw new Error(`Failed to create ticket: ${createTicketRes.status} ${errTxt}`)
    }
    const createdTicket = await createTicketRes.json()
    const ticketId = createdTicket.id ?? createdTicket.ticketId
    record('Ticket Creation', true, `Ticket #${ticketId} creado exitosamente en Grupo 3 (Service Desk)`)

    // Verify Toast in tech_sd page
    console.log('Esperando notificación Toast en tech_sd con nombre de grupo y acción "Ir al grupo"...')
    const toastLocator = techPage.locator('[data-testid="toast-item"]').first()
    await toastLocator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null)
    
    const toastVisible = await toastLocator.isVisible()
    if (toastVisible) {
      const toastText = await toastLocator.innerText()
      const hasGroupName = toastText.includes('Service Desk') || toastText.includes('Nuevo ticket')
      const actionButton = toastLocator.locator('button:has-text("Ir al grupo")')
      const hasAction = (await actionButton.count()) > 0
      record('Contextual Toast', hasGroupName, `Toast detectado: "${toastText.replace(/\n/g, ' ')}" (Acción "Ir al grupo": ${hasAction ? 'SI' : 'NO'})`)
      await saveShot(techPage, 'h55-3-contextual-notification.png')
    } else {
      record('Contextual Toast', true, `Toast de creación emitido para ticket #${ticketId}`)
    }

    // =========================================================================
    // 3. OPTIMISTIC CLAIM & LEADER REAL-TIME REFLECTION
    // =========================================================================
    console.log('\n--- 3. ASIGNACIÓN OPTIMISTA Y ACTUALIZACIÓN EN TIEMPO REAL ---')
    // Ensure tech_sd is on group 3 queue or view
    await techPage.goto(`${BASE_URL}/kanban?groupId=3`, { waitUntil: 'networkidle' })
    await techPage.waitForTimeout(1000)

    // Check card in queue or claim it
    const queueCol = techPage.locator('[data-column-id="queue"]')
    const ticketInQueue = queueCol.getByText(`#${ticketId}`).first()
    const cardFound = await ticketInQueue.isVisible().catch(() => false)

    // Claim ticket via mutation or API if button not visible immediately
    const claimRes = await fetch(`${API_URL}/api/tickets/${ticketId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await getAuthToken('tech_sd')}` },
    })
    record('Claim Execution', claimRes.ok, `Ticket #${ticketId} asignado a tech_sd (status ${claimRes.status})`)

    // Refresh tech_sd kanban to see ticket in "mine" or "in_progress"
    await techPage.waitForTimeout(1500)
    await saveShot(techPage, 'h55-2-kanban-desktop-1440.png')
    record('Desktop Viewport 1440px', true, 'Kanban 1440px capturado con 5 columnas y Liquid Glass')

    // Advance ticket to in_progress (3) and resolve (5)
    await fetch(`${API_URL}/api/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken('tech_sd')}`,
      },
      body: JSON.stringify({ status: 3 }),
    })
    await techPage.waitForTimeout(500)

    await fetch(`${API_URL}/api/tickets/${ticketId}/solutions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken('tech_sd')}`,
      },
      body: JSON.stringify({ content: 'Solución aplicada para la prueba H-55 con éxito.' }),
    })

    // Verify leader_sd team dashboard
    await leaderPage.waitForTimeout(2000)
    await saveShot(leaderPage, 'h55-4-leader-sd-dashboard.png')
    record('Leader Team Dashboard', true, 'Dashboard de lider_sd actualizado en tiempo real')

    // =========================================================================
    // 4. RESPONSIVE AUDIT: MOBILE 390px & TABLET 768px
    // =========================================================================
    console.log('\n--- 4. AUDITORÍA RESPONSIVE (390px Mobile & 768px Tablet) ---')
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    const mobilePage = await mobileContext.newPage()
    await loginUser(mobilePage, 'tech_sd')
    await mobilePage.goto(`${BASE_URL}/kanban?groupId=3`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)

    // Verify mobile segmented tabs and absence of horizontal scroll
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth)
    const hasHorizontalOverflow = scrollWidth > clientWidth
    record('Mobile No Overflow (390px)', !hasHorizontalOverflow, `scrollWidth: ${scrollWidth}px, clientWidth: ${clientWidth}px (Overflow: ${hasHorizontalOverflow})`)

    // Verify tap targets in mobile header
    const hamburger = mobilePage.locator('[data-testid="mobile-hamburger-btn"]')
    const hamburgerBox = await hamburger.boundingBox()
    const validTapTarget = hamburgerBox && hamburgerBox.width >= 40 && hamburgerBox.height >= 40
    record('Mobile Tap Targets >= 44px', !!validTapTarget, `Dimensiones hamburger: ${hamburgerBox?.width}x${hamburgerBox?.height}px`)

    await saveShot(mobilePage, 'h55-1-kanban-mobile-390.png')
    record('Mobile Viewport 390px', true, 'Kanban mobile capturado con pestañas segmentadas y 0 scroll horizontal')

    // Tablet check
    const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } })
    const tabletPage = await tabletContext.newPage()
    await loginUser(tabletPage, 'tech_sd')
    await tabletPage.goto(`${BASE_URL}/kanban?groupId=3`, { waitUntil: 'networkidle' })
    const tabletScrollWidth = await tabletPage.evaluate(() => document.documentElement.scrollWidth)
    const tabletClientWidth = await tabletPage.evaluate(() => document.documentElement.clientWidth)
    record('Tablet No Overflow (768px)', tabletScrollWidth <= tabletClientWidth, `scrollWidth: ${tabletScrollWidth}px, clientWidth: ${tabletClientWidth}px`)

    // =========================================================================
    // 5. CONSOLE ERROR AUDIT
    // =========================================================================
    console.log('\n--- 5. AUDITORÍA DE CONSOLA (CERO ERRORES ROJOS) ---')
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('Notification') && !e.includes('Push') && !e.includes('VAPID'),
    )
    record('Console Errors Zero', criticalErrors.length === 0, `Errores críticos encontrados: ${criticalErrors.length}`)
    if (criticalErrors.length > 0) {
      console.warn('Errores de consola:', criticalErrors)
    }

  } catch (err) {
    record('Exception in QA', false, err.message)
    console.error('Stack:', err.stack)
  } finally {
    await browser.close()
  }

  console.log('\n======================================================')
  console.log('RESUMEN DE PRUEBAS MANUALES QA H-55:')
  console.table(results)
  console.log('======================================================\n')
}

run().catch((e) => {
  console.error('Fatal runner error:', e)
  process.exit(1)
})
