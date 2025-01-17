import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoadingProvider } from '../ui/components/LoadingProvider'
import { ErrorBoundary } from '../ui/components/ErrorBoundary'
import App from '../App'

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.OPEN
    setTimeout(() => this.onopen(), 0)
  }

  send(data) {
    // Simulate response after 100ms
    setTimeout(() => {
      this.onmessage({
        data: JSON.stringify({
          type: 'message',
          content: 'Mock response',
          role: 'assistant'
        })
      })
    }, 100)
    return true
  }

  close() {}
}

global.WebSocket = MockWebSocket

describe('Chat Integration', () => {
  beforeEach(() => {
    render(
      <ErrorBoundary>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </ErrorBoundary>
    )
  })

  it('shows connection status', async () => {
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  it('handles message submission and response', async () => {
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'Test message')
    await userEvent.keyboard('{Enter}')

    // Check user message appears
    expect(screen.getByText('Test message')).toBeInTheDocument()

    // Wait for mock response
    await waitFor(() => {
      expect(screen.getByText('Mock response')).toBeInTheDocument()
    })
  })

  it('handles keyboard navigation', async () => {
    // Focus input with keyboard shortcut
    await userEvent.keyboard('{Meta>}/{/Meta}')
    expect(screen.getByRole('textbox')).toHaveFocus()

    // Escape to blur
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('textbox')).not.toHaveFocus()
  })

  it('shows loading states', async () => {
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'Test loading')
    
    const sendButton = screen.getByRole('button')
    await userEvent.click(sendButton)

    // Check loading spinner appears
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Wait for response
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('handles error states', async () => {
    // Mock WebSocket error
    const oldWS = global.WebSocket
    global.WebSocket = class ErrorWebSocket extends MockWebSocket {
      send() {
        setTimeout(() => this.onerror(new Error('Mock error')), 100)
        return false
      }
    }

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'Test error')
    await userEvent.keyboard('{Enter}')

    // Check error message appears
    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument()
    })

    global.WebSocket = oldWS
  })

  it('maintains scroll position on new messages', async () => {
    const messageContainer = screen.getByRole('log')
    const originalScrollTop = messageContainer.scrollTop

    // Send multiple messages
    const input = screen.getByRole('textbox')
    for (let i = 0; i < 3; i++) {
      await userEvent.type(input, `Message ${i}{Enter}`)
    }

    // Wait for responses
    await waitFor(() => {
      expect(screen.getAllByText(/Mock response/)).toHaveLength(3)
    })

    // Check scroll position updated
    expect(messageContainer.scrollTop).toBeGreaterThan(originalScrollTop)
  })
}) 