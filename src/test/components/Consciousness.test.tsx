import { describe, it, expect } from 'vitest'
import { render, screen } from '../utils/test-utils'
import { ConsciousnessComponent } from '@/components/Consciousness'

describe('ConsciousnessComponent', () => {
  it('renders without crashing', () => {
    render(<ConsciousnessComponent />)
    expect(screen.getByTestId('consciousness-container')).toBeInTheDocument()
  })

  it('responds to isCoherent prop', () => {
    render(<ConsciousnessComponent isCoherent={true} />)
    expect(screen.getByTestId('consciousness-container')).toHaveStyle({
      transform: expect.stringContaining('scale'),
    })
  })

  it('displays energy level when provided', () => {
    render(<ConsciousnessComponent energyLevel={85} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('Energy Level')).toBeInTheDocument()
  })

  it('shows coherence status', () => {
    render(<ConsciousnessComponent isCoherent={true} />)
    expect(screen.getByTestId('coherence-status')).toHaveClass('coherent')
  })
}) 