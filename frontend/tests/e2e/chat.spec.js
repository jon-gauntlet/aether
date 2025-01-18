import { test, expect } from '@playwright/test'

test('basic chat flow', async ({ page }) => {
  await page.goto('/')
  
  // Check initial state
  await expect(page.getByText('Welcome to Aether Chat')).toBeVisible()
  
  // Login
  await page.fill('[data-testid="email-input"]', 'test@example.com')
  await page.fill('[data-testid="password-input"]', 'password')
  await page.click('[data-testid="login-button"]')
  
  // Verify chat interface is visible
  await expect(page.getByTestId('chat-container')).toBeVisible()
  
  // Send a message
  await page.fill('[data-testid="message-input"]', 'Hello from E2E test')
  await page.click('[data-testid="send-button"]')
  
  // Verify message appears
  await expect(page.getByText('Hello from E2E test')).toBeVisible()
  
  // Switch channels
  await page.selectOption('[data-testid="channel-select"]', 'random')
  await expect(page.getByText('Channel: random')).toBeVisible()
})

test('failed login', async ({ page }) => {
  await page.goto('/')
  
  await page.fill('[data-testid="email-input"]', 'wrong@example.com')
  await page.fill('[data-testid="password-input"]', 'wrongpass')
  await page.click('[data-testid="login-button"]')
  
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Invalid credentials')
})

test('required fields validation', async ({ page }) => {
  await page.goto('/')
  
  await page.click('[data-testid="login-button"]')
  
  const emailInput = page.getByTestId('email-input')
  const passwordInput = page.getByTestId('password-input')
  
  await expect(emailInput).toHaveAttribute('aria-invalid', 'true')
  await expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
})

test('logout flow', async ({ page }) => {
  await page.goto('/')
  
  // Login first
  await page.fill('[data-testid="email-input"]', 'test@example.com')
  await page.fill('[data-testid="password-input"]', 'password')
  await page.click('[data-testid="login-button"]')
  
  // Verify logged in
  await expect(page.getByTestId('chat-container')).toBeVisible()
  
  // Logout
  await page.click('[data-testid="logout-button"]')
  
  // Verify logged out
  await expect(page.getByText('Welcome to Aether Chat')).toBeVisible()
  await expect(page.getByTestId('chat-container')).not.toBeVisible()
}) 