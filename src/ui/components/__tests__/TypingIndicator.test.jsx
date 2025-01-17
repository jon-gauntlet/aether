import React from 'react'
import { render, screen } from '@testing-library/react'
import TypingIndicator from '../TypingIndicator'

describe('TypingIndicator', () => {
  it('renders with default styles', () => {
    render(<TypingIndicator />)
    const indicator = screen.getByRole('status')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveClass('flex', 'items-center', 'space-x-2')
  })

  it('applies custom className', () => {
    render(<TypingIndicator className="test-class" />)
    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('test-class')
  })

  it('has correct ARIA attributes', () => {
    render(<TypingIndicator />)
    const indicator = screen.getByRole('status')
    expect(indicator).toHaveAttribute('aria-label', 'User is typing')
  })

  it('contains three animated dots', () => {
    render(<TypingIndicator />)
    const dots = screen.getByRole('status').querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
    dots.forEach(dot => {
      expect(dot).toHaveClass('animate-bounce')
      expect(dot).toHaveClass('bg-current')
      expect(dot).toHaveClass('rounded-full')
    })
  })
}) 