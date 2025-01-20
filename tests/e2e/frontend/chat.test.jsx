import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import App from '../../src/App'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { RAGProvider } from '@/contexts/RAGContext'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { rest } from 'msw'
import { server } from '@/mocks/server'

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ChakraProvider>
        <AuthProvider>
          <RAGProvider>
            {component}
          </RAGProvider>
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  )
}

describe('Chat System E2E', () => {
  // Setup user events
  const user = userEvent.setup()

  beforeEach(() => {
    // Render the chat system with necessary providers
    render(
      <RAGProvider>
        <ChatContainer />
      </RAGProvider>
    )
  })

  it('should allow users to send messages and receive responses', async () => {
    // Get the input field
    const input = screen.getByPlaceholderText(/type your message/i)
    expect(input).toBeInTheDocument()

    // Type and send a message
    await user.type(input, 'What is RAG?')
    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)

    // Verify message appears in chat
    expect(await screen.findByText('What is RAG?')).toBeInTheDocument()

    // Wait for and verify response
    await waitFor(() => {
      const responseElement = screen.getByTestId('assistant-message')
      expect(responseElement).toBeInTheDocument()
      expect(responseElement).toHaveTextContent(/RAG|retrieval|generation/i)
    }, { timeout: 5000 })
  })

  it('should handle file uploads for context', async () => {
    // Get the file input
    const fileInput = screen.getByTestId('file-upload')
    
    // Create a mock file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    
    // Upload the file
    await user.upload(fileInput, file)

    // Verify upload success message
    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument()
    })

    // Verify file appears in context list
    expect(screen.getByText('test.txt')).toBeInTheDocument()
  })

  it('should maintain chat history between sessions', async () => {
    // Send a test message
    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'Remember this message')
    await user.click(screen.getByRole('button', { name: /send/i }))

    // Unmount and remount component to simulate session change
    const { unmount } = render(
      <RAGProvider>
        <ChatContainer />
      </RAGProvider>
    )
    unmount()

    // Render again and verify message persists
    render(
      <RAGProvider>
        <ChatContainer />
      </RAGProvider>
    )

    expect(screen.getByText('Remember this message')).toBeInTheDocument()
  })

  it('should handle network errors gracefully', async () => {
    // Force a network error
    server.use(
      rest.post('/api/rag/query', (req, res, ctx) => {
        return res.networkError('Failed to connect')
      })
    )

    // Send a message
    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'This should fail')
    await user.click(screen.getByRole('button', { name: /send/i }))

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })

    // Verify retry button appears and works
    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
    
    // Reset server and retry
    server.resetHandlers()
    await user.click(retryButton)

    // Verify successful retry
    await waitFor(() => {
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument()
      expect(screen.getByTestId('assistant-message')).toBeInTheDocument()
    })
  })
}) 