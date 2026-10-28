import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

async function run() {
  const outDir = resolve(process.cwd(), '../docs/qa/evidencias-layout')
  const artifactDir = 'C:/Users/DEVELOPMENT/.gemini/antigravity/brain/b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'
  mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  
  // 1. Desktop Test: 1440x900
  console.log('--- Probando Desktop (1440x900) ---')
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })
  const page = await desktopContext.newPage()

  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')

  await page.locator('input[type="text"], input[name="username"]').fill('tech1')
  await page.locator('input[type="password"]').fill('Tech1Pass!')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/kanban**', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Verify all 5 columns exist and are visible
  const columns = ['queue', 'mine', 'in_progress', 'pending', 'resolved']
  for (const col of columns) {
    const colLoc = page.locator(`[data-column-id="${col}"]`)
    const isVis = await colLoc.isVisible()
    console.log(`Columna ${col} visible: ${isVis}`)
    if (!isVis) throw new Error(`Columna ${col} no está visible`)
  }

  // Verify global page has NO vertical scroll
  const scrollInfo = await page.evaluate(() => {
    return {
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      bodyScrollHeight: document.body.scrollHeight,
      windowInnerHeight: window.innerHeight,
    }
  })
  console.log('Scroll metrics desktop:', scrollInfo)
  const hasGlobalVerticalScroll = scrollInfo.scrollHeight > scrollInfo.clientHeight + 2
  console.log(`¿Existe scroll global vertical en la página?: ${hasGlobalVerticalScroll ? 'SÍ (ERROR)' : 'NO (CORRECTO)'}`)

  // Verify internal column scroll
  const columnScrollInfo = await page.evaluate(() => {
    const col = document.querySelector('[data-column-id="mine"] .no-scrollbar') || document.querySelector('[data-column-id="queue"] .no-scrollbar')
    if (!col) return null
    const style = window.getComputedStyle(col)
    return {
      overflowY: style.overflowY,
      scrollbarWidth: style.scrollbarWidth,
      className: col.className,
      scrollHeight: col.scrollHeight,
      clientHeight: col.clientHeight
    }
  })
  console.log('Column scroll info:', columnScrollInfo)

  const desktopShot1 = resolve(outDir, 'layout-1-desktop-1440x900.png')
  const desktopShotBrain = resolve(artifactDir, 'layout-1-desktop-1440x900.png')
  await page.screenshot({ path: desktopShot1, fullPage: false })
  await page.screenshot({ path: desktopShotBrain, fullPage: false })
  console.log('Captura desktop guardada en:', desktopShot1)

  await desktopContext.close()

  // 2. Mobile Test: 390x844
  console.log('--- Probando Mobile (390x844) ---')
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  })
  const mobilePage = await mobileContext.newPage()

  await mobilePage.goto('http://localhost:5173/login')
  await mobilePage.waitForLoadState('networkidle')
  await mobilePage.locator('input[type="text"], input[name="username"]').fill('tech1')
  await mobilePage.locator('input[type="password"]').fill('Tech1Pass!')
  await mobilePage.click('button[type="submit"]')
  await mobilePage.waitForURL('**/kanban**', { timeout: 15000 })
  await mobilePage.waitForLoadState('networkidle')
  await mobilePage.waitForTimeout(1000)

  const mobileTabs = await mobilePage.locator('[role="tablist"], [data-testid="kanban-segmented-tabs"]').count()
  console.log('Segmented tabs presentes en móvil:', mobileTabs > 0)

  const mobileShot1 = resolve(outDir, 'layout-2-mobile-390x844.png')
  const mobileShotBrain = resolve(artifactDir, 'layout-2-mobile-390x844.png')
  await mobilePage.screenshot({ path: mobileShot1, fullPage: false })
  await mobilePage.screenshot({ path: mobileShotBrain, fullPage: false })
  console.log('Captura mobile guardada en:', mobileShot1)

  await mobileContext.close()
  await browser.close()
  console.log('--- Verificación de layout completada con éxito ---')
}

run().catch((err) => {
  console.error('Error en verificación:', err)
  process.exit(1)
})
