import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import Flow from '../../components/Flow'

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
  metrics: [
    { label: 'Focus', value: '85%' },
    { label: 'Energy', value: '90%' },
    { label: 'Coherence', value: '95%' }
  ],
  isActive: true,
  onStateChange: () => {}
}

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('Flow Component', () => {
  it('renders with default props', () => {
    renderWithTheme(<Flow {...defaultProps} />)
    const element = screen.getByTestId('flow-component')
    expect(element).toBeInTheDocument()
    expect(element).toHaveStyle({
      transform: 'scale(1)',
      opacity: '1'
    })
  })

  it('updates with state changes', () => {
    renderWithTheme(<Flow {...defaultProps} isActive={false} />)
    expect(screen.getByTestId('flow-component')).toHaveStyle({
      transform: 'scale(0.9)',
      opacity: '0.7'
    })
  })
}) 