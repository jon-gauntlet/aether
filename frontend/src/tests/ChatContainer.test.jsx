import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ChatContainer } from '../components/ChatContainer'
import { TestWrapper } from './setup/setup'
import * as apiClient from '../services/apiClient'

vi.mock('../services/apiClient', () => ({
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  subscribeToMessages: vi.fn()
}))

describe('ChatContainer', () => {
  const mockMessages = [
    { id: 1, content: 'Hello', channel: 'general' },
    { id: 2, content: 'World', channel: 'general' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.fetchMessages.mockResolvedValue(mockMessages)
    apiClient.sendMessage.mockResolvedValue({ id: 3, content: 'New message', channel: 'general' })
    apiClient.subscribeToMessages.mockImplementation((channel, callback) => {
      // Simulate subscription
      return {
        unsubscribe: vi.fn()
      }
    })
  })

  it('renders chat container with messages', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('World')).toBeInTheDocument()
    })
  })

  it('handles message sending', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper })
    
    const input = screen.getByTestId('message-input')
    const sendButton = screen.getByTestId('send-button')

    await userEvent.type(input, 'New message')
    await userEvent.click(sendButton)

    expect(apiClient.sendMessage).toHaveBeenCalledWith('New message', 'general')
  })

  it('subscribes to channel updates', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(apiClient.subscribeToMessages).toHaveBeenCalledWith(
        'general',
        expect.any(Function)
      )
    })
  })

  it('handles message loading errors', async () => {
    apiClient.fetchMessages.mockRejectedValueOnce(new Error('Failed to load'))
    
    render(<ChatContainer />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load chat history')).toBeInTheDocument()
    })
  })

  it('handles message sending errors', async () => {
    apiClient.sendMessage.mockRejectedValueOnce(new Error('Failed to send'))
    
    render(<ChatContainer />, { wrapper: TestWrapper })
    
    const input = screen.getByTestId('message-input')
    const sendButton = screen.getByTestId('send-button')

    await userEvent.type(input, 'Test message')
    await userEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to send message')).toBeInTheDocument()
    })
  })

  it('updates messages when receiving real-time updates', async () => {
    let subscriptionCallback
    apiClient.subscribeToMessages.mockImplementation((channel, callback) => {
      subscriptionCallback = callback
      return { unsubscribe: vi.fn() }
    })

    render(<ChatContainer />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    // Simulate receiving a new message
    const newMessage = { id: 4, content: 'Real-time message', channel: 'general' }
    subscriptionCallback(newMessage)

    await waitFor(() => {
      expect(screen.getByText('Real-time message')).toBeInTheDocument()
    })
  })

  it('cleans up subscription on unmount', async () => {
    const unsubscribe = vi.fn()
    apiClient.subscribeToMessages.mockReturnValue({ unsubscribe })

    const { unmount } = render(<ChatContainer />, { wrapper: TestWrapper })
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
}) 