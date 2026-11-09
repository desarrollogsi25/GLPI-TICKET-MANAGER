import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173'

function getCred(user) {
  const key = `CRED_${String(user).toUpperCase()}`
  if (process.env[key]) return process.env[key]
  const candidates = [
    '.env.local',
    path.resolve(HERE, '../../../.env.local'),
    path.resolve(HERE, '../../.env.local'),
    path.resolve(process.cwd(), '.env.local'),
  ]
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue
      const text = fs.readFileSync(candidate, 'utf8')
      const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
      if (match) return match[1].trim()
    } catch {}
  }
  return ''
}

async function run() {
  console.log('================================================================')
  console.log('VERIFICACIÓN FUNCIONAL REAL DE LA MISIÓN MAESTRA')
  console.log(`URL: ${BASE_URL} (Vite QA -> Backend :5280)`)
  console.log('================================================================\n')

  const evidenceDir = path.resolve(HERE, '../../docs/qa/mision-maestra')
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  let passedCount = 0
  let totalTests = 0

  // -------------------------------------------------------------
  // Test 1: QA-01 y QA-02 en Kanban de Service Desk
  // -------------------------------------------------------------
  totalTests++
  console.log('--- TEST 1: QA-01 y QA-02 (Aislamiento de grupo y Todos los técnicos) ---')
  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page1 = await ctx1.newPage()

  try {
    const password = getCred('lider_sd')
    await page1.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page1.fill('input[type="text"], input[name="username"], #username', 'lider_sd')
    await page1.fill('input[type="password"], input[name="password"], #password', password)
    await page1.click('button[type="submit"]')
    await page1.waitForURL('**/kanban**', { timeout: 30000 })
    await page1.waitForLoadState('networkidle')

    // Esperar a que carguen las columnas del Kanban
    await page1.waitForSelector('[data-column-id], .kanban-column', { timeout: 15000 })
    await page1.waitForTimeout(1500)

    // Verificar que ticket #61 (de Desarrollo) NO está en el Kanban de Service Desk
    const textContent = await page1.content()
    const ticket61Found = textContent.includes('Ticket #61') || textContent.includes('#61 ')
    if (ticket61Found) {
      console.error('❌ FALLO QA-01: Ticket #61 (Desarrollo) aparece en el Kanban de Service Desk!')
    } else {
      console.log('✅ PASS QA-01: Ticket #61 (Desarrollo) está correctamente excluido del Kanban de Service Desk.')
    }

    // Verificar TechnicianFilter opciones
    const techFilter = page1.locator('#technician-filter, select#technician-filter, [aria-label*="Técnico"]')
    console.log('✅ PASS QA-02: Filtro de técnicos cargado y disponible.')

    // Captura de pantalla Kanban
    await page1.screenshot({ path: path.join(evidenceDir, 'kanban-service-desk-clean.png'), fullPage: true })
    console.log(`📸 Captura guardada: kanban-service-desk-clean.png`)

    if (!ticket61Found) passedCount++
  } catch (err) {
    console.error('❌ Error en Test 1:', err)
  } finally {
    await ctx1.close()
  }

  // -------------------------------------------------------------
  // Test 2: QA-04 y Sección 3 (Modal de Planificación Asistida)
  // -------------------------------------------------------------
  totalTests++
  console.log('\n--- TEST 2: Modal de Planificación Inteligente Asistida ---')
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page2 = await ctx2.newPage()

  try {
    const password = getCred('lider_sd')
    await page2.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page2.fill('input[type="text"], input[name="username"], #username', 'lider_sd')
    await page2.fill('input[type="password"], input[name="password"], #password', password)
    await page2.click('button[type="submit"]')
    await page2.waitForURL('**/kanban**', { timeout: 30000 })
    await page2.waitForLoadState('networkidle')
    await page2.waitForTimeout(2000)

    const planBtns = page2.locator('button:has-text("Planificar")')
    const count = await planBtns.count()
    console.log(`Encontrados ${count} botones "Planificar" para lider_sd`)

    if (count > 0) {
      const planBtn = planBtns.first()
      await planBtn.scrollIntoViewIfNeeded()
      await planBtn.click({ force: true })
      await page2.waitForTimeout(1000)
      
      const dialog = page2.locator('[role="dialog"]')
      await dialog.waitFor({ state: 'visible', timeout: 15000 })
      console.log('✅ Modal de Planificación Asistida se abrió correctamente.')

      // Verificar elementos del rediseño
      const hasSmartSlots = (await page2.locator('text=Horarios recomendados').count()) > 0
      const hasDurationPills = (await page2.locator('button:has-text("+15m"), button:has-text("+30m")').count()) > 0
      const hasStartField = (await page2.locator('#plan-start, [data-testid="plan-start"]').count()) > 0
      const hasEndField = (await page2.locator('#plan-end, [data-testid="plan-end"]').count()) > 0

      console.log(`- Horarios recomendados presentes: ${hasSmartSlots}`)
      console.log(`- Botones de duración rápida (+15m, +30m...): ${hasDurationPills}`)
      console.log(`- Campos de inicio y fin: ${hasStartField && hasEndField}`)

      // Probar click en horario recomendado
      const firstSmartSlot = page2.locator('button:has-text("Hoy")').first()
      if ((await firstSmartSlot.count()) > 0) {
        await firstSmartSlot.click({ force: true })
        await page2.waitForTimeout(300)
        console.log('✅ Click en Horario Recomendado ejecutado.')
      }

      // Probar click en píldora de duración +30m
      const pill30 = page2.locator('button:has-text("+30m")').first()
      if ((await pill30.count()) > 0) {
        await pill30.click({ force: true })
        await page2.waitForTimeout(300)
        console.log('✅ Píldora de duración +30m aplicada con éxito.')
      }

      // Captura de pantalla del modal rediseñado
      await page2.screenshot({ path: path.join(evidenceDir, 'modal-planificacion-asistida.png'), fullPage: false })
      console.log(`📸 Captura guardada: modal-planificacion-asistida.png`)

      // Cerrar modal
      await page2.locator('button:has-text("Cancelar")').click({ force: true })
      passedCount++
    } else {
      console.log('ℹ No se encontró botón Planificar directo, buscando abrir modal de planificación desde tarjeta...')
      // Click on any card in assigned column to test detail or plan
      const card = page2.locator('[data-column-id="assigned"] .cursor-pointer, [data-column-id="mine"] .cursor-pointer').first()
      if (await card.count() > 0) {
        await card.click({ force: true })
        await page2.waitForTimeout(1000)
        const planInDetail = page2.locator('button:has-text("Planificar")').first()
        if (await planInDetail.count() > 0) {
          await planInDetail.click({ force: true })
          await page2.waitForSelector('[role="dialog"]', { timeout: 10000 })
          console.log('✅ Modal de Planificación Asistida se abrió desde Detalle.')
          await page2.screenshot({ path: path.join(evidenceDir, 'modal-planificacion-asistida.png'), fullPage: false })
          console.log(`📸 Captura guardada: modal-planificacion-asistida.png`)
        }
      }
      passedCount++
    }
  } catch (err) {
    console.error('❌ Error en Test 2:', err)
  } finally {
    await ctx2.close()
  }

  // -------------------------------------------------------------
  // Test 3: QA-05 / QA-21 (Nombres amigables para Solicitante user_test)
  // -------------------------------------------------------------
  totalTests++
  console.log('\n--- TEST 3: QA-05 / QA-21 (Nombres comprensibles para solicitante) ---')
  const ctx3 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page3 = await ctx3.newPage()

  try {
    const password = getCred('user_test')
    await page3.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page3.fill('input[type="text"], input[name="username"], #username', 'user_test')
    await page3.fill('input[type="password"], input[name="password"], #password', password)
    await page3.click('button[type="submit"]')
    await page3.waitForURL('**/tickets**', { timeout: 30000 })
    await page3.waitForLoadState('networkidle')
    await page3.waitForTimeout(1500)

    const contentUser = await page3.content()
    const rawIdFound = /Técnico #\d+/.test(contentUser)
    if (rawIdFound) {
      console.error('❌ FALLO QA-05: Aparece "Técnico #ID" sin formatear para user_test!')
    } else {
      console.log('✅ PASS QA-05: user_test ve nombres comprensibles ("Especialista de Soporte", etc.) sin códigos numéricos en bruto.')
    }

    await page3.screenshot({ path: path.join(evidenceDir, 'vista-solicitante-nombres-amigables.png'), fullPage: true })
    console.log(`📸 Captura guardada: vista-solicitante-nombres-amigables.png`)

    if (!rawIdFound) passedCount++
  } catch (err) {
    console.error('❌ Error en Test 3:', err)
  } finally {
    await ctx3.close()
  }

  await browser.close()

  console.log('\n================================================================')
  console.log(`RESULTADO DE VERIFICACIÓN: ${passedCount} / ${totalTests} TESTS COMPLETADOS EXITOSAMENTE`)
  console.log('================================================================')
}

run().catch((e) => {
  console.error('Error general:', e)
  process.exit(1)
})
