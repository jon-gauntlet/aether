import React from 'react'
import { render, screen } from '@testing-library/react'
import { Message } from '../shared/components/Message'
import { TestWrapper } from './setup'

describe('Message', () => {
  describe('Basic Rendering', () => {
    it('renders user message correctly', () => {
      const message = { content: 'Hello' }
      render(<Message message={message} isUser={true} />, { wrapper: TestWrapper })
      
      const messageElement = screen.getByTestId('message-user')
      expect(messageElement).toBeInTheDocument()
      expect(messageElement).toHaveTextContent('Hello')
    })

    it('renders assistant message correctly', () => {
      const message = { content: 'Hi there', sender: 'Assistant' }
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper })
      
      const messageElement = screen.getByTestId('message-assistant')
      expect(messageElement).toBeInTheDocument()
      expect(messageElement).toHaveTextContent('Hi there')
    })

    it('renders code blocks correctly', () => {
      const message = { content: 'Here is some code', code: 'console.log("test");' }
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper })
      
      expect(screen.getByTestId('code-block')).toBeInTheDocument()
      expect(screen.getByText('console.log("test");')).toBeInTheDocument()
    })
  })

  describe('Timestamp Handling', () => {
    it('renders timestamp when provided', () => {
      const message = { content: 'Hello', timestamp: '2024-01-01T12:00:00Z' }
      render(<Message message={message} isUser={true} />, { wrapper: TestWrapper })
      
      expect(screen.getByTestId('message-timestamp')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('renders error message when provided', () => {
      const message = { content: 'Hello', error: true }
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper })
      
      expect(screen.getByText('Failed to process message')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      const message = { content: 'Hello', loading: true }
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper })
      
      expect(screen.getByTestId('message-loading')).toBeInTheDocument()
    })
  })
}) 