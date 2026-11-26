import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fixtureUrl } from './support/fixture-url'

const CAPTURE_SCREENSHOTS = process.env.CAPTURE_REDESIGN_SCREENSHOTS === '1'
const SCREENSHOT_DIR = resolve(process.cwd(), '../docs/qa/redesign-ux-ui-20261125/screenshots')

if (CAPTURE_SCREENSHOTS) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function maybeCapture(page: Page, filename: string, fullPage = false) {
  if (!CAPTURE_SCREENSHOTS) return
  await page.waitForTimeout(500)
  await page.screenshot({
    path: resolve(SCREENSHOT_DIR, filename),
    fullPage,
  })
}

async function runWcag22Check(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  if (results.violations.length > 0) {
    console.log(`\n=== WCAG 2.2 AA violations on ${label} ===`)
    for (const v of results.violations) {
      console.log(`[${v.impact}] ${v.id}: ${v.help}`)
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`  → ${node.target.join(', ')}`)
      }
    }
  }
  expect(results.violations).toEqual([])
}

test.describe('Rediseño UX/UI Enterprise Precision — QA Funcional, Responsive y WCAG 2.2 AA', () => {
  test('Login: diseño corporativo, toggle mostrar/ocultar contraseña y WCAG 2.2 AA', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
      viewport: { width: 1440, height: 900 },
    })
    const page = await ctx.newPage()
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    try {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('GSI Service Desk').first()).toBeVisible()
      const passwordInput = page.locator('#password')
      await expect(passwordInput).toHaveAttribute('type', 'password')

      const toggleBtn = page.getByRole('button', { name: 'Mostrar contraseña' })
      await expect(toggleBtn).toBeVisible()
      await toggleBtn.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')

      await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
      await expect(passwordInput).toHaveAttribute('type', 'password')

      await runWcag22Check(page, '/login (light)')
      await maybeCapture(page, '01_login_desktop.png')

      expect(consoleErrors).toEqual([])
    } finally {
      await ctx.close()
    }
  })

  test('Nuevas funcionalidades UX: tabla ordenable, cola navegable, stepper de detalle y filtro de catálogo', async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    })
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    const ensureLight = async () => {
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark')
        document.documentElement.setAttribute('data-theme', 'light')
      })
    }

    // 1. Kanban light
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    await expect(page.getByTestId('kanban-column-queue')).toBeVisible()
    await maybeCapture(page, '02_kanban_desktop_light.png')

    // 2. Cola de grupo: búsqueda inline, filtro de prioridad y enlace directo al detalle
    await page.goto('/queue')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    const queueSearch = page.getByLabel('Buscar en la cola del grupo')
    await expect(queueSearch).toBeVisible()
    await expect(page.getByLabel('Filtrar cola por prioridad')).toBeVisible()
    await maybeCapture(page, '04_queue_desktop.png')

    // 3. Tabla de tickets: columna Tipo, encabezados ordenables (aria-sort) y paginación enriquecida
    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    await expect(page.getByRole('columnheader', { name: 'Tipo' })).toBeVisible()
    const priorityHeader = page.getByRole('columnheader', { name: /Prioridad/i })
    await expect(priorityHeader).toHaveAttribute('aria-sort', 'none')
    await priorityHeader.getByRole('button').click()
    await expect(priorityHeader).toHaveAttribute('aria-sort', 'descending')
    await expect(page.getByText(/Mostrando \d+/)).toBeVisible()
    await maybeCapture(page, '05_tickets_table_desktop.png')

    // 4. Detalle de ticket: TicketStatusStepper + enlace volver + metadatos
    await page.goto('/tickets/11')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    const stepper = page.getByTestId('ticket-status-stepper')
    await expect(stepper).toBeVisible()
    await expect(stepper.getByRole('listitem')).toHaveCount(5)
    await expect(page.getByRole('link', { name: /Volver a tickets/i })).toBeVisible()
    await maybeCapture(page, '06_ticket_detail_stepper_desktop.png', true)

    // 5. Dashboard light
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    await expect(page.getByText('Tickets en la cola')).toBeVisible()
    await expect(page.getByText('Distribución por Estado')).toBeVisible()
    await maybeCapture(page, '07_dashboard_desktop.png', true)

    // 6. Catálogo de servicios: filtro interactivo del árbol ITIL
    await page.goto('/services')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    const catalogSearch = page.getByLabel('Filtrar categoría ITIL')
    await expect(catalogSearch).toBeVisible()
    await maybeCapture(page, '08_services_desktop.png', true)
    await catalogSearch.fill('Acceso')
    await expect(page.getByText('Acceso a sistema').first()).toBeVisible()
    await catalogSearch.fill('')

    expect(consoleErrors).toEqual([])
  })

  test('Dark Mode: WCAG 2.2 AA en pantallas principales y capturas visuales', async ({ page }) => {
    test.setTimeout(120000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    })

    const pagesToAudit = [
      { path: '/kanban', shot: '03_kanban_desktop_dark.png', fullPage: false },
      { path: '/tickets', shot: null, fullPage: false },
      { path: '/tickets/11', shot: null, fullPage: false },
      { path: '/queue', shot: null, fullPage: false },
      { path: '/dashboard', shot: null, fullPage: false },
      { path: '/services', shot: null, fullPage: false },
      { path: '/preferences', shot: null, fullPage: false },
      { path: '/ayuda', shot: null, fullPage: false },
    ] as const

    for (const entry of pagesToAudit) {
      await page.goto(entry.path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(350)
      // Asegurar clase dark aplicada incluso si la preferencia del usuario en API es light
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
        document.documentElement.setAttribute('data-theme', 'dark')
      })
      await runWcag22Check(page, `${entry.path} (dark)`)
      if (entry.shot) {
        await maybeCapture(page, entry.shot, entry.fullPage)
      }
    }
  })

  const MATRIX_VIEWPORTS = [
    { name: '320px', width: 320, height: 568 },
    { name: '375px', width: 375, height: 812 },
    { name: '768px', width: 768, height: 1024 },
    { name: '1024px', width: 1024, height: 768 },
    { name: '1366px', width: 1366, height: 768 },
    { name: '1440px', width: 1440, height: 900 },
  ] as const

  const MATRIX_ROUTES = ['/kanban', '/tickets', '/queue', '/dashboard', '/services', '/tickets/11'] as const

  test('Matriz responsive completa (320/375/768/1024/1366/1440) sin desbordamiento horizontal', async ({ page }) => {
    test.setTimeout(180000)
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    for (const vp of MATRIX_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      for (const route of MATRIX_ROUTES) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(200)

        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }))
        expect(
          overflow.scrollWidth,
          `Horizontal overflow on ${route} at ${vp.name}: scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth}`,
        ).toBeLessThanOrEqual(overflow.innerWidth + 1)

        await expect(page.locator('#main-content, main').first()).toBeVisible()

        if (vp.width === 375 && route === '/tickets') {
          await maybeCapture(page, '09_mobile_375_tickets.png')
        }
        if (vp.width === 375 && route === '/tickets/11') {
          await maybeCapture(page, '10_mobile_375_detail.png', true)
        }
      }
    }

    expect(consoleErrors).toEqual([])
  })

  test('GLPI 11 nativo: formulario inteligente #3 con guía rápida, ayudas contextuales y urgencia Media por defecto', async ({ browser }) => {
    test.setTimeout(60000)
    const glpiUrl = fixtureUrl('glpi')
    const requesterPassword = process.env.E2E_REQUESTER_PASSWORD
    if (!requesterPassword) {
      throw new Error('Falta E2E_REQUESTER_PASSWORD en el fixture H-20.')
    }

    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
      viewport: { width: 1440, height: 900 },
    })
    const page = await ctx.newPage()

    try {
      await page.goto(glpiUrl)
      await page.locator('#login_name').fill('user_test')
      await page.locator('#login_password').fill(requesterPassword)
      await page.locator('button[type="submit"]').click()
      await page.waitForLoadState('networkidle')
      await maybeCapture(page, '18_glpi_native_portal_home.png', true)

      await page.goto(`${glpiUrl}/Form/Render/3`)
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Guía rápida:')).toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/Resumen claro de tu requerimiento/i)).toBeVisible()

      // Verificar que el campo Urgencia tiene preseleccionada "Media" (valor 3) en lugar de "-----"
      const urgencySelect = page.locator('select[name*="answers"]').first()
      await expect(urgencySelect).toHaveValue('3')

      await maybeCapture(page, '11_glpi_native_form3_enhanced.png', true)
    } finally {
      await ctx.close()
    }
  })

  test('Auditoría por rol (Solicitante, Supervisor, Admin): vistas, WCAG 2.2 AA y autorización backend 403', async ({ browser, request }) => {
    test.setTimeout(150000)
    const apiUrl = process.env.E2E_API_URL ? new URL(process.env.E2E_API_URL).origin : fixtureUrl('desk')
    const requesterPassword = process.env.E2E_REQUESTER_PASSWORD
    const supervisorPassword = process.env.E2E_SUPERVISOR_PASSWORD
    const adminPassword = process.env.E2E_ADMIN_PASSWORD
    const techPassword = process.env.E2E_TECH_PASSWORD
    if (!requesterPassword || !supervisorPassword || !adminPassword || !techPassword) {
      throw new Error('Faltan credenciales sintéticas E2E en el fixture H-20.')
    }

    const loginToken = async (username: string, password: string) => {
      const res = await request.post(`${apiUrl}/api/auth/login`, { data: { username, password } })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      return body.accessToken as string
    }

    // 1. Verificación estricta de autorización en backend (no solo ocultar botones)
    const [reqToken, techToken, supToken, adminToken] = await Promise.all([
      loginToken('user_test', requesterPassword),
      loginToken('tech_dev', techPassword),
      loginToken('lider_dev', supervisorPassword),
      loginToken('admin_test', adminPassword),
    ])

    // Solicitante bloqueado en endpoints operativos/administrativos
    expect((await request.get(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${reqToken}` } })).status()).toBe(403)
    expect((await request.get(`${apiUrl}/api/groups/1/dashboard`, { headers: { Authorization: `Bearer ${reqToken}` } })).status()).toBe(403)
    expect((await request.get(`${apiUrl}/api/tickets/technicians`, { headers: { Authorization: `Bearer ${reqToken}` } })).status()).toBe(403)

    // Técnico bloqueado en endpoints de supervisor y admin
    expect((await request.get(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${techToken}` } })).status()).toBe(403)
    expect((await request.get(`${apiUrl}/api/groups/1/dashboard`, { headers: { Authorization: `Bearer ${techToken}` } })).status()).toBe(403)

    // Supervisor de Desarrollo (grupo 1): permitido en grupo 1, bloqueado en admin y en grupo ajeno BI (grupo 2)
    expect((await request.get(`${apiUrl}/api/groups/1/dashboard`, { headers: { Authorization: `Bearer ${supToken}` } })).status()).toBe(200)
    expect((await request.get(`${apiUrl}/api/groups/2/dashboard`, { headers: { Authorization: `Bearer ${supToken}` } })).status()).toBe(403)
    expect((await request.get(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${supToken}` } })).status()).toBe(403)

    // Administrador permitido en endpoints globales
    expect((await request.get(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(200)
    expect((await request.get(`${apiUrl}/api/admin/watcher-status`, { headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(200)

    const loginUi = async (username: string, password: string) => {
      const ctx = await browser.newContext({
        storageState: { cookies: [], origins: [] },
        viewport: { width: 1440, height: 900 },
      })
      const p = await ctx.newPage()
      await p.addInitScript(() => {
        localStorage.setItem('theme', 'light')
        document.documentElement.classList.remove('dark')
        document.documentElement.setAttribute('data-theme', 'light')
      })
      await p.goto('/login')
      await p.getByLabel('Usuario', { exact: true }).fill(username)
      await p.getByLabel('Contraseña', { exact: true }).fill(password)
      await p.getByRole('button', { name: 'Iniciar Sesión' }).click()
      await expect(p).not.toHaveURL(/\/login/)
      await p.waitForLoadState('networkidle')
      await p.evaluate(() => {
        document.documentElement.classList.remove('dark')
        document.documentElement.setAttribute('data-theme', 'light')
      })
      return { ctx, p }
    }

    // 2. Vista de Solicitante (user_test)
    const req = await loginUi('user_test', requesterPassword)
    try {
      await expect(req.p).toHaveURL(/\/tickets/)
      await expect(req.p.getByTestId('sidebar-nav-kanban')).toHaveCount(0)
      await expect(req.p.getByTestId('sidebar-nav-queue')).toHaveCount(0)
      await expect(req.p.getByTestId('sidebar-nav-administracion')).toHaveCount(0)
      await runWcag22Check(req.p, 'Solicitante /tickets (light)')
      await maybeCapture(req.p, '12_solicitante_tickets_desktop.png')
    } finally {
      await req.ctx.close()
    }

    // 3. Vista de Supervisor (lider_dev -> /equipo)
    const sup = await loginUi('lider_dev', supervisorPassword)
    try {
      await sup.p.goto('/equipo')
      await sup.p.waitForLoadState('networkidle')
      await expect(sup.p.getByTestId('team-status-cards')).toBeVisible()
      await expect(sup.p.getByTestId('team-technicians-table')).toBeVisible()
      await expect(sup.p.getByTestId('sidebar-nav-administracion')).toHaveCount(0)
      await runWcag22Check(sup.p, 'Supervisor /equipo (light)')
      await maybeCapture(sup.p, '13_supervisor_equipo_desktop.png', true)
    } finally {
      await sup.ctx.close()
    }

    // 4. Vista de Administrador (admin_test -> /administracion)
    const adm = await loginUi('admin_test', adminPassword)
    try {
      await adm.p.goto('/administracion')
      await adm.p.waitForLoadState('networkidle')
      await expect(adm.p.getByTestId('admin-kpi-cards')).toBeVisible()
      await expect(adm.p.getByTestId('admin-groups-table')).toBeVisible()
      await expect(adm.p.getByTestId('admin-watcher-status-card')).toBeVisible()
      await runWcag22Check(adm.p, 'Admin /administracion (light)')
      await maybeCapture(adm.p, '14_admin_panel_desktop.png', true)
    } finally {
      await adm.ctx.close()
    }
  })

  test('Teclado, Reduced Motion, Preferencias, Ayuda y Modal de Planificación', async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    })

    const ensureLight = async () => {
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark')
        document.documentElement.setAttribute('data-theme', 'light')
      })
    }

    // 1. Preferencias + captura + navegación con Tab
    await page.goto('/preferences')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '')
    expect(focusedTag).not.toBe('BODY')
    await maybeCapture(page, '16_preferences_desktop.png', true)

    // 2. Ayuda + captura
    await page.goto('/ayuda')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    await maybeCapture(page, '17_ayuda_desktop.png', true)

    // 3. Command Palette con Ctrl+K y cierre con Escape
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('command-palette-dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('command-palette-dialog')).not.toBeVisible()

    // 3b. Menú de usuario flotante en Navbar y colapso de Sidebar
    const userMenuBtn = page.getByTestId('header-user-menu-btn')
    await expect(userMenuBtn).toBeVisible()
    await userMenuBtn.click()
    await expect(page.getByTestId('header-user-menu')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('header-user-menu')).not.toBeVisible()

    const collapseBtn = page.getByTestId('sidebar-collapse-btn')
    await expect(collapseBtn).toBeVisible()
    await collapseBtn.click()
    await collapseBtn.click()

    // 4. Modal de Planificación en Kanban (sobre ticket asignado en columna "Asignado")
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')
    await ensureLight()
    const firstMineCard = page.locator('[data-column-id="mine"] [role="article"]').first()
    await expect(firstMineCard).toBeVisible({ timeout: 10000 })
    await firstMineCard.hover()
    const hoverPlanBtn = firstMineCard.getByRole('button', { name: /Planificar/i }).first()
    await expect(hoverPlanBtn).toBeVisible({ timeout: 5000 })
    await hoverPlanBtn.click()
    const dialog = page.getByRole('dialog', { name: /Planificación asistida|Planificar ticket/i })
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await runWcag22Check(page, 'Modal Planificar (light)')
    await maybeCapture(page, '15_planning_modal_desktop.png')
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  })
})
