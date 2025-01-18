<<<<<<< HEAD
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChatContainer from '../ChatContainer'

// Mock Supabase client
vi.mock('../../supabaseClient', () => ({
  supabase: {
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
    from: () => ({
      select: () => ({
        order: () => ({
          data: [],
          error: null
        })
      }),
      insert: () => ({
        error: null
      })
    })
  }
}))

describe('ChatContainer', () => {
  it('renders chat interface', () => {
    render(<ChatContainer />)
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
  })

  it('handles message sending', async () => {
    render(<ChatContainer />)
    const input = screen.getByPlaceholderText('Type a message...')
    const button = screen.getByText('Send')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(button)
    
    expect(input.value).toBe('')
=======
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatContainer from '../ChatContainer'
import { testUtils } from '../../lib/test-utils'

describe('ChatContainer', () => {
  beforeEach(async () => {
    await testUtils.clearMessages()
  })

  it('should render loading state', () => {
    render(<ChatContainer />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should load and display messages', async () => {
    const testMessages = await testUtils.createTestMessages(2)
    render(<ChatContainer />)

    await waitFor(() => {
      testMessages.forEach(msg => {
        expect(screen.getByText(msg.content)).toBeInTheDocument()
      })
    })
  })

  it('should send new message', async () => {
    const user = userEvent.setup()
    render(<ChatContainer />)

    const input = screen.getByPlaceholderText(/type a message/i)
    await user.type(input, 'New test message{enter}')

    await waitFor(() => {
      expect(screen.getByText('New test message')).toBeInTheDocument()
    })
>>>>>>> feature/infra
  })
}) 