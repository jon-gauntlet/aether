import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChatInput from '../ChatInput'

describe('ChatInput', () => {
  it('handles message submission', async () => {
    const onSendMessage = vi.fn()
    render(<ChatInput onSendMessage={onSendMessage} />)

    const input = screen.getByPlaceholderText('Type a message...')
    const button = screen.getByText('Send')

    // Empty message should not trigger send
    fireEvent.click(button)
    expect(onSendMessage).not.toHaveBeenCalled()

    // Valid message should trigger send
    fireEvent.change(input, { target: { value: 'Hello world' } })
    fireEvent.click(button)
    expect(onSendMessage).toHaveBeenCalledWith('Hello world')
    expect(input.value).toBe('')
  })

  it('disables input while sending', async () => {
    const onSendMessage = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<ChatInput onSendMessage={onSendMessage} />)

    const input = screen.getByPlaceholderText('Type a message...')
    const button = screen.getByText('Send')

    fireEvent.change(input, { target: { value: 'Hello world' } })
    fireEvent.click(button)

    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
    expect(screen.getByText('Sending...')).toBeInTheDocument()
  })
}) 