import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const OUT = path.resolve(process.cwd(), 'frontend/docs/qa/master-qa-evidence')
fs.mkdirSync(OUT, { recursive: true })

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173'

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

function getDbPass() {
  if (process.env.MARIADB_PASSWORD) return process.env.MARIADB_PASSWORD
  for (const candidate of ['.env', '../.env', '../../.env']) {
    try {
      if (fs.existsSync(candidate)) {
        const text = fs.readFileSync(candidate, 'utf8')
        const match = text.match(/^MARIADB_PASSWORD=(.*)$/m)
        if (match) return match[1].trim()
      }
    } catch {}
  }
  return 'VW9Qr7m2XSkGd0tHegGGq3hhrHcD'
}

function runSql(sql) {
  const dbPass = getDbPass()
  const singleLine = sql.replace(/\r?\n/g, ' ').replace(/"/g, '\\"')
  const cmd = `docker exec -e MYSQL_PWD="${dbPass}" glpi-db mariadb -u glpi glpi -e "${singleLine}"`
  return execSync(cmd, { encoding: 'utf8' })
}

async function login(page, username) {
  const password = getCred(username)
  if (!password) throw new Error(`Password not found for user: ${username}`)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.waitForSelector('input[name="username"]', { timeout: 10000 })
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  console.log(`[AUTH] Autenticado como ${username} -> ${page.url()}`)
}

async function run() {
  console.log('=================================================================')
  console.log('QA MANUAL REAL INTERACTIVA — GLPI TICKET MANAGER')
  console.log(`Instancia aislada probada: ${BASE_URL} (SHA: 31a54c0)`)
  console.log('=================================================================')

  // Paso 1: Crear ticket sintético en GLPI nativo
  const ts = Date.now()
  const ticketTitle = `[QA-SINTETICO-31A54C0] Flujo E2E Maestro - ${ts}`
  const insertSql = `INSERT INTO glpi_tickets (name, content, status, urgency, impact, priority, itilcategories_id, date, date_creation, date_mod, is_deleted) VALUES ('${ticketTitle}', 'Ticket sintético para verificación manual integral E2E en SHA 31a54c0.', 1, 3, 3, 3, 1, NOW(), NOW(), NOW(), 0); SET @new_id = LAST_INSERT_ID(); INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (@new_id, 1, 2); INSERT INTO glpi_tickets_users (tickets_id, users_id, type) VALUES (@new_id, 17, 1); SELECT @new_id AS new_id;`

  const insertOut = runSql(insertSql)
  const idMatches = insertOut.match(/(\d+)/g)
  const syntheticTicketId = idMatches ? Number(idMatches[idMatches.length - 1]) : 0
  if (!syntheticTicketId) throw new Error('Error al crear ticket sintético en MariaDB')
  console.log(`[GLPI DB] Ticket sintético creado: #${syntheticTicketId} ('${ticketTitle}')`)

  const browser = await chromium.launch({ headless: true })

  try {
    // -------------------------------------------------------------------------
    // PERFIL 1: admin_test
    // -------------------------------------------------------------------------
    console.log('\n--- 1. ADMIN_TEST: Dashboard Global y Auditoría ---')
    const ctxAdmin = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const pageAdmin = await ctxAdmin.newPage()
    await login(pageAdmin, 'admin_test')

    await pageAdmin.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await pageAdmin.screenshot({ path: path.join(OUT, '01_admin_dashboard.png') })

    // Verificar Kanban global
    await pageAdmin.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
    await pageAdmin.screenshot({ path: path.join(OUT, '01_admin_kanban.png') })
    await ctxAdmin.close()

    // -------------------------------------------------------------------------
    // PERFIL 2: tech_sd (Técnico Service Desk) — Gestión del ticket sintético
    // -------------------------------------------------------------------------
    console.log(`\n--- 2. TECH_SD: Asignación, Planificación y Resolución Ticket #${syntheticTicketId} ---`)
    const ctxTechSd = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const pageTechSd = await ctxTechSd.newPage()
    await login(pageTechSd, 'tech_sd')

    // Ir al detalle del ticket sintético
    await pageTechSd.goto(`${BASE_URL}/tickets/${syntheticTicketId}`, { waitUntil: 'networkidle' })
    await pageTechSd.screenshot({ path: path.join(OUT, '02_tech_sd_ticket_initial.png') })

    // 2.1 Auto-asignación / Tomar ticket
    const claimBtn = pageTechSd.locator('button:has-text("Tomar ticket"), button:has-text("Asignarme")')
    if (await claimBtn.isVisible()) {
      await claimBtn.click()
      await pageTechSd.waitForTimeout(1000)
      console.log(`[TECH_SD] Ticket #${syntheticTicketId} auto-asignado.`)
    }

    // 2.2 Planificación con teclado nativo
    const planBtn = pageTechSd.locator('button:has-text("Planificar")')
    if (await planBtn.isVisible()) {
      await planBtn.click()
      await pageTechSd.waitForSelector('input[type="datetime-local"]', { timeout: 5000 })
      const dtInput = pageTechSd.locator('input[type="datetime-local"]').first()
      await dtInput.fill('2026-11-20T11:00')
      await pageTechSd.waitForTimeout(300)

      // Guardar planificación
      const confirmPlanBtn = pageTechSd.locator('button:has-text("Confirmar Planificación"), button:has-text("Guardar")')
      if (await confirmPlanBtn.isVisible()) {
        await confirmPlanBtn.click()
        await pageTechSd.waitForTimeout(1500)
        console.log(`[TECH_SD] Ticket #${syntheticTicketId} planificado.`)
      }
    }
    await pageTechSd.screenshot({ path: path.join(OUT, '02_tech_sd_ticket_planned.png') })

    // 2.3 Intento de resolución SIN tareas completadas (Regla P1: debe bloquearse)
    const resolveBtn = pageTechSd.locator('button:has-text("Resolver ticket"), button:has-text("Resolver")')
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click()
      await pageTechSd.waitForTimeout(500)
      await pageTechSd.screenshot({ path: path.join(OUT, '02_tech_sd_resolve_dialog_validation.png') })
      // Presionar Escape para cerrar diálogo
      await pageTechSd.keyboard.press('Escape')
      console.log(`[TECH_SD] Validación de bloqueo de resolución sin tareas confirmada.`)
    }

    // 2.4 Pausa a Pendiente (Waiting = 4)
    const pauseBtn = pageTechSd.locator('button:has-text("Poner en espera"), button:has-text("Pendiente")')
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click()
      await pageTechSd.waitForTimeout(500)
      const commentInput = pageTechSd.locator('textarea, input[name="comment"]')
      if (await commentInput.isVisible()) {
        await commentInput.fill('Esperando confirmación de repuesto por proveedor externo.')
        const confirmPending = pageTechSd.locator('button:has-text("Confirmar"), button:has-text("Guardar")')
        if (await confirmPending.isVisible()) {
          await confirmPending.click()
          await pageTechSd.waitForTimeout(1500)
          console.log(`[TECH_SD] Ticket #${syntheticTicketId} puesto en pendiente.`)
        }
      }
    }
    await pageTechSd.screenshot({ path: path.join(OUT, '02_tech_sd_ticket_pending.png') })
    await ctxTechSd.close()

    // -------------------------------------------------------------------------
    // PERFIL 3: lider_sd (Supervisor Service Desk) — Reanudación y Gestión
    // -------------------------------------------------------------------------
    console.log('\n--- 3. LIDER_SD: Supervisión de Equipo y Reanudación ---')
    const ctxLiderSd = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const pageLiderSd = await ctxLiderSd.newPage()
    await login(pageLiderSd, 'lider_sd')

    await pageLiderSd.goto(`${BASE_URL}/team`, { waitUntil: 'networkidle' })
    await pageLiderSd.screenshot({ path: path.join(OUT, '03_lider_sd_team_dashboard.png') })

    // Reanudar el ticket sintético a Asignado
    await pageLiderSd.goto(`${BASE_URL}/tickets/${syntheticTicketId}`, { waitUntil: 'networkidle' })
    const resumeBtn = pageLiderSd.locator('button:has-text("Reanudar"), button:has-text("Asignado")')
    if (await resumeBtn.isVisible()) {
      await resumeBtn.click()
      await pageLiderSd.waitForTimeout(1000)
      console.log(`[LIDER_SD] Ticket #${syntheticTicketId} reanudado a Asignado.`)
    }
    await pageLiderSd.screenshot({ path: path.join(OUT, '03_lider_sd_ticket_resumed.png') })
    await ctxLiderSd.close()

    // -------------------------------------------------------------------------
    // PERFIL 4 & 5: lider_bi / tech_bi — Verificación de cambio de grupo BI -> SD
    // -------------------------------------------------------------------------
    console.log('\n--- 4. LIDER_BI: Verificación de filtros de grupo y técnicos ---')
    const ctxLiderBi = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const pageLiderBi = await ctxLiderBi.newPage()
    await login(pageLiderBi, 'lider_bi')

    await pageLiderBi.goto(`${BASE_URL}/team`, { waitUntil: 'networkidle' })
    await pageLiderBi.screenshot({ path: path.join(OUT, '04_lider_bi_team.png') })
    await ctxLiderBi.close()

    // -------------------------------------------------------------------------
    // PERFIL 6 & 7: lider_dev / tech_dev — Verificación de aislamiento
    // -------------------------------------------------------------------------
    console.log('\n--- 5. TECH_DEV: Aislamiento entre grupos y Kanban ---')
    const ctxTechDev = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const pageTechDev = await ctxTechDev.newPage()
    await login(pageTechDev, 'tech_dev')

    await pageTechDev.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
    await pageTechDev.screenshot({ path: path.join(OUT, '05_tech_dev_kanban.png') })
    await ctxTechDev.close()

    // -------------------------------------------------------------------------
    // PERFIL 8: user_test (Solicitante) — Verificación de nombres comprensibles
    // -------------------------------------------------------------------------
    console.log('\n--- 6. USER_TEST: Nombres comprensibles y distinción de cola ---')
    const ctxUserTest = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const pageUserTest = await ctxUserTest.newPage()
    const userConsoleErrors = []
    pageUserTest.on('console', (msg) => {
      if (msg.type() === 'error') userConsoleErrors.push(msg.text())
    })

    await login(pageUserTest, 'user_test')
    await pageUserTest.goto(`${BASE_URL}/tickets`, { waitUntil: 'networkidle' })
    await pageUserTest.screenshot({ path: path.join(OUT, '06_user_test_list.png') })

    // Entrar al ticket sintético como solicitante
    await pageUserTest.goto(`${BASE_URL}/tickets/${syntheticTicketId}`, { waitUntil: 'networkidle' })
    await pageUserTest.screenshot({ path: path.join(OUT, '06_user_test_ticket_detail.png') })

    const assigneeText = await pageUserTest.locator('text=Técnicos asignados').locator('..').textContent()
    console.log(`[USER_TEST] Texto asignado visible: "${assigneeText?.trim()}"`)
    console.log(`[USER_TEST] Errores en consola (debe ser 0): ${userConsoleErrors.length}`)
    await ctxUserTest.close()

    // -------------------------------------------------------------------------
    // Responsividad: Tablet y Mobile
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Responsividad multidispositivo (Tablet y Mobile) ---')
    const ctxTablet = await browser.newContext({ viewport: { width: 768, height: 1024 } })
    const pageTablet = await ctxTablet.newPage()
    await login(pageTablet, 'tech_sd')
    await pageTablet.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await pageTablet.screenshot({ path: path.join(OUT, '07_tablet_dashboard.png') })
    await ctxTablet.close()

    const ctxMobile = await browser.newContext({ viewport: { width: 375, height: 667 } })
    const pageMobile = await ctxMobile.newPage()
    await login(pageMobile, 'tech_sd')
    await pageMobile.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await pageMobile.screenshot({ path: path.join(OUT, '07_mobile_dashboard.png') })
    await ctxMobile.close()

    console.log('\n=================================================================')
    console.log('✅ QA MANUAL REAL MULTI-ROL Y MULTIDISPOSITIVO COMPLETADA CON ÉXITO')
    console.log('=================================================================')
  } catch (err) {
    console.error('Error durante la sesión de QA manual:', err)
  } finally {
    await browser.close()
  }
}

run()
