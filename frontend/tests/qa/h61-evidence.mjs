import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const evidenceDir = path.resolve('docs/qa/evidencias-h61')
const artifactDir = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true })
}

async function capture() {
  const browser = await chromium.launch({ headless: true })
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

  // 1. Nueva Vista de Detalle (2 columnas)
  await page.goto('http://localhost:5173/tickets/11')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200)

  const p1Path = path.join(evidenceDir, 'h61-1-ticket-detail-2-columns.png')
  await page.screenshot({ path: p1Path, fullPage: true })
  fs.copyFileSync(p1Path, path.join(artifactDir, 'h61-1-ticket-detail-2-columns.png'))
  console.log('Saved 1:', p1Path)

  // 2. Sidebar con perfil flotante y sin borde divisor
  await page.goto('http://localhost:5173/kanban')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  const p2Path = path.join(evidenceDir, 'h61-2-sidebar-floating-profile.png')
  await page.screenshot({ path: p2Path })
  fs.copyFileSync(p2Path, path.join(artifactDir, 'h61-2-sidebar-floating-profile.png'))
  console.log('Saved 2:', p2Path)

  // 3. Tarjeta con hover y Kanban centrado max-w-7xl
  const firstCard = page.locator('.kanban-card-item').first()
  if (await firstCard.isVisible()) {
    await firstCard.hover()
    await page.waitForTimeout(600)
  }

  const p3Path = path.join(evidenceDir, 'h61-3-kanban-compact-cards.png')
  await page.screenshot({ path: p3Path })
  fs.copyFileSync(p3Path, path.join(artifactDir, 'h61-3-kanban-compact-cards.png'))
  console.log('Saved 3:', p3Path)

  // 4. Vista móvil: Header limpio sin botón hamburguesa
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
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

  const p4Path = path.join(evidenceDir, 'h61-4-mobile-clean-header.png')
  await mobilePage.screenshot({ path: p4Path })
  fs.copyFileSync(p4Path, path.join(artifactDir, 'h61-4-mobile-clean-header.png'))
  console.log('Saved 4:', p4Path)

  await browser.close()
  console.log('Todas las evidencias capturadas con éxito.')
}

capture().catch(console.error)
