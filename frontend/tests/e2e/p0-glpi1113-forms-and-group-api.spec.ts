import { createHmac } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { fixtureUrl } from './support/fixture-url'
import { resetFixtureTicket, runFixtureSql, runFixtureCommand } from './support/ticket-fixtures'

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

        // Verificar que los 8 formularios destacados NO vuelven a pedir categoría ITIL ni grupo técnico
        // (solo debe existir el selector de Urgencia)
        const visibleSelects = await page.locator('form select:visible').count()
        expect(visibleSelects, `El formulario ${form.name} no debe pedir categoría ni grupo técnico`).toBeLessThanOrEqual(1)

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

        // Verificar persistencia real en MariaDB: ID, categoría ITIL fija, EXACTAMENTE 1 asignación técnica (type=2) y grupo esperado
        const row = runFixtureSql(
          'mariadb',
          `SELECT t.id, t.itilcategories_id,
                  (SELECT COUNT(*) FROM glpi_groups_tickets gt2 WHERE gt2.tickets_id = t.id AND gt2.type = 2) AS grp_count,
                  COALESCE((SELECT gt3.groups_id FROM glpi_groups_tickets gt3 WHERE gt3.tickets_id = t.id AND gt3.type = 2 LIMIT 1), 0) AS grp_id
           FROM glpi_tickets t
           WHERE t.name = '${marker}'
           ORDER BY t.id DESC LIMIT 1;`,
        ).trim()

        expect(row, `No se encontró ticket creado para formulario ${form.name}`).toBeTruthy()
        const [ticketIdStr, catIdStr, grpCountStr, groupIdStr] = row.split(/\s+/)
        const ticketId = Number(ticketIdStr)
        expect(ticketId).toBeGreaterThan(0)
        expect(Number(catIdStr)).toBe(form.categoryId)
        expect(Number(grpCountStr), `Debe existir exactamente 1 asignación técnica en glpi_groups_tickets para ${form.name}`).toBe(1)
        expect(Number(groupIdStr)).toBe(form.groupId)

        // Verificar aparición posterior en Ticket Manager API y cola del grupo correcto
        const apiTicketRes = await request.get(`${API}/api/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        expect(apiTicketRes.status()).toBe(200)
        const apiTicket = await apiTicketRes.json()
        expect(apiTicket.title ?? apiTicket.name).toContain(marker)
        expect(apiTicket.groupId).toBe(form.groupId)
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

    // Verificar un registro NUEVO, INEQUÍVOCO Y ESPECÍFICO en glpi_logs generado por la API oficial de GLPI (Group_Ticket)
    // Sin condiciones permisivas como LIKE '%3%': debe ser específicamente vínculo de grupo (itemtype_link='Group' o search option 8)
    let specificLogRow = ''
    for (let attempt = 0; attempt < 10; attempt++) {
      specificLogRow = runFixtureSql(
        'mariadb',
        `SELECT id, itemtype, items_id, itemtype_link, id_search_option, linked_action, COALESCE(new_value, '')
         FROM glpi_logs
         WHERE id > ${maxLogIdBefore}
           AND itemtype = 'Ticket'
           AND items_id = ${ticketId}
           AND (itemtype_link = 'Group' OR id_search_option = 8)
         ORDER BY id DESC LIMIT 1;`,
      ).trim()
      if (specificLogRow) break
      await new Promise((r) => setTimeout(r, 500))
    }

    // 1. Verificación independiente de la persistencia en glpi_groups_tickets
    expect(Number(assignedGroup), 'El grupo 3 debe estar persistido en glpi_groups_tickets').toBe(3)

    // 2. Verificación independiente y estricta del registro de auditoría en glpi_logs
    expect(specificLogRow, 'Un grupo persistido sin registro nuevo de auditoría en glpi_logs es un fallo crítico').toBeTruthy()
    const [logId, logItemType, logItemsId, logLink, logSearchOpt, logAction, ...logValParts] = specificLogRow.split(/\s+/)
    const logNewValue = logValParts.join(' ')

    expect(Number(logId)).toBeGreaterThan(maxLogIdBefore)
    expect(logItemType).toBe('Ticket')
    expect(Number(logItemsId)).toBe(ticketId)
    // Correlación exacta: tipo de vínculo Group, opción de búsqueda 8 y acción vinculada 15
    expect(logLink).toBe('Group')
    expect(Number(logSearchOpt)).toBe(8)
    expect(Number(logAction)).toBe(15)
    // El valor registrado debe ser inequívocamente el grupo asignado (Service Desk / 3), sin dependencias circulares
    const containsServiceDeskOr3 = logNewValue.includes('Service Desk') || logNewValue.includes('(3)') || logNewValue === '3'
    expect(containsServiceDeskOr3, `El log de auditoría debe registrar inequívocamente 'Service Desk' o '(3)'. Valor registrado: '${logNewValue}'`).toBe(true)
  })

  test('procedimiento de backup y restauración real completa (mariadb-dump y pg_dump -Fc) en bases desechables H-20', async () => {
    test.setTimeout(120000)

    try {
      // 1. MariaDB: Backup completo de la base GLPI con mariadb-dump
      const originalTableCount = Number(
        runFixtureSql('mariadb', "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'glpi';").trim(),
      )
      const originalTicketsCount = Number(
        runFixtureSql('mariadb', 'SELECT COUNT(*) FROM glpi_tickets;').trim(),
      )
      const originalUsersCount = Number(
        runFixtureSql('mariadb', 'SELECT COUNT(*) FROM glpi_users;').trim(),
      )
      const originalCategoriesCount = Number(
        runFixtureSql('mariadb', 'SELECT COUNT(*) FROM glpi_itilcategories;').trim(),
      )
      expect(originalTableCount).toBeGreaterThan(50)
      expect(originalTicketsCount).toBeGreaterThan(0)
      expect(originalUsersCount).toBeGreaterThan(0)

      // Ejecutar mariadb-dump de la base completa glpi (--single-transaction --routines --triggers)
      runFixtureCommand('glpi-db', [
        'sh', '-c',
        'mariadb-dump -u e2e -p"$MARIADB_PASSWORD" --single-transaction --routines --triggers glpi > /tmp/qa_mariadb_full_backup.sql',
      ])

      // Calcular hash SHA-256 del archivo de dump MariaDB
      const mariaHashOutput = runFixtureCommand('glpi-db', ['sh', '-c', 'sha256sum /tmp/qa_mariadb_full_backup.sql']).trim()
      const mariaDumpHash = mariaHashOutput.split(/\s+/)[0]
      expect(mariaDumpHash).toMatch(/^[a-f0-9]{64}$/)

      // Crear base de datos temporal desechable independiente para restauración completa
      runFixtureCommand('glpi-db', [
        'sh', '-c',
        'mariadb -u root -p"$MARIADB_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS _qa_mariadb_restore_full; CREATE DATABASE _qa_mariadb_restore_full CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON _qa_mariadb_restore_full.* TO \'e2e\'@\'%\'; FLUSH PRIVILEGES;"',
      ])

      // Restaurar el backup completo en la base desechable
      runFixtureCommand('glpi-db', [
        'sh', '-c',
        'mariadb -u e2e -p"$MARIADB_PASSWORD" _qa_mariadb_restore_full < /tmp/qa_mariadb_full_backup.sql',
      ])

      // Verificar consistencia integral en la base restaurada
      const restoredTableCount = Number(
        runFixtureCommand('glpi-db', [
          'sh', '-c',
          "mariadb -u e2e -p\"$MARIADB_PASSWORD\" -N -e \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '_qa_mariadb_restore_full';\"",
        ]).trim(),
      )
      const restoredTicketsCount = Number(
        runFixtureCommand('glpi-db', [
          'sh', '-c',
          'mariadb -u e2e -p"$MARIADB_PASSWORD" -N -e "SELECT COUNT(*) FROM _qa_mariadb_restore_full.glpi_tickets;"',
        ]).trim(),
      )
      const restoredUsersCount = Number(
        runFixtureCommand('glpi-db', [
          'sh', '-c',
          'mariadb -u e2e -p"$MARIADB_PASSWORD" -N -e "SELECT COUNT(*) FROM _qa_mariadb_restore_full.glpi_users;"',
        ]).trim(),
      )
      const restoredCategoriesCount = Number(
        runFixtureCommand('glpi-db', [
          'sh', '-c',
          'mariadb -u e2e -p"$MARIADB_PASSWORD" -N -e "SELECT COUNT(*) FROM _qa_mariadb_restore_full.glpi_itilcategories;"',
        ]).trim(),
      )

      expect(restoredTableCount, 'Recuento de tablas de GLPI restauradas debe ser idéntico al original').toBe(originalTableCount)
      expect(restoredTicketsCount, 'Recuento de tickets restaurados debe coincidir exactamente').toBe(originalTicketsCount)
      expect(restoredUsersCount, 'Recuento de usuarios restaurados debe coincidir exactamente').toBe(originalUsersCount)
      expect(restoredCategoriesCount, 'Recuento de categorías restauradas debe coincidir exactamente').toBe(originalCategoriesCount)

      // 2. PostgreSQL: Backup binario pg_dump -Fc preservando bytes y restore con pg_restore
      const originalPgTablesCount = Number(
        runFixtureSql('postgres', "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';").trim(),
      )
      const originalSettingsCount = Number(
        runFixtureSql('postgres', 'SELECT COUNT(*) FROM app_settings;').trim(),
      )
      expect(originalPgTablesCount).toBeGreaterThan(0)

      // Generar dump binario preservando bytes
      runFixtureCommand('app-db', [
        'sh', '-c',
        'pg_dump -U e2e -Fc glpi_ticket_manager -f /tmp/qa_pg_full_backup.dump',
      ])

      // Calcular hash SHA-256 del dump binario de PostgreSQL
      const pgHashOutput = runFixtureCommand('app-db', ['sh', '-c', 'sha256sum /tmp/qa_pg_full_backup.dump']).trim()
      const pgDumpHash = pgHashOutput.split(/\s+/)[0]
      expect(pgDumpHash).toMatch(/^[a-f0-9]{64}$/)

      // Crear base temporal en PostgreSQL
      runFixtureSql('postgres', 'DROP DATABASE IF EXISTS _qa_pg_restore_test; CREATE DATABASE _qa_pg_restore_test;')

      // Restaurar con pg_restore en base desechable
      runFixtureCommand('app-db', [
        'sh', '-c',
        'pg_restore -U e2e -d _qa_pg_restore_test /tmp/qa_pg_full_backup.dump',
      ])

      // Verificar que las tablas Y LOS DATOS reales existen en la base restaurada
      const restoredPgTablesCount = Number(
        runFixtureCommand('app-db', [
          'sh', '-c',
          "psql -U e2e -d _qa_pg_restore_test -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\"",
        ]).trim(),
      )
      const restoredSettingsCount = Number(
        runFixtureCommand('app-db', [
          'sh', '-c',
          'psql -U e2e -d _qa_pg_restore_test -t -c "SELECT COUNT(*) FROM app_settings;"',
        ]).trim(),
      )

      expect(restoredPgTablesCount, 'Recuento de tablas de PostgreSQL debe ser idéntico al original').toBe(originalPgTablesCount)
      expect(restoredSettingsCount, 'Datos de configuración en app_settings deben estar restaurados').toBe(originalSettingsCount)
    } finally {
      // Limpieza segura en finally garantizada ante cualquier resultado
      try {
        runFixtureCommand('glpi-db', ['sh', '-c', 'mariadb -u root -p"$MARIADB_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS _qa_mariadb_restore_full;"'])
      } catch {}
      try {
        runFixtureCommand('glpi-db', ['rm', '-f', '/tmp/qa_mariadb_full_backup.sql'])
      } catch {}
      try {
        runFixtureSql('postgres', 'DROP DATABASE IF EXISTS _qa_pg_restore_test;')
      } catch {}
      try {
        runFixtureCommand('app-db', ['rm', '-f', '/tmp/qa_pg_full_backup.dump'])
      } catch {}
    }
  })
})
