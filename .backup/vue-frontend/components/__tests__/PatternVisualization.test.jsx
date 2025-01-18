import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import PatternVisualization from '../PatternVisualization'
import '@testing-library/jest-dom'

const theme = {
  colors: {
    primary: '#007bff',
    background: '#1a1a1a',
    text: '#ffffff'
  },
  space: {
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem'
  }
}

const defaultProps = {
  patterns: [
    { id: '1', label: 'Flow', value: '85%', isHighlighted: true },
    { id: '2', label: 'Focus', value: '90%', isHighlighted: false },
    { id: '3', label: 'Energy', value: '95%', isHighlighted: false }
  ],
  isActive: true,
  onPatternSelect: () => {}
}

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('PatternVisualization', () => {
  beforeEach(() => {
    // Clear any previous renders
    document.body.innerHTML = ''
  })

  it('renders with default props', () => {
    renderWithTheme(<PatternVisualization {...defaultProps} />)
    const element = screen.getByTestId('pattern-visualization')
    expect(element).toBeInTheDocument()
    expect(element).toHaveStyle({
      transform: 'scale(1)',
      opacity: '1'
    })
  })

  it('updates with state changes', () => {
    renderWithTheme(<PatternVisualization {...defaultProps} isActive={false} />)
    const element = screen.getByTestId('pattern-visualization')
    expect(element).toHaveStyle({
      transform: 'scale(0.9)',
      opacity: '0.7'
    })
  })
}) 