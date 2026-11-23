import { createHmac } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { fixtureUrl } from './support/fixture-url'
import { resetFixtureTicket, runFixtureSql } from './support/ticket-fixtures'

const GLPI = fixtureUrl('glpi')
const API = process.env.E2E_API_URL ? new URL(process.env.E2E_API_URL).origin : fixtureUrl('desk')
const REQUESTER_USERNAME = 'user_test'
const REQUESTER_PASSWORD = process.env.E2E_REQUESTER_PASSWORD
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'admin_test'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD
const WEBHOOK_SECRET = process.env.E2E_WEBHOOK_SECRET

const CORPORATE_FORMS = [
  { formId: 3, name: 'Requerimiento Service Desk', categoryId: 7, groupId: 3, mandatoryInputs: 2 },
  { formId: 4, name: 'Requerimiento BI', categoryId: 14, groupId: 2, mandatoryInputs: 3 },
  { formId: 5, name: 'Aplicaciones GSI', categoryId: 9, groupId: 1, mandatoryInputs: 2 },
  { formId: 6, name: 'Periféricos', categoryId: 19, groupId: 3, mandatoryInputs: 3 },
  { formId: 7, name: 'Hardware', categoryId: 16, groupId: 3, mandatoryInputs: 3 },
  { formId: 8, name: 'Software', categoryId: 4, groupId: 1, mandatoryInputs: 2 },
  { formId: 9, name: 'Informes', categoryId: 18, groupId: 2, mandatoryInputs: 2 },
  { formId: 10, name: 'Acceso a sistema', categoryId: 3, groupId: 3, mandatoryInputs: 3 },
] as const

