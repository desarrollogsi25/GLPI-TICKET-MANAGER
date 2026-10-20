import { test, expect } from '@playwright/test'

// Usar storageState vacío para realizar login como solicitante
test.use({ storageState: { cookies: [], origins: [] } })

test('solicitante: visualiza botón "+ Nuevo Ticket", crea ticket y aparece en la lista', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. Iniciar sesión como solicitante_test
  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'solicitante_test')
  await page.fill('input[name="password"]', 'Soli123!')
  await page.click('button[type="submit"]')

  // 2. Redirige automáticamente a /tickets
  await page.waitForURL('**/tickets', { timeout: 15000 })
  await page.waitForLoadState('networkidle')

  // 3. Verificar que el título es "Mis Tickets" y NO se muestra el filtro de técnico
  await expect(page.getByRole('heading', { name: 'Mis Tickets' })).toBeVisible({ timeout: 10000 })
  await expect(page.locator('button:has-text("Todos los técnicos")')).toHaveCount(0)

  // 4. Verificar que el botón "+ Nuevo Ticket" está visible en la parte superior derecha
  const newTicketBtn = page.getByRole('button', { name: '+ Nuevo Ticket' })
  await expect(newTicketBtn).toBeVisible({ timeout: 10000 })

  // 5. Hacer clic en "+ Nuevo Ticket" para abrir el modal
  await newTicketBtn.click()

  // 6. Verificar accesibilidad y presencia del diálogo
  const dialog = page.locator('div[role="dialog"][aria-modal="true"]')
  await expect(dialog).toBeVisible({ timeout: 10000 })
  await expect(dialog.getByRole('heading', { name: 'Crear nuevo ticket' })).toBeVisible()

  // 7. Rellenar el formulario
  const uniqueTitle = `Ticket Solicitante ${Date.now()}`
  const descriptionText = 'Esta es una descripción detallada de prueba para el ticket del solicitante.'

  await dialog.locator('#ticket-title').fill(uniqueTitle)
  await dialog.locator('#ticket-description').fill(descriptionText)
  await dialog.locator('#ticket-urgency').selectOption('3') // Media

  // 8. Enviar el formulario
  const submitBtn = dialog.getByRole('button', { name: 'Enviar' })
  await expect(submitBtn).toBeEnabled()
  await submitBtn.click()

  // 9. Verificar Toast de éxito y cierre del modal
  await expect(page.getByText('Ticket creado correctamente')).toBeVisible({ timeout: 15000 })
  await expect(dialog).not.toBeVisible({ timeout: 10000 })

  // 10. Verificar que el ticket recién creado aparece en la lista
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 15000 })

  expect(consoleErrors).toEqual([])
})
