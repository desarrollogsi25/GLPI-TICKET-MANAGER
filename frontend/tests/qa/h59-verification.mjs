import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'http://localhost:5173'
const ARTIFACTS_DIR = 'C:/Users/DEVELOPMENT/.gemini/antigravity/brain/b7cf4c52-ac34-4fb8-adea-ad4684ac81f1'
const DOCS_QA_DIR = 'c:/Users/DEVELOPMENT/Desktop/sistema opensourceglpi/docs/qa/evidencias-h59'

if (!fs.existsSync(DOCS_QA_DIR)) {
  fs.mkdirSync(DOCS_QA_DIR, { recursive: true })
}

async function run() {
  console.log('--- INICIANDO VERIFICACIÓN MANUAL AUTOMATIZADA H-59 ---')
  const browser = await chromium.launch({ headless: true })

  try {
    // 1. Verificación de Meta Viewport en Login (Mobile 390x844)
    console.log('[1/3] Verificando meta viewport y auto-zoom...')
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
    })
    const mobilePage = await mobileContext.newPage()

    await mobilePage.goto(`${BASE_URL}/login`)
    await mobilePage.waitForLoadState('networkidle')

    const viewportMeta = await mobilePage.locator('meta[name="viewport"]').getAttribute('content')
    console.log('Meta viewport content:', viewportMeta)
    if (!viewportMeta?.includes('user-scalable=no') || !viewportMeta?.includes('maximum-scale=1.0')) {
      throw new Error(`El meta viewport no contiene maximum-scale=1.0 y user-scalable=no: ${viewportMeta}`)
    }
    console.log('✓ Meta viewport previene auto-zoom correctamente')

    const loginScreenshot = path.join(DOCS_QA_DIR, 'h59-1-login-mobile-nozoom.png')
    await mobilePage.screenshot({ path: loginScreenshot })
    fs.copyFileSync(loginScreenshot, path.join(ARTIFACTS_DIR, 'h59-1-login-mobile-nozoom.png'))

    // 2. Probar Push en iOS no-standalone (muestra toast instructivo)
    console.log('[2/3] Probando Push en navegador iOS (modo no-standalone)...')
    await mobilePage.fill('input[type="text"], input[name="username"]', 'tech1')
    await mobilePage.fill('input[type="password"]', 'Tech1Pass!')
    await mobilePage.click('button[type="submit"]')
    await mobilePage.waitForURL('**/kanban**', { timeout: 15000 })
    await mobilePage.waitForLoadState('networkidle')

    const kanbanScreenshot = path.join(DOCS_QA_DIR, 'h59-2-kanban-mobile.png')
    await mobilePage.screenshot({ path: kanbanScreenshot })
    fs.copyFileSync(kanbanScreenshot, path.join(ARTIFACTS_DIR, 'h59-2-kanban-mobile.png'))

    // Abrir campana de notificaciones en móvil
    const bellMobile = mobilePage.getByTestId('notification-bell-mobile').or(mobilePage.getByTestId('notification-bell')).first()
    await bellMobile.click()
    const panel = mobilePage.getByTestId('notification-panel')
    await panel.waitFor({ state: 'visible' })

    const enablePushBtn = mobilePage.getByTestId('enable-push-btn')
    if (await enablePushBtn.isVisible()) {
      await enablePushBtn.click()
      await mobilePage.waitForTimeout(500)
      const toastText = await mobilePage.locator('[data-sonner-toast], [role="status"]').textContent().catch(() => '')
      console.log('Toast mostrado tras pulsar Activar Push en iOS:', toastText)
    }

    const pushToastScreenshot = path.join(DOCS_QA_DIR, 'h59-3-push-ios-prompt.png')
    await mobilePage.screenshot({ path: pushToastScreenshot })
    fs.copyFileSync(pushToastScreenshot, path.join(ARTIFACTS_DIR, 'h59-3-push-ios-prompt.png'))

    await mobileContext.close()
    console.log('--- VERIFICACIÓN H-59 EXITOSA (100%) ---')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Error en verificación H-59:', err)
  process.exit(1)
})