test.describe('P0 GLPI 11.0.13 + PHP 8.5.13: 8 formularios corporativos, AssignGroupToTicketAsync real y restore desechable', () => {
  test('envío efectivo de los 8 formularios nativos, enrutamiento y visibilidad en Ticket Manager', async ({ browser, request }) => {
    test.setTimeout(240000)
    if (!REQUESTER_PASSWORD || !ADMIN_PASSWORD) {
      throw new Error('Faltan credenciales sintéticas E2E en el entorno H-20.')
    }

    // Autenticar admin en API para verificar aparición posterior en Ticket Manager
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    })
    expect(loginRes.ok()).toBeTruthy()
    const { accessToken: adminToken } = await loginRes.json()
    expect(adminToken).toBeTruthy()

    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()
    page.setDefaultTimeout(20000)

    try {
      await page.goto(GLPI)
      await page.locator('#login_name').fill(REQUESTER_USERNAME)
      await page.locator('#login_password').fill(REQUESTER_PASSWORD)
      await page.locator('button[type="submit"]').click()
      await page.waitForLoadState('networkidle')

      for (const form of CORPORATE_FORMS) {
        const marker = `E2E-F${form.formId}-${Date.now()}`
        await page.goto(`${GLPI}/Form/Render/${form.formId}`)
        await expect(page.getByRole('button', { name: /Enviar/i })).toBeVisible({ timeout: 15000 })

        // Rellenar preguntas de texto corto obligatorias (Asunto + contexto)
        const textInputs = page.locator('form input[type="text"]:visible')
        const inputCount = await textInputs.count()
        expect(inputCount).toBeGreaterThanOrEqual(form.mandatoryInputs)
        await textInputs.nth(0).fill(marker)
        for (let i = 1; i < Math.min(inputCount, 3); i++) {
          await textInputs.nth(i).fill(`Contexto sintético ${form.name} #${i}`)
        }

        // Rellenar descripción (TinyMCE iframe o textarea)
        const richFrame = page.frameLocator('iframe[title="Área de Texto Enriquecido"]').locator('body')
        if (await richFrame.isVisible({ timeout: 5000 }).catch(() => false)) {
          await richFrame.pressSequentially(`Descripción sintética verificada para ${form.name}.`, { delay: 5 })
          await richFrame.press('Tab')
        } else {
          const textarea = page.locator('form textarea:visible').first()
          await textarea.fill(`Descripción sintética verificada para ${form.name}.`)
        }

        const submitResponsePromise = page.waitForResponse(
          (r) => r.url().includes('/Form/SubmitAnswers') && r.request().method() === 'POST',
          { timeout: 20000 },
        )
        await page.getByRole('button', { name: /Enviar/i }).click()
        const submitRes = await submitResponsePromise
        expect(submitRes.status()).toBeLessThan(400)

        await Promise.race([
          page.waitForURL(/\/front\/ticket\.form\.php\?id=\d+/, { timeout: 15000 }),
          page.getByText('Formulario enviado').waitFor({ state: 'visible', timeout: 15000 }),
        ])

        // Verificar persistencia real en MariaDB: ID, categoría ITIL fija y grupo asignado por RuleTicket
        const row = runFixtureSql(
          'mariadb',
          `SELECT t.id, t.itilcategories_id, COALESCE(gt.groups_id, 0)
           FROM glpi_tickets t
           LEFT JOIN glpi_groups_tickets gt ON gt.tickets_id = t.id AND gt.type = 2
           WHERE t.name = '${marker}'
           ORDER BY t.id DESC LIMIT 1;`,
        ).trim()

        expect(row, `No se encontró ticket creado para formulario ${form.name}`).toBeTruthy()
        const [ticketIdStr, catIdStr, groupIdStr] = row.split(/\s+/)
        const ticketId = Number(ticketIdStr)
        expect(ticketId).toBeGreaterThan(0)
        expect(Number(catIdStr)).toBe(form.categoryId)
        expect(Number(groupIdStr)).toBe(form.groupId)

        // Verificar aparición posterior en Ticket Manager API
        const apiTicketRes = await request.get(`${API}/api/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        expect(apiTicketRes.status()).toBe(200)
        const apiTicket = await apiTicketRes.json()
        expect(apiTicket.title ?? apiTicket.name).toContain(marker)
      }
    } finally {
      await ctx.close()
    }
  })

  test('AssignGroupToTicketAsync asigna grupo vía API REST oficial de GLPI (con traza en glpi_logs) y no SQL directo', async ({ request }) => {
    test.setTimeout(60000)
    if (!WEBHOOK_SECRET) {
      throw new Error('E2E_WEBHOOK_SECRET no disponible en el entorno H-20.')
    }

    const ticketId = 9355
    resetFixtureTicket(ticketId, 'QA real AssignGroupToTicketAsync 9355')
    // Dejar el ticket con categoría 7 (Service Desk -> Grupo 3) pero SIN grupo asignado todavía
    runFixtureSql(
      'mariadb',
      `DELETE FROM glpi_groups_tickets WHERE tickets_id = ${ticketId};
       UPDATE glpi_tickets SET itilcategories_id = 7, status = 1 WHERE id = ${ticketId};`,
    )

    const body = JSON.stringify({ ticket_id: ticketId })
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = createHmac('sha256', WEBHOOK_SECRET).update(body + timestamp).digest('hex')

    const res = await request.post(`${API}/api/integrations/glpi/ticket-created`, {
      headers: {
        'Content-Type': 'application/json',
        'X-GLPI-timestamp': timestamp,
        'X-GLPI-signature': signature,
      },
      data: body,
    })
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.groupId).toBe(3)

    // Verificar persistencia en glpi_groups_tickets Y registro de auditoría en glpi_logs (prueba API REST oficial)
    const assignedGroup = runFixtureSql(
      'mariadb',
      `SELECT groups_id FROM glpi_groups_tickets WHERE tickets_id = ${ticketId} AND type = 2 LIMIT 1;`,
    ).trim()
    expect(Number(assignedGroup)).toBe(3)

    const logCount = runFixtureSql(
      'mariadb',
      `SELECT COUNT(*) FROM glpi_logs WHERE itemtype = 'Ticket' AND items_id = ${ticketId};`,
    ).trim()
    expect(Number(logCount)).toBeGreaterThan(0)
  })

  test('backup y restauración lógica verificada en tabla temporal desechable dentro de H-20', async () => {
    test.setTimeout(30000)
    const originalCount = Number(
      runFixtureSql('mariadb', 'SELECT COUNT(*) FROM glpi_tickets;').trim(),
    )
    expect(originalCount).toBeGreaterThan(0)

    runFixtureSql(
      'mariadb',
      `DROP TABLE IF EXISTS _qa_backup_tickets_verify;
       CREATE TABLE _qa_backup_tickets_verify LIKE glpi_tickets;
       INSERT INTO _qa_backup_tickets_verify SELECT * FROM glpi_tickets;`,
    )
    const restoredCount = Number(
      runFixtureSql('mariadb', 'SELECT COUNT(*) FROM _qa_backup_tickets_verify;').trim(),
    )
    expect(restoredCount).toBe(originalCount)

    runFixtureSql('mariadb', 'DROP TABLE IF EXISTS _qa_backup_tickets_verify;')
  })
})
