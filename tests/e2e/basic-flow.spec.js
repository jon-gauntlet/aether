import { test, expect } from '@playwright/test'

test('basic application flow', async ({ page }) => {
  // Start at the home page
  await page.goto('/')
  await expect(page).toHaveTitle(/Your App Name/)

  // Test navigation
  await page.click('nav >> text=About')
  await expect(page).toHaveURL(/.*about/)

  // Test basic interaction
  await page.click('button:has-text("Login")')
  await expect(page.locator('.login-form')).toBeVisible()
}) 