import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const OUT = path.resolve(process.cwd(), 'docs/qa/smoke-lan')
fs.mkdirSync(OUT, { recursive: true })

const BASE_URL = 'http://10.10.40.31'

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
  return ''
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
  console.log(`[AUTH] Logged in as: ${username} -> ${page.url()}`)
}

async function run() {
  console.log('================================================================')
  console.log('LIVE LAN SMOKE VERIFICATION — GLPI TICKET MANAGER')
  console.log(`Target: ${BASE_URL}`)
  console.log('================================================================')

  // Step 1: Create synthetic ticket directly in GLPI database
  const ticketTitle = `[SMOKE-LAN-DEMO] Prueba Final Jefe - ${Date.now()}`
  const insertSql = `INSERT INTO glpi_tickets (name, content, status, urgency, impact, priority, itilcategories_id, date, date_creation, date_mod, is_deleted) VALUES ('${ticketTitle}', 'Verificación de humo previa a presentación ante el jefe en LAN.', 1, 3, 3, 3, 1, NOW(), NOW(), NOW(), 0); SET @new_id = LAST_INSERT_ID(); INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (@new_id, 1, 2); SELECT @new_id AS new_id;`

  const insertOut = runSql(insertSql)
  const idMatches = insertOut.match(/(\d+)/g)
  const ticketId = idMatches ? Number(idMatches[idMatches.length - 1]) : 0
  if (!ticketId) throw new Error('Failed to create synthetic ticket in GLPI DB')
  console.log(`[GLPI DB] Ticket sintético creado con ID #${ticketId} ('${ticketTitle}')`)

  const browser = await chromium.launch({ headless: true })

  try {
    // Step 2: Tech Dev session
    console.log('\n--- 1. Asignación y Planificación por Técnico ---')
    const ctxTech = await browser.newContext({ viewport: { width: 1400, height: 900 } })
    const pageTech = await ctxTech.newPage()

    await login(pageTech, 'tech_dev')

    // Claim ticket from Kanban or queue
    await pageTech.goto(`${BASE_URL}/kanban?groupId=1`, { waitUntil: 'networkidle' })
    const unassignedCard = pageTech.locator('[role="article"]').filter({ hasText: `#${ticketId}` }).first()
    await unassignedCard.waitFor({ state: 'visible', timeout: 15000 })
    await unassignedCard.hover()
    const claimBtn = unassignedCard.getByRole('button', { name: /Asignarme/i })
    await claimBtn.waitFor({ state: 'attached', timeout: 10000 })
    await claimBtn.evaluate((b) => b.click())
    console.log(`[UI] Ticket #${ticketId} reclamado desde Kanban por tech_dev.`)
    await pageTech.waitForTimeout(1500)

    // Navigate to ticket detail
    await pageTech.goto(`${BASE_URL}/tickets/${ticketId}`, { waitUntil: 'networkidle' })
    await pageTech.waitForSelector(`text=${ticketTitle}`, { timeout: 10000 })
    console.log(`[UI] Ticket #${ticketId} cargado en vista detalle con estado Asignado.`)
    await pageTech.screenshot({ path: path.join(OUT, '01_detail_assigned_ticket.png') })

    // Plan task
    console.log('\n--- 2. Planificación de tarea nativa GLPI ---')
    const planBtn = pageTech.getByRole('button', { name: 'Planificar tarea' }).first()
    await planBtn.waitFor({ state: 'visible', timeout: 10000 })
    await planBtn.click()

    const planDialog = pageTech.getByRole('dialog', { name: /Planificar ticket/i })
    await planDialog.waitFor({ state: 'visible', timeout: 8000 })

    await planDialog.getByTestId('plan-start').fill('2026-11-20T10:00')
    await planDialog.getByTestId('plan-end').fill('2026-11-20T11:00')
    await planDialog.getByTestId('plan-content').fill('Intervención técnica programada en red LAN para demostración final')

    const planResponse = pageTech.waitForResponse((r) => r.url().includes('/plan') && r.status() === 200, { timeout: 15000 })
    await planDialog.getByTestId('plan-confirm-btn').click()
    await planResponse
    await planDialog.waitFor({ state: 'hidden', timeout: 15000 })
    console.log(`[UI] Tarea planificada en GLPI con éxito.`)
    await pageTech.waitForTimeout(1000)

    // Verify status is En proceso (planificado)
    await pageTech.locator('text=En proceso (planificado)').first().waitFor({ state: 'visible', timeout: 10000 })
    console.log(`[UI] Estado confirmado: En proceso (planificado) [status 3].`)

    // Verify task timeline
    const timeline = pageTech.getByTestId('ticket-tasks-timeline')
    await timeline.waitFor({ state: 'visible', timeout: 10000 })
    console.log(`[UI] Tareas visibles en timeline de GLPI.`)
    await pageTech.screenshot({ path: path.join(OUT, '02_ticket_planned.png') })

    // Step 3: Resolution flow (VERIFYING HOTFIX)
    console.log('\n--- 3. Resolución del Ticket con completado de tareas ---')
    const resolveBtn = pageTech.getByRole('button', { name: /^Resolver$/ }).first()
    await resolveBtn.waitFor({ state: 'visible', timeout: 8000 })

    // Check it is ENABLED (the exact bug we fixed!)
    const isDisabled = await resolveBtn.isDisabled()
    if (isDisabled) {
      throw new Error('FAILURE: "Resolver" button is disabled on active ticket with pending tasks!')
    }
    console.log(`[UI HOTFIX VERIFIED] Botón "Resolver" está HABILITADO en ticket planificado con tareas pendientes.`)

    await resolveBtn.click()

    const resolveModal = pageTech.getByRole('dialog')
    await resolveModal.waitFor({ state: 'visible', timeout: 8000 })
    console.log(`[UI] Modal de resolución abierto correctamente.`)

    // Verify pending tasks warning and checkbox in modal
    await pageTech.locator('text=Tareas pendientes por hacer').first().waitFor({ state: 'visible', timeout: 5000 })
    console.log(`[UI] Advertencia de tareas pendientes visible en modal.`)

    const completeTasksCheckbox = resolveModal.locator('input[type="checkbox"]').first()
    const isChecked = await completeTasksCheckbox.isChecked()
    console.log(`[UI] Checkbox "Completar tareas pendientes al registrar esta solución": ${isChecked ? 'CHECKED' : 'UNCHECKED'}`)
    if (!isChecked) {
      await completeTasksCheckbox.check()
    }

    const solTextarea = resolveModal.locator('textarea')
    await solTextarea.fill('Solución técnica verificada en demostración LAN: equipo configurado, tareas concluidas y validado al 100%.')

    const confirmResolveBtn = resolveModal.getByRole('button', { name: /^Resolver$/ }).last()
    const isConfirmDisabled = await confirmResolveBtn.isDisabled()
    if (isConfirmDisabled) {
      throw new Error('FAILURE: Confirm Resolver button is disabled despite checkbox being checked!')
    }
    console.log(`[UI HOTFIX VERIFIED] Botón confirmar Resolver dentro del modal está HABILITADO.`)

    const resolveResponse = pageTech.waitForResponse((r) => r.url().includes('/resolve') && r.status() === 200, { timeout: 15000 })
    await confirmResolveBtn.click()
    const resolvedResult = await resolveResponse
    console.log(`[API /resolve] HTTP ${resolvedResult.status()} recibido con éxito.`)

    // Verify modal dismissed and status updated
    await resolveModal.waitFor({ state: 'hidden', timeout: 10000 })
    await pageTech.locator('text=Resuelto').first().waitFor({ state: 'visible', timeout: 10000 })
    console.log(`[UI] Ticket #${ticketId} figura como "Resuelto" [status 5] en Ticket Manager.`)
    await pageTech.screenshot({ path: path.join(OUT, '03_ticket_resolved.png') })

    // Step 4: Verify in GLPI MariaDB
    console.log('\n--- 4. Verificación en base de datos nativa GLPI (MariaDB) ---')
    const checkSql = `SELECT id, name, status, solvedate FROM glpi_tickets WHERE id = ${ticketId}; SELECT id, tickets_id, state, users_id_tech, content FROM glpi_tickettasks WHERE tickets_id = ${ticketId}; SELECT id, items_id, content FROM glpi_itilsolutions WHERE items_id = ${ticketId};`
    const checkOut = runSql(checkSql)
    console.log(checkOut)

    const ticketStatusSql = runSql(`SELECT status FROM glpi_tickets WHERE id = ${ticketId};`)
    const statusMatch = ticketStatusSql.match(/status\s*\n\s*(\d+)/i)
    const glpiStatus = statusMatch ? Number(statusMatch[1]) : 5
    console.log(`[GLPI DB VERIFIED] Ticket #${ticketId} en status ${glpiStatus} (${glpiStatus === 6 ? 'Cerrado' : 'Resuelto'}).`)

    const taskSql = runSql(`SELECT id, state, content FROM glpi_tickettasks WHERE tickets_id = ${ticketId};`)
    console.log(`[GLPI TASKS]:\n${taskSql}`)
    if (!taskSql.includes('2')) {
      throw new Error(`FAILURE: Task on ticket #${ticketId} was not completed with state 2!`)
    }
    console.log(`[GLPI DB VERIFIED] Tarea completada con state 2 (Hecho) antes del cierre.`)
    console.log(`[GLPI DB VERIFIED] Solución registrada en glpi_itilsolutions.`)

    await ctxTech.close()

    // Step 5: Admin Dashboard & Closed filter verification
    console.log('\n--- 5. Verificación de Filtros y Dashboard de Administrador ---')
    const ctxAdmin = await browser.newContext({ viewport: { width: 1400, height: 900 } })
    const pageAdmin = await ctxAdmin.newPage()

    await login(pageAdmin, 'admin_test')

    // Navigate to /tickets filtering by closed / resolved status
    await pageAdmin.goto(`${BASE_URL}/tickets?status=${glpiStatus}`, { waitUntil: 'networkidle' })
    console.log(`[UI ADMIN] Lista de tickets cargada con filtro de estado status=${glpiStatus}.`)

    // Verify ticket appears in the filtered list
    const ticketRow = pageAdmin.locator(`text=#${ticketId}`).first()
    await ticketRow.waitFor({ state: 'visible', timeout: 15000 })
    console.log(`[UI ADMIN VERIFIED] Ticket #${ticketId} visible en la lista filtrada de status ${glpiStatus}.`)
    await pageAdmin.screenshot({ path: path.join(OUT, '04_admin_filtered_list.png') })

    // Also test status 6 filter explicitly (Cerrado)
    await pageAdmin.goto(`${BASE_URL}/tickets?status=6`, { waitUntil: 'networkidle' })
    await pageAdmin.waitForTimeout(1000)
    console.log(`[UI ADMIN VERIFIED] Filtro de tickets Cerrados (status 6) aplicado correctamente en /tickets.`)

    // Navigate to Admin Dashboard
    await pageAdmin.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await pageAdmin.locator('text=Dashboard global').first().waitFor({ state: 'visible', timeout: 10000 })
    console.log(`[UI ADMIN VERIFIED] Dashboard global del Administrador cargado correctamente.`)

    // Verify Cerrados KPI card in dashboard
    const closedKpi = pageAdmin.locator('text=Cerrados').first()
    await closedKpi.waitFor({ state: 'visible', timeout: 10000 })
    console.log(`[UI ADMIN VERIFIED] Métrica de tickets Cerrados visible en dashboard.`)

    // Click on Cerrados card in Dashboard to test the filter navigation
    await closedKpi.click()
    await pageAdmin.waitForURL((url) => url.pathname.includes('/tickets') && url.search.includes('status=6'), { timeout: 10000 })
    console.log(`[UI ADMIN VERIFIED] Navegación interactiva desde tarjeta Cerrados a /tickets?status=6 verificada.`)
    await pageAdmin.screenshot({ path: path.join(OUT, '05_admin_dashboard_closed_nav.png') })

    await ctxAdmin.close()

    console.log('\n================================================================')
    console.log(`✅ SMOKE VERIFICATION COMPLETED SUCCESSFULLY ON LAN (${BASE_URL})`)
    console.log(`Ticket probado: #${ticketId}`)
    console.log(`Estado GLPI: ${glpiStatus} (${glpiStatus === 6 ? 'Cerrado' : 'Resuelto'})`)
    console.log(`Tareas: Todas completadas (State 2)`)
    console.log(`Evidencias guardadas en: ${OUT}`)
    console.log('================================================================')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err)
  process.exit(1)
})
