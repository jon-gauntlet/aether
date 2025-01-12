import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FlowComponent } from '@/components/Flow'
import { ThemeProvider } from 'styled-components'
import { theme } from '@/styles/theme'

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
}

describe('FlowComponent', () => {
  it('renders without crashing', () => {
    renderWithTheme(<FlowComponent />)
    expect(screen.getByTestId('flow-container')).toBeInTheDocument()
  })

  it('responds to isInFlow prop', () => {
    renderWithTheme(<FlowComponent isInFlow={true} />)
    expect(screen.getByTestId('flow-container')).toHaveStyle({
      transform: expect.stringContaining('scale'),
    })
  })

  it('displays flow intensity when provided', () => {
    renderWithTheme(<FlowComponent flowIntensity={85} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('Flow Intensity')).toBeInTheDocument()
  })

  it('shows flow state indicator', () => {
    renderWithTheme(<FlowComponent isInFlow={true} flowIntensity={85} />)
    expect(screen.getByTestId('flow-indicator')).toHaveStyle({
      opacity: '0.85',
    })
  })
}) 