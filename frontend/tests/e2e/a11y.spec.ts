import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PAGES = [
  '/kanban',
  '/tickets',
  '/tickets/11',
  '/queue',
  '/services',
  '/dashboard',
  '/preferences',
  '/ayuda',
]

for (const path of PAGES) {
  test(`a11y: ${path} (light mode)`, async ({ page }) => {
    await page.goto(`http://localhost:5173${path}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // Reportar violaciones
    if (results.violations.length > 0) {
      console.log(`\n=== ${path} ===`)
      for (const v of results.violations) {
        console.log(`[${v.impact}] ${v.id}: ${v.help}`)
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`  → ${node.target.join(', ')}`)
        }
      }
    }

    expect(results.violations).toEqual([])
  })
}
