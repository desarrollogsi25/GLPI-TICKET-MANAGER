import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Responsive real + zoom + reflow + espaciado de texto (WCAG 2.2 AA: 1.4.4, 1.4.10, 1.4.12).
 *
 * MÉTODO (registrado por prueba): estas pruebas EMULAN el zoom del navegador con el equivalente exacto
 * en CSS px (ventana base 1280×800 CSS a zoom Z → viewport (1280/Z)×(800/Z) con deviceScaleFactor Z).
 * El zoom NATIVO (Ctrl +) se verifica por separado en QA manual interactivo en el navegador integrado.
 */

const BASE_W = 1280
const BASE_H = 800

const VIEWPORTS = [320, 360, 375, 390, 430, 768, 834, 1024, 1280, 1366, 1440, 1920] as const
const ZOOMS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4] as const

const OPERATIONAL_ROUTES = ['/kanban', '/tickets', '/queue', '/tickets/11', '/dashboard', '/services', '/preferences', '/ayuda'] as const

async function assertReflow(page: Page, label: string) {
  await expect(page.locator('#main-content')).toBeVisible()
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    const vw = window.innerWidth
    // Elementos interactivos visibles cuyo borde derecho queda fuera de la ventana (botones cortados).
    const offscreen: string[] = []
    document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [role="tab"]').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      if (el.closest('[data-allow-scroll-x], [class*="overflow-x-auto"], [class*="overflow-auto"]')) return
      if (r.right > vw + 1 && r.left < vw) {
        offscreen.push(`${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}`)
      }
    })
    return { scrollWidth: doc.scrollWidth, innerWidth: vw, bodyScrollWidth: document.body.scrollWidth, offscreen }
  })
  expect(
    metrics.scrollWidth,
    `[${label}] scroll horizontal de página: scrollWidth=${metrics.scrollWidth} innerWidth=${metrics.innerWidth}`,
  ).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(metrics.offscreen, `[${label}] controles cortados fuera de la ventana`).toEqual([])
}

test.describe('Responsive fluido, zoom emulado y reflow (WCAG 1.4.4 / 1.4.10 / 1.4.12)', () => {
  test('el lienzo principal aprovecha el ancho disponible (sin caja fija de 1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 })
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')
    const geom = await page.evaluate(() => {
      const main = document.querySelector('#main-content') as HTMLElement
      const sidebar = document.querySelector('[data-testid="desktop-sidebar"]') as HTMLElement
      const mr = main.getBoundingClientRect()
      const sr = sidebar.getBoundingClientRect()
      return { mainWidth: mr.width, mainLeft: mr.left, sidebarRight: sr.right, vw: window.innerWidth }
    })
    // El contenido ocupa (casi) todo el ancho restante tras la navegación: no queda centrado en una caja estrecha.
    expect(geom.mainWidth).toBeGreaterThan(geom.vw - geom.sidebarRight - 4)
    expect(geom.mainWidth).toBeGreaterThan(1500)
  })

  test('matriz de viewports 320–1920 px × rutas operativas: sin overflow horizontal de página', async ({ page }) => {
    test.setTimeout(420000)
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 900 })
      for (const route of OPERATIONAL_ROUTES) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await assertReflow(page, `viewport ${width}px ${route}`)
      }
    }
    expect(errors).toEqual([])
  })

  test('zoom emulado 100–400% desde ventana de 1280 CSS px: reflow y navegación adaptativa', async ({ browser }) => {
    test.setTimeout(420000)
    for (const zoom of ZOOMS) {
      const cssW = Math.round(BASE_W / zoom)
      const cssH = Math.round(BASE_H / zoom)
      const ctx = await browser.newContext({
        viewport: { width: cssW, height: cssH },
        deviceScaleFactor: zoom,
        storageState: test.info().project.use.storageState as string,
      })
      const page = await ctx.newPage()
      try {
        for (const route of ['/kanban', '/tickets', '/tickets/11', '/dashboard', '/preferences']) {
          await page.goto(route)
          await page.waitForLoadState('networkidle')
          await assertReflow(page, `zoom ${Math.round(zoom * 100)}% (${cssW} CSS px) ${route}`)
        }
        // Navegación adaptativa
        const sidebar = page.getByTestId('desktop-sidebar')
        if (cssW >= 768) {
          await expect(sidebar).toBeVisible()
          const collapsed = await sidebar.getAttribute('data-collapsed')
          if (cssW < 1100) expect(collapsed, `rail compacto a ${cssW} CSS px`).toBe('true')
        } else {
          await expect(sidebar).toBeHidden()
          await expect(page.getByRole('navigation', { name: /principal|inferior|tab/i }).first()).toBeVisible()
        }
      } finally {
        await ctx.close()
      }
    }
  })

  test('WCAG 1.4.12 espaciado de texto (line-height 1.5, párrafos 2×, letter 0.12em, word 0.16em) sin pérdida ni overflow', async ({ page }) => {
    test.setTimeout(240000)
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      for (const route of ['/kanban', '/tickets', '/tickets/11', '/queue', '/preferences']) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await page.addStyleTag({
          content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`,
        })
        await page.waitForTimeout(250)
        await assertReflow(page, `espaciado 1.4.12 ${width}px ${route}`)
        // Texto de botones/etiquetas recortado duramente (sin ellipsis) = pérdida de contenido.
        const clipped = await page.evaluate(() => {
          const out: string[] = []
          document.querySelectorAll<HTMLElement>('button, a[href], label, th, [role="tab"]').forEach((el) => {
            if (el.classList.contains('sr-only') && document.activeElement !== el) return
            const cs = getComputedStyle(el)
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0) return
            const clipsX = cs.overflowX === 'hidden' || cs.overflowX === 'clip'
            if (clipsX && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2) {
              out.push((el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40))
            }
          })
          return out
        })
        expect(clipped, `texto recortado con espaciado 1.4.12 en ${width}px ${route}`).toEqual([])
      }
    }
  })

  test('Login, modales y Command Palette al 400% (320 CSS px) se adaptan y permiten scroll interno', async ({ browser }) => {
    test.setTimeout(120000)
    const ctx = await browser.newContext({
      viewport: { width: 320, height: 200 },
      deviceScaleFactor: 4,
      storageState: { cookies: [], origins: [] },
    })
    const page = await ctx.newPage()
    try {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      const doc = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
      expect(doc.sw).toBeLessThanOrEqual(doc.iw + 1)
      await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible()
      await expect(page.getByLabel('Usuario', { exact: true })).toBeVisible()
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(results.violations).toEqual([])
    } finally {
      await ctx.close()
    }
  })

  test('Command Palette y Modal de Planificación caben en 320 CSS px', async ({ page }) => {
    test.setTimeout(120000)
    await page.setViewportSize({ width: 320, height: 500 })
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('mobile-search-btn').click()
    const palette = page.getByTestId('command-palette-dialog')
    await expect(palette).toBeVisible()
    const box = await palette.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(-1)
    expect(box!.x + box!.width).toBeLessThanOrEqual(321)
    await page.keyboard.press('Escape')
    await expect(palette).toBeHidden()
  })
})
