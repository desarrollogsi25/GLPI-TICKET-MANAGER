import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const evidenceDir = path.resolve('docs/qa/evidencias-h60')
const artifactDir = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true })
}

async function capture() {
  const browser = await chromium.launch({ headless: true })
  
  // 1. Desktop Context
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })
  const page = await context.newPage()

  // Login
  await page.goto('http://localhost:5173/login')
  await page.fill('input[type="text"], input[name="username"]', 'tech1')
  await page.fill('input[type="password"]', 'tech1')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:5173/**', { timeout: 10000 })
  await page.waitForTimeout(1000)

  // 1.1 Captura Preferences (Desktop)
  await page.goto('http://localhost:5173/preferences')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Disparar toast de prueba haciendo click en Preset Charcoal
  const charcoalBtn = page.locator('[data-testid="preset-option-charcoal"]')
  if (await charcoalBtn.isVisible()) {
    await charcoalBtn.click()
    await page.waitForTimeout(500)
  }

  const p1Path = path.join(evidenceDir, 'h60-1-preferences-liquid-glass.png')
  await page.screenshot({ path: p1Path, fullPage: true })
  fs.copyFileSync(p1Path, path.join(artifactDir, 'h60-1-preferences-liquid-glass.png'))
  console.log('Saved 1:', p1Path)

  // 1.2 Captura TeamDashboard con filtro interactivo de técnico
  // Login como lider
  await page.goto('http://localhost:5173/equipo')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // Clic en el primer técnico
  const techButton = page.locator('button[data-testid^="filter-tech-"]').first()
  if (await techButton.isVisible()) {
    await techButton.click()
    await page.waitForTimeout(800)
  }

  const p2Path = path.join(evidenceDir, 'h60-2-team-dashboard-tech-filter.png')
  await page.screenshot({ path: p2Path, fullPage: true })
  fs.copyFileSync(p2Path, path.join(artifactDir, 'h60-2-team-dashboard-tech-filter.png'))
  console.log('Saved 2:', p2Path)

  // 2. Mobile Context (iPhone 14 / 390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  })
  const mobilePage = await mobileContext.newPage()

  await mobilePage.goto('http://localhost:5173/login')
  await mobilePage.fill('input[type="text"], input[name="username"]', 'tech1')
  await mobilePage.fill('input[type="password"]', 'tech1')
  await mobilePage.click('button[type="submit"]')
  await mobilePage.waitForURL('http://localhost:5173/**', { timeout: 10000 })
  await mobilePage.waitForTimeout(1000)

  // Disparar toast en móvil para ver posición top-center
  await mobilePage.goto('http://localhost:5173/preferences')
  await mobilePage.waitForLoadState('networkidle')
  await mobilePage.waitForTimeout(800)

  const mobileLightBtn = mobilePage.locator('button:has-text("Modo Claro")').first()
  if (await mobileLightBtn.isVisible()) {
    await mobileLightBtn.click()
    await mobilePage.waitForTimeout(600)
  }

  const p3Path = path.join(evidenceDir, 'h60-3-mobile-toasts-top-center.png')
  await mobilePage.screenshot({ path: p3Path })
  fs.copyFileSync(p3Path, path.join(artifactDir, 'h60-3-mobile-toasts-top-center.png'))
  console.log('Saved 3:', p3Path)

  await browser.close()
  console.log('Evidencias capturadas con éxito.')
}

capture().catch(console.error)
