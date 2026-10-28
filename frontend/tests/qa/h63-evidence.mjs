import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT = resolve(process.cwd(), 'docs/qa/evidencias-h63')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })

// 1. Login con ola (desktop + móvil)
const anon = await browser.newContext({ viewport: { width: 1366, height: 800 }, storageState: { cookies: [], origins: [] } })
const lp = await anon.newPage()
await lp.goto('http://localhost:5173/login')
await lp.waitForLoadState('networkidle')
await lp.waitForTimeout(1200)
await lp.screenshot({ path: resolve(OUT, 'h63-1-login-wave.png') })
await anon.close()

const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: { cookies: [], origins: [] } })
const mp = await mob.newPage()
await mp.goto('http://localhost:5173/login')
await mp.waitForLoadState('networkidle')
await mp.waitForTimeout(1200)
await mp.screenshot({ path: resolve(OUT, 'h63-1b-login-wave-mobile.png') })
await mob.close()

// 2. Dropdown de temas abierto (modo oscuro)
const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 }, storageState: 'tests/e2e/.auth/tech1.json' })
const page = await ctx.newPage()
await page.goto('http://localhost:5173/kanban')
await page.waitForLoadState('networkidle')
// El dropdown de presets sólo se renderiza con el estado React `isDark`, así que
// el modo oscuro se activa con el botón real del header (no con evaluate sobre el DOM).
const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
if (!isDark) {
  await page.getByTestId('theme-toggle-btn').click()
  await page.waitForTimeout(500)
}
const preset = page.getByTestId('dark-preset-select')
await preset.waitFor({ state: 'visible', timeout: 10000 })
await preset.click()
await page.waitForTimeout(400)
await page.getByRole('option').nth(1).hover()
await page.waitForTimeout(300)
await page.screenshot({ path: resolve(OUT, 'h63-2-theme-dropdown.png') })
await page.keyboard.press('Escape')

// 3. Kanban con hover sobre tarjeta
await page.waitForTimeout(300)
const card = page.locator('[role="article"]').filter({ has: page.getByRole('button') }).first()
await card.scrollIntoViewIfNeeded()
await card.hover()
await page.waitForTimeout(500)
await page.screenshot({ path: resolve(OUT, 'h63-3-kanban-card-hover.png') })

await browser.close()
console.log('H-63 evidencias OK')
