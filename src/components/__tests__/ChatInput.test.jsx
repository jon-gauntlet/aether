import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatInput from '../ChatInput'

describe('ChatInput', () => {
  it('renders input field', () => {
    render(<ChatInput onSendMessage={() => {}} />)
    expect(screen.getByPlaceholderText(/type a message/i)).toBeDefined()
  })

  it('handles text input', () => {
    render(<ChatInput onSendMessage={() => {}} />)
    const input = screen.getByPlaceholderText(/type a message/i)
    fireEvent.change(input, { target: { value: 'test message' } })
    expect(input.value).toBe('test message')
  })

  it('calls onSendMessage when Enter is pressed', () => {
    const mockSend = vi.fn()
    render(<ChatInput onSendMessage={mockSend} />)
    const input = screen.getByPlaceholderText(/type a message/i)
    
    fireEvent.change(input, { target: { value: 'test message' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 })
    
    expect(mockSend).toHaveBeenCalledWith('test message')
    expect(input.value).toBe('') // Input should be cleared
  })

  it('does not send empty messages', () => {
    const mockSend = vi.fn()
    render(<ChatInput onSendMessage={mockSend} />)
    const input = screen.getByPlaceholderText(/type a message/i)
    
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('handles disabled state', () => {
    render(<ChatInput onSendMessage={() => {}} disabled={true} />)
    const input = screen.getByPlaceholderText(/type a message/i)
    expect(input).toBeDisabled()
  })
}) 