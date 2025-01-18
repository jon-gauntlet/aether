import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatContainer from '../ChatContainer'
import { supabase } from '../../lib/supabaseClient'

// Mock Supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    }))
  }
}))

describe('ChatContainer', () => {
  it('renders without crashing', () => {
    render(<ChatContainer />)
    expect(screen.getByTestId('chat-container')).toBeDefined()
  })

  it('displays loading state initially', () => {
    render(<ChatContainer />)
    expect(screen.getByText(/loading/i)).toBeDefined()
  })

  it('handles message sending', async () => {
    render(<ChatContainer />)
    const input = screen.getByPlaceholderText(/type a message/i)
    const message = 'Hello, World!'
    
    fireEvent.change(input, { target: { value: message } })
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 })
    
    expect(supabase.from).toHaveBeenCalledWith('messages')
  })

  it('displays error state when Supabase fails', async () => {
    // Mock error response
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: new Error('Failed to load') })
    }))

    render(<ChatContainer />)
    expect(await screen.findByText(/error/i)).toBeDefined()
  })
}) 