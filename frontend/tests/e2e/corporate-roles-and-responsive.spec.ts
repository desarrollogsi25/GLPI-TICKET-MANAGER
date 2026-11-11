import { test, expect } from '@playwright/test'

test.describe('Roles corporativos, formularios y diseño responsive (H-20)', () => {
  const adminUsername = process.env.E2E_ADMIN_USERNAME || 'admin_test'
  const adminPassword = process.env.E2E_ADMIN_PASSWORD
  const supervisorUsername = process.env.E2E_SUPERVISOR_USERNAME || 'lider_dev'
  const supervisorPassword = process.env.E2E_SUPERVISOR_PASSWORD
  const techUsername = 'tech_dev'
  const techPassword = process.env.E2E_TECH_PASSWORD
  const requesterUsername = 'user_test'
  const requesterPassword = process.env.E2E_REQUESTER_PASSWORD

  test('permisos y límites de acceso según rol corporativo', async ({ browser }) => {
    test.setTimeout(90000)

    // 1. Administrador (admin_test): acceso global a Kanban y Métricas
    if (adminPassword) {
      const adminCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      try {
        const page = await adminCtx.newPage()
        await page.goto('/login')
        await page.getByLabel('Usuario', { exact: true }).fill(adminUsername)
        await page.getByLabel('Contraseña', { exact: true }).fill(adminPassword)
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
        await expect(page).not.toHaveURL(/\/login/)

        await page.goto('/kanban')
        await page.waitForLoadState('networkidle')
        await expect(page.getByTestId('kanban-column-queue')).toBeVisible()
      } finally {
        await adminCtx.close()
      }
    }

    // 2. Líder de Desarrollo / Supervisor (lider_dev): métricas de grupo y vista Kanban
    if (supervisorPassword) {
      const supCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      try {
        const page = await supCtx.newPage()
        await page.goto('/login')
        await page.getByLabel('Usuario', { exact: true }).fill(supervisorUsername)
        await page.getByLabel('Contraseña', { exact: true }).fill(supervisorPassword)
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
        await expect(page).not.toHaveURL(/\/login/)

        await page.goto('/kanban')
        await page.waitForLoadState('networkidle')
        await expect(page.getByTestId('kanban-column-queue')).toBeVisible()
      } finally {
        await supCtx.close()
      }
    }

    // 3. Técnico (tech_dev): acceso a cola de su grupo
    if (techPassword) {
      const techCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      try {
        const page = await techCtx.newPage()
        await page.goto('/login')
        await page.getByLabel('Usuario', { exact: true }).fill(techUsername)
        await page.getByLabel('Contraseña', { exact: true }).fill(techPassword)
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
        await expect(page).not.toHaveURL(/\/login/)

        await page.goto('/kanban')
        await page.waitForLoadState('networkidle')
        await expect(page.getByTestId('kanban-column-queue')).toBeVisible()
      } finally {
        await techCtx.close()
      }
    }

    // 4. Solicitante / Autoservicio (user_test): vista de tickets/servicios sin controles de operador
    if (requesterPassword) {
      const reqCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      try {
        const page = await reqCtx.newPage()
        await page.goto('/login')
        await page.getByLabel('Usuario', { exact: true }).fill(requesterUsername)
        await page.getByLabel('Contraseña', { exact: true }).fill(requesterPassword)
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
        await expect(page).not.toHaveURL(/\/login/)

        // Solicitante accede a /tickets sin controles de operador
        await page.goto('/tickets')
        await page.waitForLoadState('networkidle')
        await expect(page.getByText('Mis tickets').first()).toBeVisible()

        // Límite de acceso: intentar ir a /kanban redirige a /tickets
        await page.goto('/kanban')
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/\/tickets/)
      } finally {
        await reqCtx.close()
      }
    }
  })

  test('Catálogo de servicios y visualización de formularios', async ({ page }) => {
    test.setTimeout(60000)

    await page.goto('/services')
    await page.waitForLoadState('networkidle')

    // Verificar que el catálogo de servicios carga correctamente
    const serviceHeading = page.getByRole('heading', { name: /Servicios|Catálogo/i }).first()
    await expect(serviceHeading).toBeVisible()

    // Comprobar tarjetas de servicios destacados (8 servicios configurados)
    const cards = page.locator('[data-testid^="featured-service-card-"]')
    await expect(cards.first()).toBeVisible()
    await expect(cards).toHaveCount(8)
  })

  const viewports = [
    { name: '320px (móvil ultra-compacto)', width: 320, height: 568 },
    { name: '375px (iPhone SE)', width: 375, height: 667 },
    { name: '390px (iPhone 12/13/14)', width: 390, height: 844 },
    { name: '768px (iPad / Tablet)', width: 768, height: 1024 },
  ]

  for (const vp of viewports) {
    test(`responsive layout sin desbordamiento en ${vp.name}`, async ({ page }) => {
      test.setTimeout(45000)

      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/kanban')
      await page.waitForLoadState('networkidle')

      // Verificar que el contenedor principal respeta el ancho sin scrollbar horizontal accidental
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1
      })
      expect(hasHorizontalOverflow).toBeFalsy()

      // Verificar elementos principales accesibles
      await expect(page.locator('#main-content, main, [role="main"]').first()).toBeVisible()
    })
  }
})
