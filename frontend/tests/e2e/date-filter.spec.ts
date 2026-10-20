import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

/**
 * Date filters on the ticket list.
 *
 * The API part is asserted against the real backend: a range with no tickets must
 * return an empty page, while an open range must return every ticket the technician
 * can see. The UI part asserts the two date inputs, the URL sync and the
 * "Limpiar filtros" reset without depending on a fixed number of tickets.
 */
test.describe('ticket date filters', () => {
  async function loginToken(request: import('@playwright/test').APIRequestContext) {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: 'tech1', password: 'Tech1Pass!' },
    })
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.accessToken).toBeTruthy()
    return body.accessToken as string
  }

  test('API: narrow historical range excludes every recent ticket', async ({ request }) => {
    const token = await loginToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const baseline = await request.get(`${BASE_URL}/api/tickets?limit=100`, { headers })
    expect(baseline.ok()).toBeTruthy()
    const baselineBody = await baseline.json()

    // Every E2E fixture is created "now" (or on 2026-10-10), so a 2020 range is empty.
    const empty = await request.get(
      `${BASE_URL}/api/tickets?startDate=2020-01-01&endDate=2020-01-02&limit=100`,
      { headers },
    )
    expect(empty.ok()).toBeTruthy()
    const emptyBody = await empty.json()
    expect(emptyBody.total).toBe(0)
    expect(emptyBody.items).toEqual([])

    // An open range must return at least the baseline set.
    const wide = await request.get(
      `${BASE_URL}/api/tickets?startDate=2020-01-01&endDate=2100-01-01&limit=100`,
      { headers },
    )
    expect(wide.ok()).toBeTruthy()
    const wideBody = await wide.json()
    expect(wideBody.total).toBeGreaterThanOrEqual(baselineBody.total)
  })

  test('API: startDate after endDate is rejected with 400', async ({ request }) => {
    const token = await loginToken(request)
    const response = await request.get(
      `${BASE_URL}/api/tickets?startDate=2026-06-01&endDate=2026-01-01&limit=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    expect(response.status()).toBe(400)
  })

  test('UI: date inputs sync to the URL and Limpiar filtros resets them', async ({ page }) => {
    await page.goto(`${BASE_URL}/tickets`)
    await page.waitForLoadState('networkidle')

    const startInput = page.locator('#start-date-filter')
    const endInput = page.locator('#end-date-filter')
    await expect(startInput).toBeVisible()
    await expect(endInput).toBeVisible()

    await startInput.fill('2020-01-01')
    await endInput.fill('2020-01-02')

    await expect(page).toHaveURL(/startDate=2020-01-01/)
    await expect(page).toHaveURL(/endDate=2020-01-02/)

    // The empty state must show: no ticket exists in that range.
    await expect(page.getByText(/No hay tickets que coincidan con los filtros/i)).toBeVisible({
      timeout: 10000,
    })

    const clearButton = page.getByTestId('clear-filters-btn')
    await expect(clearButton).toBeEnabled()
    await clearButton.click()

    await expect(page).not.toHaveURL(/startDate=/)
    await expect(page).not.toHaveURL(/endDate=/)
    await expect(startInput).toHaveValue('')
    await expect(endInput).toHaveValue('')
  })

  test('UI: technician role does not render the technician dropdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/tickets`)
    await page.waitForLoadState('networkidle')

    // tech1 is a technician: the queue is auto-scoped, so the dropdown is hidden.
    await expect(page.locator('#technician-filter')).toHaveCount(0)
  })
})
