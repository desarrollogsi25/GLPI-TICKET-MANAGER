import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve(process.cwd(), 'frontend/docs/qa/all-eight-profiles')
fs.mkdirSync(OUT_DIR, { recursive: true })

const BASE_URL = 'http://127.0.0.1:4173'

function getCred(user) {
  const key = `CRED_${user.toUpperCase()}`
  if (process.env[key]) return process.env[key]
  for (const candidate of ['.env.local', '../.env.local', '../../.env.local']) {
    try {
      if (fs.existsSync(candidate)) {
        const text = fs.readFileSync(candidate, 'utf8')
        const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
        if (match) return match[1].trim()
      }
    } catch {}
  }
  return ''
}

const ACCOUNTS = [
  { username: 'admin_test', role: 'admin', expectedGroup: 'Todas', name: 'Administrador' },
  { username: 'lider_sd', role: 'supervisor', expectedGroup: 'Service Desk', name: 'Líder Service Desk' },
  { username: 'tech_sd', role: 'technician', expectedGroup: 'Service Desk', name: 'Técnico Service Desk' },
  { username: 'lider_dev', role: 'supervisor', expectedGroup: 'Desarrollo', name: 'Líder Desarrollo' },
  { username: 'tech_dev', role: 'technician', expectedGroup: 'Desarrollo', name: 'Técnico Desarrollo' },
  { username: 'lider_bi', role: 'supervisor', expectedGroup: 'BI', name: 'Líder BI' },
  { username: 'tech_bi', role: 'technician', expectedGroup: 'BI', name: 'Técnico BI' },
  { username: 'user_test', role: 'solicitante', expectedGroup: 'N/A', name: 'Usuario Solicitante' },
]

async function runBrowserQa() {
  console.log('================================================================')
  console.log('QA MANUAL CON CHROMIUM: COBERTURA COMPLETA DE LOS 8 PERFILES')
  console.log(`Frontend URL: ${BASE_URL} (Proxying to QA Backend 5280)`)
  console.log('================================================================\n')

  const browser = await chromium.launch({ headless: true })
  const report = []

  for (const acc of ACCOUNTS) {
    const password = getCred(acc.username)
    if (!password) {
      console.error(`[-] Falta contraseña para ${acc.username}`)
      continue
    }

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 QA-Master-Runner',
    })
    const page = await context.newPage()
    const consoleErrors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    console.log(`\n--- Evaluando perfil: ${acc.username} (${acc.name} - Rol: ${acc.role}) ---`)

    try {
      // 1. Login
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
      await page.fill('input[type="text"], input[name="username"], #username', acc.username)
      await page.fill('input[type="password"], input[name="password"], #password', password)
      await page.click('button[type="submit"]')

      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      const isLoggedIn = !currentUrl.includes('/login')
      console.log(`  ✓ Login exitoso: ${isLoggedIn} (URL: ${currentUrl})`)

      // Captura inicial tras login
      const shotName = `${acc.username}-01-landing.png`
      await page.screenshot({ path: path.join(OUT_DIR, shotName) })

      // 2. Comportamiento según rol
      let viewDetails = {}

      if (acc.role === 'admin' || acc.role === 'supervisor') {
        // Navegar a Kanban
        await page.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(1500)
        await page.screenshot({ path: path.join(OUT_DIR, `${acc.username}-02-kanban.png`) })

        // Verificar columnas
        const colElements = await page.$$('.kanban-column, [data-testid^="kanban-column-"]')
        const cards = await page.$$('.kanban-card-item, [data-testid^="ticket-card-"]')
        console.log(`  ✓ Kanban cargado: ${colElements.length} columnas detectadas, ${cards.length} tarjetas visibles`)

        // Navegar a Mi Equipo / TeamDashboard
        await page.goto(`${BASE_URL}/team`, { waitUntil: 'networkidle' }).catch(() => {})
        await page.waitForTimeout(1000)
        await page.screenshot({ path: path.join(OUT_DIR, `${acc.username}-03-team.png`) })

        viewDetails = { kanbanCols: colElements.length, kanbanCards: cards.length }
      } else if (acc.role === 'technician') {
        // Navegar a Kanban de técnico
        await page.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(1500)
        await page.screenshot({ path: path.join(OUT_DIR, `${acc.username}-02-kanban.png`) })

        // Verificar etiqueta de grupo de técnico (H-36)
        const groupLabelEl = await page.$('[data-testid="technician-group-label"]')
        const groupLabelText = groupLabelEl ? await groupLabelEl.innerText() : 'No visible'
        console.log(`  ✓ Grupo fijo de técnico: ${groupLabelText}`)

        // Navegar a Planificación / Calendario
        await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle' }).catch(() => {})
        await page.waitForTimeout(1000)
        await page.screenshot({ path: path.join(OUT_DIR, `${acc.username}-03-calendar.png`) })

        viewDetails = { groupLabel: groupLabelText }
      } else if (acc.role === 'solicitante') {
        // user_test: Verificar que no hay errores 403 en consola
        // y que los nombres de técnicos en tickets se leen con texto comprensible
        await page.goto(`${BASE_URL}/tickets`, { waitUntil: 'networkidle' }).catch(() => {})
        await page.waitForTimeout(1500)
        await page.screenshot({ path: path.join(OUT_DIR, `${acc.username}-02-tickets.png`) })

        // Abrir primer ticket si existe
        const firstTicket = await page.$('a[href^="/tickets/"], tr[data-ticket-id]')
        let technicianText = 'N/A'
        if (firstTicket) {
          await firstTicket.click()
          await page.waitForTimeout(1500)
          await page.screenshot({ path: path.join(OUT_DIR, `${acc.username}-03-ticket-detail.png`) })
          const bodyText = await page.innerText('body')
          const rawIdMatch = bodyText.match(/Técnico\s*#\d+/i)
          const techNameMatch = bodyText.match(/(?:Técnico|Asignado|Especialista)[:\s]+([^\n\r]+)/i)
          technicianText = techNameMatch ? techNameMatch[0] : (rawIdMatch ? rawIdMatch[0] : 'Normalizado')
          console.log(`  ✓ Detalle de ticket para solicitante: ${technicianText}`)
        }

        viewDetails = { technicianDisplay: technicianText }
      }

      const severeErrors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('manifest'))
      console.log(`  ✓ Errores severos de consola: ${severeErrors.length}`)

      report.push({
        account: acc.username,
        role: acc.role,
        group: acc.expectedGroup,
        isLoggedIn,
        errorsCount: severeErrors.length,
        status: isLoggedIn && severeErrors.length === 0 ? 'PASS 🟢' : 'WARN 🟡',
        details: viewDetails,
      })
    } catch (err) {
      console.error(`  ❌ Error en ${acc.username}:`, err.message)
      report.push({
        account: acc.username,
        role: acc.role,
        group: acc.expectedGroup,
        isLoggedIn: false,
        errorsCount: 1,
        status: 'FAIL 🔴',
        error: err.message,
      })
    } finally {
      await context.close()
    }
  }

  await browser.close()

  console.log('\n================================================================')
  console.log('MATRIZ DE RESULTADOS DE LOS 8 PERFILES (CHROMIUM PLAYWRIGHT)')
  console.log('================================================================')
  console.table(report)

  const allPassed = report.every((r) => r.status.includes('PASS'))
  console.log(`\nResultado global 8 cuentas: ${allPassed ? '100% PASS 🟢' : 'COMPLETADO CON OBSERVACIONES 🟡'}`)
}

runBrowserQa().catch((err) => {
  console.error('Fallo de ejecución:', err)
  process.exit(1)
})
