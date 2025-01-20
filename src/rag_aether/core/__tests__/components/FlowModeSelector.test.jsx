import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import FlowModeSelector from '../../../core/components/FlowModeSelector'

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

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('FlowModeSelector', () => {
  const mockOnSelect = vi.fn()
  const modes = ['Natural', 'Guided', 'Resonant']

  it('renders mode buttons', () => {
    renderWithTheme(
      <FlowModeSelector
        modes={modes}
        currentMode="Natural"
        onSelect={mockOnSelect}
      />
    )

    modes.forEach(mode => {
      expect(screen.getByText(mode)).toBeInTheDocument()
    })
  })

  it('highlights current mode', () => {
    renderWithTheme(
      <FlowModeSelector
        modes={modes}
        currentMode="Guided"
        onSelect={mockOnSelect}
      />
    )

    const guidedButton = screen.getByText('Guided')
    expect(guidedButton).toHaveStyle({
      background: 'rgba(0, 123, 255, 0.2)'
    })
  })

  it('calls onSelect when mode is clicked', () => {
    renderWithTheme(
      <FlowModeSelector
        modes={modes}
        currentMode="Natural"
        onSelect={mockOnSelect}
      />
    )

    fireEvent.click(screen.getByText('Guided'))
    expect(mockOnSelect).toHaveBeenCalledWith('Guided')
  })
}) 