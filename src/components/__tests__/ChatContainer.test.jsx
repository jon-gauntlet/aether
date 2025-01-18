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
  })
}) 