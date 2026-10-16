import { test, expect } from '@playwright/test'

test('realtime: connection indicator connects and maintains real-time link across contexts', async ({ browser }) => {
  const contextA = await browser.newContext({ storageState: 'tests/e2e/.auth/tech1.json' })
  const pageA = await contextA.newPage()
  await pageA.goto('http://localhost:5173/kanban')

  const contextB = await browser.newContext({ storageState: 'tests/e2e/.auth/tech1.json' })
  const pageB = await contextB.newPage()
  await pageB.goto('http://localhost:5173/queue')

  // Ambos contextos deben alcanzar el estado 'connected' en SignalR
  await expect(pageA.getByTestId('connection-indicator').first()).toHaveAttribute(
    'data-state',
    'connected',
    { timeout: 10000 },
  )
  await expect(pageB.getByTestId('connection-indicator').first()).toHaveAttribute(
    'data-state',
    'connected',
    { timeout: 10000 },
  )

  await contextA.close()
  await contextB.close()
})
