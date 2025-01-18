import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ChatInput } from '../components/ChatInput'
import { TestWrapper } from './TestWrapper'
import { act } from '@testing-library/react'

describe('ChatInput', () => {
  const defaultProps = {
    onSendMessage: vi.fn(),
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input field and send button', () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper })
    expect(screen.getByTestId('message-input')).toBeInTheDocument()
    expect(screen.getByTestId('send-button')).toBeInTheDocument()
  })

  it('handles message input and submission', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper })
    const input = screen.getByTestId('message-input')
    const button = screen.getByTestId('send-button')

    await act(async () => {
      await userEvent.type(input, 'Hello')
      fireEvent.click(button)
    })

    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello')
  })

  it('disables send button when input is empty', () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper })
    expect(screen.getByTestId('send-button')).toBeDisabled()
  })

  it('handles Enter key press for submission', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper })
    const input = screen.getByTestId('message-input')

    await act(async () => {
      await userEvent.type(input, 'Hello{Enter}')
    })

    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello')
  })

  it('handles Shift+Enter for new line', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper })
    const input = screen.getByTestId('message-input')

    await act(async () => {
      await userEvent.type(input, 'Hello')
      await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    })

    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
    expect(input.value).toContain('\n')
  })

  it('trims whitespace before sending', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper })
    const input = screen.getByTestId('message-input')

    await act(async () => {
      await userEvent.type(input, '  Hello  ')
      await userEvent.keyboard('{Enter}')
    })

    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello')
  })

  it('disables input and button while loading', () => {
    render(<ChatInput {...defaultProps} isLoading={true} />, { wrapper: TestWrapper })
    expect(screen.getByTestId('message-input')).toBeDisabled()
    expect(screen.getByTestId('send-button')).toBeDisabled()
  })

  it('shows character count when near limit', async () => {
    render(<ChatInput {...defaultProps} maxLength={10} />, { wrapper: TestWrapper })
    const input = screen.getByTestId('message-input')

    await act(async () => {
      await userEvent.type(input, '12345678')
    })

    expect(screen.getByText('2 characters remaining')).toBeInTheDocument()
  })
}) 