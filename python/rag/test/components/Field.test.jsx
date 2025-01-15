import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import Field from '../../components/Field'
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
  energyLevel: 100,
  onStateChange: vi.fn(),
  isActive: true,
  type: 'physical'
}

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('Field Component', () => {
  beforeEach(() => {
    // Clear any previous renders
    document.body.innerHTML = ''
  })

  it('renders with default props', () => {
    renderWithTheme(<Field {...defaultProps} />)
    const fieldElement = screen.getByTestId('field-component')
    
    expect(fieldElement).toBeInTheDocument()
    expect(screen.getByText('physical Field')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('updates with energy level changes', () => {
    renderWithTheme(<Field {...defaultProps} energyLevel={50} isActive={false} />)
    const fieldElement = screen.getByTestId('field-component')
    
    expect(fieldElement).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('calls onStateChange when clicked', () => {
    const onStateChange = vi.fn()
    renderWithTheme(<Field {...defaultProps} onStateChange={onStateChange} />)
    
    const fieldElement = screen.getByTestId('field-component')
    fireEvent.click(fieldElement)
    
    expect(onStateChange).toHaveBeenCalledWith(false)
  })
}) 