import { test, expect } from '@playwright/test'

test.describe('Chat Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete authentication flow', async ({ page }) => {
    // Check initial auth state
    await expect(page.getByText('Welcome to Aether Chat')).toBeVisible()

    // Fill in sign up form
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('testpassword123')
    await page.getByRole('button', { name: 'Sign up' }).click()

    // Verify redirect to chat
    await expect(page.getByTestId('message-input')).toBeVisible()
    await expect(page.getByText('test@example.com')).toBeVisible()
  })

  test('should handle chat functionality', async ({ page, browser }) => {
    // Login first
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('testpassword123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for chat to load
    await expect(page.getByTestId('message-input')).toBeVisible()

    // Send a message
    await page.getByTestId('message-input').fill('Hello from test')
    await page.getByTestId('send-button').click()

    // Verify message appears
    await expect(page.getByText('Hello from test')).toBeVisible()

    // Test channel switching
    await page.getByTestId('channel-select').selectOption('random')
    await expect(page.getByText('Hello from test')).not.toBeVisible()

    // Test multi-user interaction
    const page2 = await browser.newPage()
    await page2.goto('/')

    // Login second user
    await page2.getByLabel('Email').fill('test2@example.com')
    await page2.getByLabel('Password').fill('testpassword123')
    await page2.getByRole('button', { name: 'Sign in' }).click()

    // Send message from second user
    await page2.getByTestId('channel-select').selectOption('random')
    await page2.getByTestId('message-input').fill('Hello from user 2')
    await page2.getByTestId('send-button').click()

    // Verify message appears for both users
    await expect(page.getByText('Hello from user 2')).toBeVisible()
    await expect(page2.getByText('Hello from user 2')).toBeVisible()

    await page2.close()
  })

  test('should handle sign out', async ({ page }) => {
    // Login
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('testpassword123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Sign out
    await page.getByRole('button', { name: 'Sign out' }).click()

    // Verify redirect to auth page
    await expect(page.getByText('Welcome to Aether Chat')).toBeVisible()
  })

  test('should persist messages between sessions', async ({ page, browser }) => {
    // Login and send message
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('testpassword123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.getByTestId('message-input').fill('Persistent message')
    await page.getByTestId('send-button').click()

    // Reload page
    await page.reload()

    // Verify message still appears after reload
    await expect(page.getByText('Persistent message')).toBeVisible()
  })
}) 