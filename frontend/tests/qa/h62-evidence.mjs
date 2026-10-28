import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const EVIDENCIAS_DIR = resolve(process.cwd(), 'docs/qa/evidencias-h62')
mkdirSync(EVIDENCIAS_DIR, { recursive: true })

async function captureEvidence() {
  const browser = await chromium.launch({ headless: true })

  // 1. Desktop Login Split-Screen (1280x800)
  const loginContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    storageState: { cookies: [], origins: [] },
  })
  const loginPage = await loginContext.newPage()
  await loginPage.goto('http://localhost:5173/login')
  await loginPage.waitForLoadState('networkidle')
  await loginPage.waitForTimeout(600)
  await loginPage.screenshot({
    path: resolve(EVIDENCIAS_DIR, 'h62-1-login-split-screen.png'),
    fullPage: false,
  })
  console.log('Capturado: h62-1-login-split-screen.png')
  await loginContext.close()

  // 2. Kanban TicketCard Hover & Flow (1280x800)
  const authContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    storageState: 'frontend/tests/e2e/.auth/tech1.json',
  })
  const kanbanPage = await authContext.newPage()
  await kanbanPage.goto('http://localhost:5173/kanban')
  await kanbanPage.waitForLoadState('networkidle')
  await kanbanPage.waitForTimeout(1000)

  // Hover over the first ticket card
  const firstCard = kanbanPage.locator('[draggable="true"]').first()
  if (await firstCard.isVisible()) {
    await firstCard.hover()
    await kanbanPage.waitForTimeout(400)
  }
  await kanbanPage.screenshot({
    path: resolve(EVIDENCIAS_DIR, 'h62-2-ticket-card-hover.png'),
    fullPage: false,
  })
  console.log('Capturado: h62-2-ticket-card-hover.png')

  // 3. Team Dashboard Technician Filter with Checkmark
  const teamPage = await authContext.newPage()
  await teamPage.goto('http://localhost:5173/equipo')
  await teamPage.waitForLoadState('networkidle')
  await teamPage.waitForTimeout(1000)

  // Select a technician if buttons are present
  const techButton = teamPage.locator('button', { hasText: /tech1|Supervisor|Técnico/i }).first()
  if (await techButton.isVisible()) {
    await techButton.click()
    await teamPage.waitForTimeout(400)
  }
  await teamPage.screenshot({
    path: resolve(EVIDENCIAS_DIR, 'h62-3-team-dashboard-tech-check.png'),
    fullPage: false,
  })
  console.log('Capturado: h62-3-team-dashboard-tech-check.png')

  await authContext.close()
  await browser.close()
  console.log('Todas las capturas de evidencia H-62 fueron tomadas con éxito.')
}

captureEvidence().catch((err) => {
  console.error('Error capturando evidencias H-62:', err)
  process.exit(1)
})
