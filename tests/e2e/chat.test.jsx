import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import App from '../../src/App'
import { AuthProvider } from '../../src/contexts/AuthContext'

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ChakraProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  )
}

describe('Chat E2E Flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should handle basic chat flow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    // Check initial state
    expect(await screen.findByText('Welcome to Aether Chat')).toBeInTheDocument()

    // Login
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password')
    await user.click(screen.getByTestId('login-button'))

    // Verify chat interface is visible
    expect(await screen.findByTestId('chat-container')).toBeInTheDocument()

    // Send a message
    await user.type(screen.getByTestId('message-input'), 'Hello from E2E test')
    await user.click(screen.getByTestId('send-button'))

    // Verify message appears
    expect(await screen.findByText('Hello from E2E test')).toBeInTheDocument()
  })

  it('should handle failed login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    await user.type(screen.getByTestId('email-input'), 'wrong@example.com')
    await user.type(screen.getByTestId('password-input'), 'wrongpass')
    await user.click(screen.getByTestId('login-button'))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    await user.click(screen.getByTestId('login-button'))

    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')

    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
  })

  it('should handle logout flow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    // Login first
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password')
    await user.click(screen.getByTestId('login-button'))

    // Verify logged in
    expect(await screen.findByTestId('chat-container')).toBeInTheDocument()

    // Logout
    await user.click(screen.getByTestId('logout-button'))

    // Verify logged out
    expect(await screen.findByText('Welcome to Aether Chat')).toBeInTheDocument()
    expect(screen.queryByTestId('chat-container')).not.toBeInTheDocument()
  })
}) 