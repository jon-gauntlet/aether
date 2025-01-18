import { test, expect } from '@playwright/test'

test('basic application flow', async ({ page }) => {
  // Start at the home page
  await page.goto('http://localhost:3000')
  
  // Check that the page loads
  await expect(page).toHaveTitle(/Aether/)
  
  // Basic interaction test
  const mainContent = page.locator('main')
  await expect(mainContent).toBeVisible()
}) 