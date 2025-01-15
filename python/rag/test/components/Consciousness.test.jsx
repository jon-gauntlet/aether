import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import Consciousness from '../../components/Consciousness'

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
  awarenessLevel: 100,
  onStateChange: () => {},
  isCoherent: true
}

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('Consciousness Component', () => {
  it('renders with default props', () => {
    renderWithTheme(<Consciousness {...defaultProps} />)
    const element = screen.getByTestId('consciousness-component')
    expect(element).toBeInTheDocument()
    expect(element).toHaveStyle({
      transform: 'scale(1)',
      opacity: '1'
    })
  })

  it('updates with awareness level changes', () => {
    renderWithTheme(<Consciousness {...defaultProps} awarenessLevel={50} />)
    expect(screen.getByTestId('consciousness-component')).toHaveStyle({
      transform: 'scale(0.5)',
      opacity: '0.5'
    })
  })
}) 