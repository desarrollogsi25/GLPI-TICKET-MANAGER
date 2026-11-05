import { expect, type Page } from '@playwright/test'

/**
 * Picks a category in the native GLPI form. GLPI replaces the <select> with a
 * select2 widget after hydration; clicking the native element races that swap
 * and is intercepted by the widget. Wait for the widget, open it and choose the
 * option by its visible text, then require the widget to display the choice.
 */
export async function selectNativeCategory(glpi: Page, optionText: RegExp): Promise<void> {
  const region = glpi.getByRole('region', { name: 'Categoría' })
  const widget = region.locator('.select2-selection__rendered').last()
  await expect(widget).toBeVisible()
  await widget.click()
  await glpi.getByRole('option', { name: optionText }).first().click()
  await expect(widget).not.toHaveAttribute('title', '-----')
}
