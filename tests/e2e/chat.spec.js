import { test, expect } from '@playwright/test'

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should require authentication for chat access', async ({ page }) => {
    await expect(page.getByText('Please log in to access the chat')).toBeVisible()
  })

  test('should allow sending messages when authenticated', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    })
    await page.reload()

    // Wait for chat container to be visible
    await expect(page.getByTestId('chat-container')).toBeVisible()

    // Type and send a message
    await page.getByTestId('message-input').fill('Hello, World!')
    await page.getByTestId('send-button').click()

    // Verify message appears in chat
    await expect(page.getByText('Hello, World!')).toBeVisible()
  })

  test('should switch channels', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    })
    await page.reload()

    // Switch to random channel
    await page.getByTestId('channel-select').selectOption('random')
    await expect(page.getByTestId('channel-select')).toHaveValue('random')
  })

  test('should logout successfully', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    })
    await page.reload()

    // Click logout button
    await page.getByTestId('logout-button').click()

    // Verify user is logged out
    await expect(page.getByText('Please log in to access the chat')).toBeVisible()
    
    // Verify local storage is cleared
    expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBeNull()
    expect(await page.evaluate(() => localStorage.getItem('user'))).toBeNull()
  })
}) 