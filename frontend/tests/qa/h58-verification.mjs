import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'http://localhost:5173'
const ARTIFACTS_DIR = 'C:/Users/DEVELOPMENT/.gemini/antigravity/brain/b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'
const DOCS_QA_DIR = 'c:/Users/DEVELOPMENT/Desktop/sistema opensourceglpi/docs/qa/evidencias-h58'

if (!fs.existsSync(DOCS_QA_DIR)) {
  fs.mkdirSync(DOCS_QA_DIR, { recursive: true })
}

async function run() {
  console.log('--- INICIANDO VERIFICACIÓN MANUAL AUTOMATIZADA H-58 ---')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  try {
    // 1. Iniciar sesión como lider_dev (supervisor)
    console.log('[1/4] Autenticando lider_dev...')
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="text"], input[name="username"]', 'lider_dev')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/kanban**', { timeout: 15000 })
    console.log('✓ Login correcto en Kanban como supervisor')

    // 2. Navegar a /equipo
    console.log('[2/4] Navegando a /equipo...')
    await page.goto(`${BASE_URL}/equipo`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 3. Verificar que NO existe el botón "Crear ticket"
    console.log('[3/4] Verificando ausencia del botón "Crear ticket"...')
    const createBtnById = await page.locator('[data-testid="create-ticket-btn"]').count()
    const createBtnByText = await page.getByRole('button', { name: /Crear ticket|Nuevo ticket/i }).count()
    console.log(`Botones "Crear ticket" encontrados: por testid=${createBtnById}, por texto=${createBtnByText}`)
    if (createBtnById > 0 || createBtnByText > 0) {
      throw new Error('El botón Crear ticket todavía está presente en /equipo!')
    }
    console.log('✓ Confirmado: No existe ningún botón ni acción para crear tickets')

    // 4. Verificar nuevos filtros (Técnico, Estado, Desde, Hasta, Limpiar)
    console.log('[4/4] Verificando componentes de filtros Liquid Glass...')
    const techSelect = page.locator('[data-testid="filter-technician-select"]')
    const statusSelect = page.locator('[data-testid="filter-status-select"]')
    const startDate = page.locator('[data-testid="filter-start-date"]')
    const endDate = page.locator('[data-testid="filter-end-date"]')

    await techSelect.waitFor({ state: 'visible' })
    await statusSelect.waitFor({ state: 'visible' })
    await startDate.waitFor({ state: 'visible' })
    await endDate.waitFor({ state: 'visible' })
    console.log('✓ Selectores y datepickers visibles correctamente')

    // Probar filtro por fecha
    await startDate.fill('2026-01-01')
    await endDate.fill('2026-12-31')
    await page.waitForTimeout(500)

    const clearBtn = page.locator('[data-testid="clear-team-filters-btn"]')
    const isClearVisible = await clearBtn.isVisible()
    console.log('Botón limpiar filtros visible tras aplicar fecha:', isClearVisible)
    if (!isClearVisible) {
      throw new Error('El botón Limpiar filtros no apareció al tener filtros activos!')
    }

    // Limpiar filtros
    await clearBtn.click()
    await page.waitForTimeout(500)
    const startDateVal = await startDate.inputValue()
    console.log('Valor de fecha desde tras limpiar:', startDateVal)

    // Captura de pantalla de la vista /equipo
    const screenshotPath = path.join(DOCS_QA_DIR, 'h58-equipo-dashboard.png')
    const brainScreenshotPath = path.join(ARTIFACTS_DIR, 'h58-equipo-dashboard.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    fs.copyFileSync(screenshotPath, brainScreenshotPath)
    console.log('✓ Captura de pantalla guardada en:', screenshotPath)

    console.log('--- VERIFICACIÓN H-58 EXITOSA (100%) ---')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Error en verificación H-58:', err)
  process.exit(1)
})
