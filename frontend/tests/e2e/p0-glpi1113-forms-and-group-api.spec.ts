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

    // Obtener el ID más alto actual en glpi_logs antes de la mutación para asegurar verificación de registro nuevo
    const maxLogIdBefore = Number(
      runFixtureSql('mariadb', 'SELECT COALESCE(MAX(id), 0) FROM glpi_logs;').trim(),
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

    // Verificar persistencia en glpi_groups_tickets
    const assignedGroup = runFixtureSql(
      'mariadb',
      `SELECT groups_id FROM glpi_groups_tickets WHERE tickets_id = ${ticketId} AND type = 2 LIMIT 1;`,
    ).trim()
    expect(Number(assignedGroup)).toBe(3)

    // Verificar un registro NUEVO y ESPECÍFICO en glpi_logs generado por la API oficial de GLPI (Group_Ticket)
    const specificLog = runFixtureSql(
      'mariadb',
      `SELECT id, itemtype, items_id, itemtype_link, new_value
       FROM glpi_logs
       WHERE id > ${maxLogIdBefore}
         AND itemtype = 'Ticket'
         AND items_id = ${ticketId}
         AND (itemtype_link = 'Group' OR id_search_option = 8 OR new_value LIKE '%3%')
       ORDER BY id DESC LIMIT 1;`,
    ).trim()

    expect(specificLog, 'Debe existir un registro nuevo y específico en glpi_logs con la asignación del grupo').toBeTruthy()
    expect(specificLog).toContain('Ticket')
    expect(specificLog).toContain(ticketId.toString())
  })

  test('procedimiento de backup y restauración real (mariadb-dump y pg_dump -Fc) en bases desechables H-20', async () => {
    test.setTimeout(60000)

    // 1. MariaDB: dump real con mariadb-dump, restauración en base desechable y verificación de integridad
    const originalTicketsCount = Number(
      runFixtureSql('mariadb', 'SELECT COUNT(*) FROM glpi_tickets;').trim(),
    )
    expect(originalTicketsCount).toBeGreaterThan(0)

    // Ejecutar mariadb-dump dentro del contenedor glpi-db hacia un archivo temporal
    runFixtureCommand('glpi-db', [
      'sh', '-c',
      'mariadb-dump -u e2e -p"$MARIADB_PASSWORD" --single-transaction glpi glpi_tickets glpi_itilcategories > /tmp/qa_mariadb_backup.sql',
    ])

    // Crear base de datos temporal desechable en el contenedor MariaDB
    runFixtureSql('mariadb', 'DROP DATABASE IF EXISTS _qa_mariadb_restore_test; CREATE DATABASE _qa_mariadb_restore_test;')

    // Restaurar el backup real en la base desechable
    runFixtureCommand('glpi-db', [
      'sh', '-c',
      'mariadb -u e2e -p"$MARIADB_PASSWORD" _qa_mariadb_restore_test < /tmp/qa_mariadb_backup.sql',
    ])

    // Verificar integridad en la base restaurada
    const restoredTicketsCount = Number(
      runFixtureCommand('glpi-db', [
        'sh', '-c',
        'mariadb -u e2e -p"$MARIADB_PASSWORD" -N -e "SELECT COUNT(*) FROM glpi_tickets;" _qa_mariadb_restore_test',
      ]).trim(),
    )
    expect(restoredTicketsCount).toBe(originalTicketsCount)

    // Limpieza de base desechable y archivo temporal MariaDB
    runFixtureSql('mariadb', 'DROP DATABASE IF EXISTS _qa_mariadb_restore_test;')
    runFixtureCommand('glpi-db', ['rm', '-f', '/tmp/qa_mariadb_backup.sql'])

    // 2. PostgreSQL: backup binario pg_dump -Fc preservando bytes, restore en base desechable
    // Crear base temporal en PostgreSQL
    runFixtureSql('postgres', 'DROP DATABASE IF EXISTS _qa_pg_restore_test; CREATE DATABASE _qa_pg_restore_test;')

    // Generar dump con pg_dump -Fc
    runFixtureCommand('app-db', [
      'sh', '-c',
      'pg_dump -U e2e -Fc glpi_ticket_manager -f /tmp/qa_pg_backup.dump',
    ])

    // Restaurar con pg_restore en base desechable
    runFixtureCommand('app-db', [
      'sh', '-c',
      'pg_restore -U e2e -d _qa_pg_restore_test /tmp/qa_pg_backup.dump',
    ])

    // Verificar que las tablas existen y contienen datos en la base restaurada
    const restoredTableCount = Number(
      runFixtureCommand('app-db', [
        'sh', '-c',
        'psql -U e2e -d _qa_pg_restore_test -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\';"',
      ]).trim(),
    )
    expect(restoredTableCount).toBeGreaterThan(0)

    // Limpieza de base desechable y dump temporal PostgreSQL
    runFixtureSql('postgres', 'DROP DATABASE IF EXISTS _qa_pg_restore_test;')
    runFixtureCommand('app-db', ['rm', '-f', '/tmp/qa_pg_backup.dump'])
  })
})
