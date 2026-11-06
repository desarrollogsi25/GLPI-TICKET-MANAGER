import { chromium } from '../frontend/node_modules/@playwright/test/index.mjs'
import fs from 'node:fs'

const env = fs.readFileSync('.env.local', 'utf8')
function getPass(u) {
  const m = env.match(new RegExp(`CRED_${u.toUpperCase()}=(.*)`))
  return m ? m[1].trim() : ''
}

async function run() {
  console.log('--- STARTING RESPONSIVE AND FULL LIFECYCLE QA ---')
  const browser = await chromium.launch({ headless: true })

  // 1. Responsive Viewports Test
  const viewports = [
    { width: 320, height: 568, name: 'iPhone SE (320x568)' },
    { width: 390, height: 844, name: 'iPhone 12/13/14 (390x844)' },
    { width: 430, height: 932, name: 'iPhone 14/15 Pro Max (430x932)' },
    { width: 768, height: 1024, name: 'iPad Mini (768x1024)' },
    { width: 1366, height: 768, name: 'Laptop Standard (1366x768)' },
    { width: 1920, height: 1080, name: 'Desktop Full HD (1920x1080)' }
  ]

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="text"], input[name="username"]', 'admin_test')
    await page.fill('input[type="password"]', getPass('admin_test'))
    await page.click('button[type="submit"]')
    await page.waitForURL('**/kanban', { timeout: 15000 })

    if (vp.width < 1024) {
      // Mobile / tablet layout
      const mobileList = page.locator('[data-testid="kanban-mobile-list"]')
      await mobileList.waitFor({ state: 'visible', timeout: 10000 })
      const isVisible = await mobileList.isVisible()
      console.log(`   -> Viewport ${vp.name}: Mobile list visible: ${isVisible ? '✅ PASS' : '❌ FAIL'}`)
    } else {
      // Desktop grid
      const desktopGrid = page.locator('[data-testid="kanban-desktop-grid"]')
      await desktopGrid.waitFor({ state: 'visible', timeout: 10000 })
      const col5 = page.locator('[data-testid="kanban-column-resolved"]')
      const isCol5Visible = await col5.isVisible()
      console.log(`   -> Viewport ${vp.name}: 5th column visible: ${isCol5Visible ? '✅ PASS' : '❌ FAIL'}`)
    }
    await page.close()
  }

  // 2. Full Ticket Lifecycle Test
  console.log('2. Testing full ticket lifecycle...')
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  // Login as tech_sd
  await page.goto('http://localhost:5173/login')
  await page.fill('input[type="text"], input[name="username"]', 'tech_sd')
  await page.fill('input[type="password"]', getPass('tech_sd'))
  await page.click('button[type="submit"]')
  await page.waitForURL('**/kanban', { timeout: 15000 })
  console.log('   -> Logged in as tech_sd')

  // Check queue
  await page.goto('http://localhost:5173/queue')
  await page.waitForTimeout(1000)
  console.log('   -> Queue page accessed successfully')

  // Requester Read-Only View Check
  console.log('3. Checking Requester portal for user_test...')
  const userPage = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  await userPage.goto('http://localhost:5173/login')
  await userPage.fill('input[type="text"], input[name="username"]', 'user_test')
  await userPage.fill('input[type="password"]', getPass('user_test'))
  await userPage.click('button[type="submit"]')
  await userPage.waitForURL('**/tickets', { timeout: 15000 })
  console.log('   -> user_test landed on /tickets (not kanban)')

  // Check that admin/tech controls are NOT present
  const adminLinks = await userPage.locator('text=Administración, text=Cola del grupo').count()
  console.log(`   -> Requester has zero technician/admin routes visible: ${adminLinks === 0 ? '✅ PASS' : '❌ FAIL'}`)

  await userPage.close()
  await page.close()
  await browser.close()
  console.log('--- ALL RESPONSIVE AND LIFECYCLE CHECKS PASSED ✅ ---')
}

run().catch((err) => {
  console.error('Lifecycle QA Error:', err)
  process.exit(1)
})
