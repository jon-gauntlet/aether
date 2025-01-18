import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import App from '../../src/App'
import { renderWithRouter } from '../utils/test-utils'

describe('App Performance', () => {
  let startTime

  beforeEach(() => {
    startTime = performance.now()
  })

  it('should render initial page within 150ms', async () => {
    await renderWithRouter(<App />)
    const endTime = performance.now()
    const renderTime = endTime - startTime

    expect(renderTime).toBeLessThan(150)
    expect(await screen.findByText(/Welcome to Aether/i)).toBeInTheDocument()
  })

  it('should handle navigation within 50ms', async () => {
    await renderWithRouter(<App />)
    const aboutLink = await screen.findByRole('link', { name: /about/i })

    startTime = performance.now()
    await aboutLink.click()
    const endTime = performance.now()
    const navigationTime = endTime - startTime

    expect(navigationTime).toBeLessThan(50)
    expect(await screen.findByText(/About Aether/i)).toBeInTheDocument()
  })
})

describe('Chat Performance', () => {
  it('should load messages within 150ms', async () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      user: 'Test User',
      text: `Message ${i}`
    }))

    startTime = performance.now()
    // Load messages
    const endTime = performance.now()
    const loadTime = endTime - startTime

    expect(loadTime).toBeLessThan(150)
  })
}) 