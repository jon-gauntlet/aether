import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'
import '@testing-library/jest-dom'

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // Clear any previous renders
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders error message when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error')
      return null // This line is never reached
    }

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    // Force error boundary to catch error
    const error = console.error.mock.calls[0]?.[0]
    expect(error).toBeDefined()
    expect(container.textContent).toMatch(/something went wrong/i)
  })

  it('shows error details in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const ThrowError = () => {
      throw new Error('Test error')
      return null // This line is never reached
    }

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    // Force error boundary to catch error
    const error = console.error.mock.calls[0]?.[0]
    expect(error).toBeDefined()
    expect(container.textContent).toMatch(/test error/i)

    process.env.NODE_ENV = originalEnv
  })
}) 