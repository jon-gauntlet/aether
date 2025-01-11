import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConsciousnessComponent } from '@/components/Consciousness'
import { ThemeProvider } from 'styled-components'
import { theme } from '@/styles/theme'

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
}

describe('ConsciousnessComponent', () => {
  it('renders without crashing', () => {
    renderWithTheme(<ConsciousnessComponent />)
    expect(screen.getByTestId('consciousness-container')).toBeInTheDocument()
  })

  it('responds to isCoherent prop', () => {
    renderWithTheme(<ConsciousnessComponent isCoherent={true} />)
    expect(screen.getByTestId('consciousness-container')).toHaveStyle({
      transform: expect.stringContaining('scale'),
    })
  })

  it('displays energy level when provided', () => {
    renderWithTheme(<ConsciousnessComponent energyLevel={85} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('Energy Level')).toBeInTheDocument()
  })

  it('shows coherence status', () => {
    renderWithTheme(<ConsciousnessComponent isCoherent={true} />)
    expect(screen.getByTestId('coherence-status')).toHaveStyle({
      backgroundColor: theme.colors.success,
    })
  })
}) 