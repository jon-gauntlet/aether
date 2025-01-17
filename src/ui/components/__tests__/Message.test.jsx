import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Message from '../Message'

describe('Message Component', () => {
  const defaultProps = {
    content: 'Test message',
    role: 'user',
    timestamp: new Date('2024-01-01T12:00:00')
  }

  it('renders user message correctly', () => {
    render(<Message {...defaultProps} />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.getByText('12:00 PM')).toBeInTheDocument()
    const messageContainer = screen.getByRole('article')
    expect(messageContainer).toHaveClass('bg-blue-500')
  })

  it('renders assistant message correctly', () => {
    render(<Message {...defaultProps} role="assistant" />)
    const messageContainer = screen.getByRole('article')
    expect(messageContainer).toHaveClass('bg-gray-100')
  })

  it('shows loading state', () => {
    render(<Message {...defaultProps} isLoading={true} />)
    const loadingElement = screen.getByRole('status')
    expect(loadingElement).toHaveAttribute('aria-label', 'Loading message')
    const dots = loadingElement.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('shows error state', () => {
    const error = 'Error message'
    render(<Message {...defaultProps} error={error} />)
    const errorElement = screen.getByRole('alert')
    expect(errorElement).toHaveTextContent(`Error: ${error}`)
  })

  it('is keyboard accessible', async () => {
    const user = userEvent.setup()
    const onKeyDown = vi.fn()
    render(<Message {...defaultProps} onKeyDown={onKeyDown} />)
    
    const message = screen.getByRole('article')
    await user.tab()
    expect(message).toHaveFocus()
  })

  it('has correct ARIA attributes', () => {
    render(<Message {...defaultProps} />)
    const message = screen.getByRole('article')
    expect(message).toHaveAttribute('aria-label', 'user message: Test message')
  })
}) 