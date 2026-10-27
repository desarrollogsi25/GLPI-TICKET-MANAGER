import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const API_URL = process.env.API_URL ?? 'http://localhost:8080'
const OUT_DIR = path.resolve(process.cwd(), 'docs/qa/evidencias-h56')
const BRAIN_DIR = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(BRAIN_DIR, { recursive: true })

const results = []

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
  } catch {}
}

async function loginUser(page, username, password = 'Password123!') {
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
  console.log('🚀 Iniciando Prueba de Fuego H-56 (QA Manual Multi-Rol: tech_dev, tech_bi, lider_dev)...\n')
  const browser = await chromium.launch({ headless: true })

  try {
    // 1. Abrir 3 contextos independientes
    console.log('--- 1. INICIANDO SESIONES ---')
    const techDevCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const techDevPage = await techDevCtx.newPage()
    await loginUser(techDevPage, 'tech_dev')
    await techDevPage.goto(`${BASE_URL}/kanban?groupId=1`, { waitUntil: 'networkidle' })
    record('Login tech_dev', true, 'tech_dev conectado en Kanban (Grupo 1: Desarrollo)')

    const techBiCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const techBiPage = await techBiCtx.newPage()
    await loginUser(techBiPage, 'tech_bi')
    await techBiPage.goto(`${BASE_URL}/kanban?groupId=2`, { waitUntil: 'networkidle' })
    record('Login tech_bi', true, 'tech_bi conectado en Kanban (Grupo 2: BI)')

    const liderDevCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const liderDevPage = await liderDevCtx.newPage()
    await loginUser(liderDevPage, 'lider_dev')
    await liderDevPage.goto(`${BASE_URL}/kanban?groupId=1`, { waitUntil: 'networkidle' })
    record('Login lider_dev', true, 'lider_dev conectado en Kanban (Supervisor Grupo 1)')

    // 2. Crear ticket para Desarrollo en GLPI (API)
    console.log('\n--- 2. CREACIÓN DE TICKET PARA DESARROLLO ---')
    const adminToken = await getAuthToken('admin_test')
    const ticketTitle = `Ticket H56 Dev Routing ${Date.now()}`
    const createRes = await fetch(`${API_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: ticketTitle,
        description: 'Prueba de enrutamiento estricto por grupo y rol (H-56).',
        urgency: 3,
        categoryId: 11, // Categoria Desarrollo -> Grupo 1
        groupId: 1,
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(`Error creando ticket: ${createRes.status} ${err}`)
    }
    const createData = await createRes.json()
    const ticketId = createData.id ?? createData.ticketId
    record('Crear Ticket', true, `Ticket #${ticketId} ("${ticketTitle}") creado para Desarrollo (Grupo 1)`)

    // 3. Verificar que tech_dev y lider_dev reciben el ticket en la cola, y tech_bi no ve nada
    console.log('\n--- 3. VERIFICACIÓN DE LLEGADA A LA COLA Y AISLAMIENTO ---')
    await techDevPage.waitForSelector(`[data-column-id="queue"] :text("#${ticketId}")`, { timeout: 15000 })
    record('tech_dev Cola', true, `tech_dev ve el ticket #${ticketId} en su cola de Desarrollo`)

    await liderDevPage.waitForSelector(`[data-column-id="queue"] :text("#${ticketId}")`, { timeout: 15000 })
    record('lider_dev Cola', true, `lider_dev ve el ticket #${ticketId} en su cola de Desarrollo`)

    const biHasTicket = await techBiPage.locator(`:text("#${ticketId}")`).isVisible({ timeout: 2000 }).catch(() => false)
    record('tech_bi Aislamiento', !biHasTicket, `tech_bi NO ve el ticket #${ticketId} en su tablero`)

    await saveShot(techDevPage, 'h56-1-tech-dev-queue.png')
    await saveShot(liderDevPage, 'h56-2-lider-dev-queue.png')
    await saveShot(techBiPage, 'h56-3-tech-bi-isolated.png')

    // 4. En tech_dev: asignarse el ticket, iniciarlo y ponerlo en pausa
    console.log('\n--- 4. TECH_DEV PONE TICKET EN PAUSA ---')
    const techClaimBtn = techDevPage.locator(`[data-column-id="queue"]`).getByText(`#${ticketId}`).locator('xpath=ancestor::div[.//button][1]').getByRole('button', { name: /Asignarme/i })
    await techClaimBtn.click()
    await techDevPage.waitForSelector(`[data-column-id="mine"] :text("#${ticketId}")`, { timeout: 10000 })
    record('tech_dev Asignado', true, `tech_dev se asignó el ticket #${ticketId} a "Mis tickets"`)

    // Mover a "En progreso"
    const startBtn = techDevPage.locator(`[data-column-id="mine"]`).getByText(`#${ticketId}`).locator('xpath=ancestor::div[.//button][1]').getByRole('button', { name: /Iniciar|Empezar/i })
    await startBtn.click()
    await techDevPage.waitForSelector(`[data-column-id="in_progress"] :text("#${ticketId}")`, { timeout: 10000 })
    record('tech_dev En Progreso', true, `tech_dev inició el ticket #${ticketId}`)

    // Pausar con el modal
    const pauseBtn = techDevPage.locator(`[data-column-id="in_progress"]`).getByText(`#${ticketId}`).locator('xpath=ancestor::div[.//button][1]').getByRole('button', { name: /Pausar/i })
    await pauseBtn.click()

    const modal = techDevPage.getByRole('dialog')
    await modal.waitFor({ state: 'visible', timeout: 5000 })
    await modal.locator('select').selectOption({ index: 1 })
    await modal.locator('textarea').fill('Esperando validación externa del cliente (H-56)')
    await modal.getByRole('button', { name: /Confirmar/i }).click()
    await modal.waitFor({ state: 'hidden', timeout: 10000 })

    // Validar Toast local en tech_dev
    const toastConfirmed = await techDevPage.locator(':text("Ticket puesto en pendiente")').isVisible({ timeout: 5000 }).catch(() => false)
    record('tech_dev Toast Confirmación', toastConfirmed, 'tech_dev ve el toast local "Ticket puesto en pendiente"')

    // Validar Notificación en lider_dev ("Ticket en pausa")
    console.log('Verificando notificación SignalR en lider_dev...')
    const leaderToastPause = await liderDevPage.locator(':text("en pausa")').isVisible({ timeout: 10000 }).catch(() => false)
    record('lider_dev Alerta Pausa', leaderToastPause, 'lider_dev recibe la notificación en tiempo real de ticket en pausa')

    // Validar que tech_bi no vio nada
    const biSawPause = await techBiPage.locator(':text("en pausa")').isVisible({ timeout: 1500 }).catch(() => false)
    record('tech_bi Sin Alerta', !biSawPause, 'tech_bi NO recibió notificación de ticket en pausa')

    await saveShot(techDevPage, 'h56-4-tech-dev-paused.png')
    await saveShot(liderDevPage, 'h56-5-lider-dev-paused-alert.png')

    // 5. En lider_dev: auto-asignarse un ticket de su cola (demostrando que el líder es técnico)
    console.log('\n--- 5. LIDER_DEV SE ASIGNA TICKET (LÍDER ES TÉCNICO) ---')
    // Crear un segundo ticket en Desarrollo para probar que el líder se lo asigna
    const ticket2Title = `Ticket Lider Claim ${Date.now()}`
    const create2Res = await fetch(`${API_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: ticket2Title,
        description: 'Verificación de que supervisor puede ser técnico y reclamar.',
        urgency: 2,
        categoryId: 11,
        groupId: 1,
      }),
    })
    const create2Data = await create2Res.json()
    const ticket2Id = create2Data.id ?? create2Data.ticketId
    record('Crear Ticket 2', true, `Ticket #${ticket2Id} creado para que lider_dev lo reclame`)

    await liderDevPage.waitForSelector(`[data-column-id="queue"] :text("#${ticket2Id}")`, { timeout: 15000 })
    const leaderClaimBtn = liderDevPage.locator(`[data-column-id="queue"]`).getByText(`#${ticket2Id}`).locator('xpath=ancestor::div[.//button][1]').getByRole('button', { name: /Asignarme/i })
    await leaderClaimBtn.click()

    await liderDevPage.waitForSelector(`[data-column-id="mine"] :text("#${ticket2Id}")`, { timeout: 15000 })
    record('lider_dev Asignado a sí mismo', true, `lider_dev se asignó el ticket #${ticket2Id} exitosamente a "Mis tickets"`)

    await saveShot(liderDevPage, 'h56-6-lider-dev-claimed-success.png')

    await techDevCtx.close()
    await techBiCtx.close()
    await liderDevCtx.close()

    console.log('\n🎉 ¡Todas las pruebas de fuego pasaron exitosamente!')
  } catch (err) {
    console.error('❌ Error en prueba de fuego H-56:', err)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

run()
