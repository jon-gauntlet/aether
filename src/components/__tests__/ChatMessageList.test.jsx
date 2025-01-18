import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatMessageList from '../ChatMessageList'

const mockMessages = [
  { id: 1, content: 'Hello', created_at: new Date().toISOString() },
  { id: 2, content: 'World', created_at: new Date().toISOString() }
]

describe('ChatMessageList', () => {
  it('renders loading state', () => {
    render(<ChatMessageList messages={[]} loading={true} />)
    expect(screen.getByText(/loading/i)).toBeDefined()
  })

  it('renders empty state', () => {
    render(<ChatMessageList messages={[]} loading={false} />)
    expect(screen.getByText(/no messages/i)).toBeDefined()
  })

  it('renders messages', () => {
    render(<ChatMessageList messages={mockMessages} loading={false} />)
    expect(screen.getByText('Hello')).toBeDefined()
    expect(screen.getByText('World')).toBeDefined()
  })

  it('orders messages correctly', () => {
    render(<ChatMessageList messages={mockMessages} loading={false} />)
    const messages = screen.getAllByTestId('message')
    expect(messages).toHaveLength(2)
    expect(messages[0]).toHaveTextContent('Hello')
    expect(messages[1]).toHaveTextContent('World')
  })

  it('handles error state', () => {
    render(<ChatMessageList messages={[]} loading={false} error="Failed to load messages" />)
    expect(screen.getByText(/failed to load messages/i)).toBeDefined()
  })

  // Test auto-scroll behavior
  it('scrolls to bottom on new messages', () => {
    const scrollIntoViewMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock
    
    const { rerender } = render(<ChatMessageList messages={[mockMessages[0]]} loading={false} />)
    rerender(<ChatMessageList messages={mockMessages} loading={false} />)
    
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })
}) 