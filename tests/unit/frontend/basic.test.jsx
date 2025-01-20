import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import App from '../src/App'

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ChakraProvider>
        {component}
      </ChakraProvider>
    </BrowserRouter>
  )
}

describe('Basic Application Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should show login form when not authenticated', async () => {
    renderWithProviders(<App />)
    
    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    // Should show auth form after loading
    const authForm = await screen.findByTestId('auth-form')
    expect(authForm).toBeInTheDocument()
  })

  it('should show protected content when authenticated', async () => {
    // Mock authenticated user
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    
    renderWithProviders(<App />)
    
    // Should show chat container
    const chatContainer = await screen.findByTestId('chat-container')
    expect(chatContainer).toBeInTheDocument()
    
    // Should show file upload
    const fileUpload = await screen.findByTestId('file-input')
    expect(fileUpload).toBeInTheDocument()
  })
}) 