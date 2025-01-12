import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FieldComponent } from '@/components/Field'

describe('FieldComponent', () => {
  it('renders without crashing', () => {
    render(<FieldComponent />)
    expect(screen.getByTestId('field-container')).toBeInTheDocument()
  })

  it('responds to isActive prop', () => {
    render(<FieldComponent isActive={true} />)
    expect(screen.getByTestId('field-container')).toHaveStyle({
      transform: expect.stringContaining('scale'),
    })
  })

  it('displays metrics when provided', () => {
    render(<FieldComponent metrics={[{ value: 42, label: 'Test' }]} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
}) 