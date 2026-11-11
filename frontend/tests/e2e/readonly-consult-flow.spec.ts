import { test, expect } from '@playwright/test'
import { resetFixtureTicket, runFixtureSql } from './support/ticket-fixtures'

const CLOSED_TICKET_ID = 9340
const RESOLVED_TICKET_ID = 85

test.describe('consulta de solo lectura en resueltos y cerrados', () => {
  test.beforeEach(() => {
    resetFixtureTicket(CLOSED_TICKET_ID, 'QA readonly closed ticket 9340')
    runFixtureSql(
      'mariadb',
      `UPDATE glpi_tickets SET status=6, solvedate=NOW(), closedate=NOW() WHERE id=${CLOSED_TICKET_ID};`,
    )
  })

  test('desktop y móvil: enlaces de consulta solo lectura en Kanban y Detail', async ({ page }) => {
    test.setTimeout(60000)

    // 1. Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')

    const resolvedCol = page.locator('[data-column-id="resolved"]')
    await expect(resolvedCol.getByText('Resuelto', { exact: true }).first()).toBeVisible()

    // Enlace en tarjeta o footer de la columna resueltos
    const readonlyLink = resolvedCol.getByRole('link', { name: /Ver detalle \(solo lectura\)/i }).first()
    await expect(readonlyLink).toBeVisible()

    // 2. Mobile Viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')

    // En móvil, activar columna de Resueltos si hay pestañas
    const mobileResolvedTab = page.getByRole('tab', { name: /Resuelto/i }).or(page.getByRole('button', { name: /Resuelto/i }))
    if (await mobileResolvedTab.isVisible()) {
      await mobileResolvedTab.click()
    }

    const mobileReadonlyLink = page.getByRole('link', { name: /Ver detalle \(solo lectura\)/i }).first()
    await expect(mobileReadonlyLink).toBeVisible()
    await mobileReadonlyLink.click()

    await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('permisos por rol y bloqueo de mutaciones en ticket cerrado', async ({ page, browser, request }) => {
    test.setTimeout(90000)

    const adminUsername = process.env.E2E_ADMIN_USERNAME
    const adminPassword = process.env.E2E_ADMIN_PASSWORD
    const requesterUsername = process.env.E2E_REQUESTER_USERNAME
    const requesterPassword = process.env.E2E_REQUESTER_PASSWORD

    // --- A. Técnico (tech1 por storageState por defecto) ---
    await page.goto(`/tickets/${CLOSED_TICKET_ID}`)
    await page.waitForLoadState('networkidle')

    // Banner de modo lectura presente para técnico
    const closedBanner = page.getByTestId('closed-readonly-banner')
    await expect(closedBanner).toBeVisible()
    await expect(closedBanner).toContainText('Ticket Cerrado (Modo lectura)')
    await expect(closedBanner).toContainText('No se admiten modificaciones ni reapertura por técnicos')

    // Técnico NO debe ver el botón de reabrir en ticket cerrado
    await expect(page.getByTestId('reopen-ticket-btn')).toHaveCount(0)

    // Todos los botones directos de estado deben estar deshabilitados
    const statusBtns = page.locator('[data-testid^="status-btn-"]')
    const count = await statusBtns.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      await expect(statusBtns.nth(i)).toBeDisabled()
    }

    // --- B. Excepción administrativa: Administrador (admin_test) ---
    if (adminUsername && adminPassword) {
      const adminContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      try {
        const adminPage = await adminContext.newPage()
        await adminPage.goto('/login')
        await adminPage.getByLabel('Usuario', { exact: true }).fill(adminUsername)
        await adminPage.getByLabel('Contraseña', { exact: true }).fill(adminPassword)
        await adminPage.getByRole('button', { name: 'Iniciar Sesión' }).click()
        await expect(adminPage).not.toHaveURL(/\/login/)

        await adminPage.goto(`/tickets/${CLOSED_TICKET_ID}`)
        await adminPage.waitForLoadState('networkidle')

        // Admin ve banner con mención a su facultad exclusiva de reapertura
        const adminClosedBanner = adminPage.getByTestId('closed-readonly-banner')
        await expect(adminClosedBanner).toBeVisible()
        await expect(adminClosedBanner).toContainText('facultad de reabrirlo formalmente')

        // Botones directos siguen deshabilitados (prohibición de salto directo)
        const adminStatusBtns = adminPage.locator('[data-testid^="status-btn-"]')
        const adminBtnCount = await adminStatusBtns.count()
        for (let i = 0; i < adminBtnCount; i++) {
          await expect(adminStatusBtns.nth(i)).toBeDisabled()
        }

        // Excepción: Admin SI dispone del botón Reabrir
        const adminReopenBtn = adminPage.getByTestId('reopen-ticket-btn')
        await expect(adminReopenBtn).toBeVisible()
      } finally {
        await adminContext.close()
      }
    }

    // --- C. Solicitante (user1): Vista estrictamente informativa ---
    if (requesterUsername && requesterPassword) {
      const reqContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      try {
        const reqPage = await reqContext.newPage()
        await reqPage.goto('/login')
        await reqPage.getByLabel('Usuario', { exact: true }).fill(requesterUsername)
        await reqPage.getByLabel('Contraseña', { exact: true }).fill(requesterPassword)
        await reqPage.getByRole('button', { name: 'Iniciar Sesión' }).click()
        await expect(reqPage).not.toHaveURL(/\/login/)

        await reqPage.goto(`/tickets/${CLOSED_TICKET_ID}`)
        await reqPage.waitForLoadState('networkidle')

        // Solicitante ve estado nativo y NUNCA ve la tarjeta 'Cambiar estado' ni botones
        await expect(reqPage.getByText('Estado del ticket en GLPI')).toBeVisible()
        await expect(reqPage.getByText('Cambiar estado')).toHaveCount(0)
        await expect(reqPage.getByTestId('reopen-ticket-btn')).toHaveCount(0)
      } finally {
        await reqContext.close()
      }
    }

    // --- D. Prohibición de mutaciones no autorizadas vía API ---
    // Intentar cambiar estado de ticket cerrado sin reapertura formal
    const patchRes = await request.patch(`/api/tickets/${CLOSED_TICKET_ID}/status`, {
      data: { status: 2 },
    })
    // Debe ser rechazado (403 Forbidden o 422 Unprocessable Entity)
    expect([403, 422]).toContain(patchRes.status())
  })
})
