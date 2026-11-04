import { test, expect, type Locator } from '@playwright/test'
import { fixtureUrl } from './support/fixture-url'

const BASE_URL = fixtureUrl('desk')

/**
 * Kanban ordering policy (docs/02-modules/tickets/overview.md):
 * - Active columns (Mis tickets, En progreso, Pendiente): FIFO by last update/creation,
 *   oldest on top.
 * - Resuelto: LIFO by last update, newest on top.
 * - Priority is a visual indicator only; it must NOT drive the order.
 *
 * The seed (scripts/seed-e2e.sh) reserves tickets #81-#86 for this spec:
 *   #81 En progreso 2026-02-01  (priority 5)
 *   #82 En progreso 2026-03-01  (priority 1)
 *   #83 Pendiente   2026-02-02  (priority 4)
 *   #84 Pendiente   2026-03-02  (priority 2)
 *   #85 Resuelto    2026-02-03  (old)
 *   #86 Resuelto    2026-03-03  (new)
 */
test.describe('kanban ordering', () => {
  /** Reads the visible ticket ids, in DOM order, inside a column. */
  async function visibleIds(column: Locator): Promise<number[]> {
    // Each card links to /tickets/<id>; reading the href is far more stable than
    // matching presentation classes.
    const hrefs = await column.locator('a[href^="/tickets/"]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href') ?? ''),
    )
    return hrefs
      .map((href) => href.match(/\/tickets\/(\d+)/)?.[1])
      .filter((value): value is string => Boolean(value))
      .map(Number)
  }

  test('active columns are FIFO and Resuelto is LIFO, ignoring priority', async ({ page }) => {
    await page.goto(`${BASE_URL}/kanban`)
    await page.waitForLoadState('networkidle')

    const inProgress = page.locator('[data-column-id="in_progress"]')
    const pending = page.locator('[data-column-id="pending"]')
    const resolved = page.locator('[data-column-id="resolved"]')

    await expect(inProgress.getByText('#81')).toBeVisible({ timeout: 10000 })
    await expect(resolved.getByText('#86')).toBeVisible({ timeout: 10000 })

    // FIFO: the oldest ticket first (#81 Feb before #82 Mar), despite #82 having
    // lower priority — priority must not be a sort key.
    const inProgressIds = await visibleIds(inProgress)
    expect(inProgressIds.indexOf(81)).toBeGreaterThanOrEqual(0)
    expect(inProgressIds.indexOf(82)).toBeGreaterThanOrEqual(0)
    expect(inProgressIds.indexOf(81)).toBeLessThan(inProgressIds.indexOf(82))

    const pendingIds = await visibleIds(pending)
    expect(pendingIds.indexOf(83)).toBeGreaterThanOrEqual(0)
    expect(pendingIds.indexOf(84)).toBeGreaterThanOrEqual(0)
    expect(pendingIds.indexOf(83)).toBeLessThan(pendingIds.indexOf(84))

    // LIFO: the most recently resolved/closed ticket on top (#86 Mar before #85 Feb).
    const resolvedIds = await visibleIds(resolved)
    expect(resolvedIds.indexOf(86)).toBeGreaterThanOrEqual(0)
    expect(resolvedIds.indexOf(85)).toBeGreaterThanOrEqual(0)
    expect(resolvedIds.indexOf(86)).toBeLessThan(resolvedIds.indexOf(85))
  })
})
