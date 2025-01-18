import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate between pages', async ({ page }) => {
    // Check home page
    await expect(page.getByText('Welcome to Aether')).toBeVisible()
    
    // Navigate to About page
    await page.click('text=About')
    await expect(page.getByText('About Aether')).toBeVisible()
    
    // Navigate back to Home
    await page.click('text=Home')
    await expect(page.getByText('Welcome to Aether')).toBeVisible()
  })

  test('should show login message when not authenticated', async ({ page }) => {
    await expect(page.getByText('Please log in to access the chat')).toBeVisible()
  })
}) 