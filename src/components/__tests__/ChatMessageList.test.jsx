import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ChatMessageList from '../ChatMessageList'

describe('ChatMessageList', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Hello world',
      user_id: 'user1',
      created_at: new Date().toISOString()
    }
  ]

  it('shows loading state', () => {
    render(<ChatMessageList messages={[]} loading={true} />)
    expect(screen.getByText('Loading messages...')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<ChatMessageList messages={[]} loading={false} />)
    expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument()
  })

  it('renders messages', () => {
    render(<ChatMessageList messages={mockMessages} loading={false} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('User user1')).toBeInTheDocument()
  })
}) 