import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderWithRouter } from '../utils/test-utils'
import App from '../../src/App'

describe('App Performance', () => {
  let startTime

  beforeEach(() => {
    startTime = performance.now()
  })

  it('should render initial page within 100ms', async () => {
    await renderWithRouter(<App />)
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    expect(renderTime).toBeLessThan(100)
    expect(await screen.findByText(/Welcome to Aether/i)).toBeInTheDocument()
  })

  it('should handle navigation within 50ms', async () => {
    await renderWithRouter(<App />)
    const aboutLink = await screen.findByRole('link', { name: /about/i })
    
    startTime = performance.now()
    fireEvent.click(aboutLink)
    const endTime = performance.now()
    const navigationTime = endTime - startTime
    
    expect(navigationTime).toBeLessThan(50)
  })
})

describe('Chat Performance', () => {
  let startTime

  beforeEach(() => {
    startTime = performance.now()
  })

  it('should load messages within 150ms', async () => {
    // Simulate loading 100 messages
    const messages = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      content: `Test message ${i}`,
      username: 'test'
    }))
    
    const { rerender } = render(
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className="message">
            <strong>{message.username}: </strong>
            {message.content}
          </div>
        ))}
      </div>
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    expect(renderTime).toBeLessThan(150)
    
    // Test re-render performance
    startTime = performance.now()
    rerender(
      <div className="chat-messages">
        {[...messages, { id: 100, content: 'New message', username: 'test' }].map(message => (
          <div key={message.id} className="message">
            <strong>{message.username}: </strong>
            {message.content}
          </div>
        ))}
      </div>
    )
    const rerenderedTime = performance.now() - startTime
    
    expect(rerenderedTime).toBeLessThan(50)
  })
}) 